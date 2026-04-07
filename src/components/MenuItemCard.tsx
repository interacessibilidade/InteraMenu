import { useState } from "react";
import { Volume2, Hand, AlertTriangle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { LibrasModal } from "./LibrasModal";
import { useLanguage, getAudioLang } from "@/hooks/useLanguage";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

export function MenuItemCard({ item }: { item: MenuItem }) {
  const [librasOpen, setLibrasOpen] = useState(false);
  const { t, language } = useLanguage();

  function speakText(text: string) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getAudioLang(language);
    utterance.rate = 0.9;
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
            <div className="flex flex-wrap gap-1.5" role="list" aria-label={t("allergen.gluten")}>
              {item.allergens.map((a) => (
                <span
                  key={a}
                  role="listitem"
                  className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-destructive/10 text-destructive"
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
              aria-label={`${t("audio")} - ${item.name}`}
            >
              <Volume2 className="w-4 h-4" aria-hidden="true" />
              <span>{t("audio")}</span>
            </button>

            {showLibras && (
              <button
                onClick={() => setLibrasOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={`${t("libras")} - ${item.name}`}
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
