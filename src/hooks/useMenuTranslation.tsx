import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "./useLanguage";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

interface TranslatedFields {
  name: string;
  description: string;
  ingredients: string;
  audio_text: string;
}

type TranslationCache = Record<string, Record<string, TranslatedFields>>;

const cache: TranslationCache = {};

function readCachedFromRow(item: any, lang: "en" | "es" | "fr"): TranslatedFields | null {
  const name = item[`name_${lang}`];
  if (!name) return null;
  return {
    name,
    description: item[`description_${lang}`] || item.description || "",
    ingredients: item[`ingredients_${lang}`] || item.ingredients || "",
    audio_text: item[`audio_text_${lang}`] || item.audio_text || "",
  };
}

export function useMenuTranslation(items: MenuItem[] | undefined) {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, TranslatedFields>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!items || items.length === 0 || language === "pt") {
      setTranslations({});
      return;
    }

    const lang = language as "en" | "es" | "fr";
    const cacheKey = lang;

    // 1. Build initial map from DB-cached translations (no AI cost)
    const initial: Record<string, TranslatedFields> = {};
    const missing: MenuItem[] = [];
    for (const item of items) {
      const cached = readCachedFromRow(item as any, lang);
      if (cached) {
        initial[item.id] = cached;
      } else {
        missing.push(item);
      }
    }

    // Merge with in-memory cache
    if (cache[cacheKey]) {
      for (const id of Object.keys(cache[cacheKey])) {
        if (!initial[id]) initial[id] = cache[cacheKey][id];
      }
    }

    setTranslations(initial);

    // Nothing missing: done, no edge call
    const stillMissing = missing.filter((i) => !initial[i.id]);
    if (stillMissing.length === 0) {
      cache[cacheKey] = { ...(cache[cacheKey] || {}), ...initial };
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("translate-menu", {
          body: { items: stillMissing, targetLang: lang },
        });

        if (cancelled) return;

        if (!error && data?.translations) {
          const merged = { ...initial, ...data.translations };
          cache[cacheKey] = merged;
          setTranslations(merged);
        } else if (data?.code === "ai_credits_exhausted") {
          toast.error("Tradução indisponível: créditos de IA esgotados no Lovable AI.");
        } else if (error) {
          console.error("translate-menu error:", error);
          toast.error("Não foi possível traduzir o cardápio agora.");
        }
      } catch (e) {
        console.error("Translation failed:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [items, language]);

  const getTranslated = useCallback(
    (item: MenuItem): MenuItem => {
      if (language === "pt" || !translations[item.id]) return item;
      const t = translations[item.id];
      return {
        ...item,
        name: t.name || item.name,
        description: t.description || item.description,
        ingredients: t.ingredients || item.ingredients,
        audio_text: t.audio_text || item.audio_text,
      };
    },
    [language, translations]
  );

  return { getTranslated, translating: loading };
}
