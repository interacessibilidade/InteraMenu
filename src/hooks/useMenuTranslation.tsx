import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "./useLanguage";
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

export function useMenuTranslation(items: MenuItem[] | undefined) {
  const { language } = useLanguage();
  const [translations, setTranslations] = useState<Record<string, TranslatedFields>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!items || items.length === 0 || language === "pt") {
      setTranslations({});
      return;
    }

    const cacheKey = language;
    if (cache[cacheKey] && Object.keys(cache[cacheKey]).length >= items.length) {
      setTranslations(cache[cacheKey]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("translate-menu", {
          body: { items, targetLang: language },
        });

        if (cancelled) return;

        if (!error && data?.translations) {
          cache[cacheKey] = data.translations;
          setTranslations(data.translations);
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
