import { useState, useEffect } from "react";
import { Volume2, Hand, AlertTriangle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { LibrasModal } from "./LibrasModal";
import { useLanguage, getAudioLang } from "@/hooks/useLanguage";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

function findVoiceForLang(targetLang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = targetLang.split("-")[0];

  // Keyword hints per language
  const keywords: Record<string, string[]> = {
    es: ["spanish", "español", "paulina", "jorge", "monica"],
    fr: ["french", "français", "thomas", "amelie", "marie"],
    pt: ["portuguese", "português", "luciana", "felipe"],
    en: ["english", "samantha", "daniel", "alex"],
  };

  // 1. Exact lang match
  const exact = voices.find((v) => v.lang === targetLang);
  if (exact) return exact;

  // 2. Prefix match
  const prefix = voices.find((v) => v.lang.startsWith(langPrefix + "-"));
  if (prefix) return prefix;

  // 3. Keyword match in voice name
  const hints = keywords[langPrefix] || [];
  const byName = voices.find((v) =>
    hints.some((kw) => v.name.toLowerCase().includes(kw))
  );
  if (byName) return byName;

  return null;
}

export function MenuItemCard({ item }: { item: MenuItem }) {
  const [librasOpen, setLibrasOpen] = useState(false);
  const { t, language } = useLanguage();

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  function speakText(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const targetLang = getAudioLang(language);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;
    utterance.rate = 0.9;

    const voice = findVoiceForLang(targetLang);
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  }

  const audioText = item.audio_text || `${item.name}. ${item.description || ""} ${item.price} ${language === "pt" ? "reais" : language === "es" ? "reales" : language === "fr" ? "euros" : "dollars"}. ${item.ingredients || ""}`;

  const showLibras = language === "pt" && !!item.libras_video_url;

  return (
    <>
      <article
        className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        aria-label={`${item.name}`}
      >
        {item.image_url && (
          <div className="aspect-[16/10] overflow-hidden">
            <img
              src={item.image_url}
              alt={item.image_alt || item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-foreground leading-tight">{item.name}</h3>
            <span className="text-lg font-extrabold text-primary whitespace-nowrap">
              R$ {Number(item.price).toFixed(2).replace(".", ",")}
            </span>
          </div>

          {item.ingredients && (
            <p className="text-sm text-muted-foreground leading-relaxed">{item.ingredients}</p>
          )}

          {item.allergens && item.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="list" aria-label="Alérgenos do prato">
              {item.allergens.map((a) => (
                <span
                  key={a}
                  role="listitem"
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary"
                >
                  <AlertTriangle className="w-3 h-3" aria-hidden="true" />
                  {t(`allergen.${a}`) !== `allergen.${a}` ? t(`allergen.${a}`) : a}
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => speakText(audioText)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={`Escutar descrição do item de cardápio ${item.name}`}
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              <span>{t("audio")}</span>
            </button>

            {showLibras && (
              <button
                onClick={() => setLibrasOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={`Ver tradução em Libras do item ${item.name}`}
              >
                <Hand className="w-4 h-4" aria-hidden="true" />
                <span>{t("libras")}</span>
              </button>
            )}
          </div>
        </div>
      </article>

      {showLibras && (
        <LibrasModal
          open={librasOpen}
          onClose={() => setLibrasOpen(false)}
          videoUrl={item.libras_video_url!}
          itemName={item.name}
        />
      )}
    </>
  );
}
