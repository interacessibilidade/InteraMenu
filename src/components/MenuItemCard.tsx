import { useState } from "react";
import { Play, Pause, Hand, AlertTriangle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { LibrasModal } from "./LibrasModal";
import { useLanguage, getAudioLang, type Language } from "@/hooks/useLanguage";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

const audioCurrencyLabels: Record<Language, string> = {
  pt: "reais",
  en: "Brazilian reais",
  es: "reales",
  fr: "euros",
};

function buildAudioText(item: MenuItem, language: Language) {
  if (item.audio_text) {
    return item.audio_text;
  }

  const formattedPrice = new Intl.NumberFormat(getAudioLang(language), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(item.price));

  return [item.name, item.description, `${formattedPrice} ${audioCurrencyLabels[language]}`, item.ingredients]
    .filter((value): value is string => Boolean(value))
    .join(". ");
}

export function MenuItemCard({ item }: { item: MenuItem }) {
  const [librasOpen, setLibrasOpen] = useState(false);
  const { t, language } = useLanguage();
  const audioText = buildAudioText(item, language);
  const { audioState, isSupported, togglePlayback } = useSpeechSynthesis({
    itemId: item.id,
    text: audioText,
    lang: getAudioLang(language),
    fallbackLang: "en-US",
  });

  const showLibras = language === "pt" && !!item.libras_video_url;
  const audioButtonText = !isSupported
    ? t("audio.unavailable")
    : audioState === "playing"
      ? t("audio.pause")
      : audioState === "paused"
        ? t("audio.resume")
        : t("audio.play");
  const audioStatusText = !isSupported
    ? t("audio.status.unavailable")
    : audioState === "playing"
      ? t("audio.status.playing")
      : audioState === "paused"
        ? t("audio.status.paused")
        : t("audio.status.ready");
  const audioAriaLabel = !isSupported
    ? t("audio.aria.unavailable")
    : audioState === "playing"
      ? t("audio.aria.pause")
      : audioState === "paused"
        ? t("audio.aria.resume")
        : t("audio.aria.listen");
  const audioStatusId = `menu-item-audio-status-${item.id}`;

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

          {item.description && (
            <p className="text-sm text-foreground/80 leading-relaxed">{item.description}</p>
          )}

          {item.ingredients && (
            <p className="text-xs text-muted-foreground leading-relaxed">{item.ingredients}</p>
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
              type="button"
              onClick={togglePlayback}
              disabled={!isSupported}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label={audioAriaLabel}
              aria-describedby={audioStatusId}
              aria-pressed={audioState === "playing"}
            >
              {audioState === "playing" ? (
                <Pause className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Play className="w-4 h-4" aria-hidden="true" />
              )}
              <span>{audioButtonText}</span>
            </button>

            <p id={audioStatusId} className="sr-only" aria-live="polite">
              {audioStatusText}
            </p>

            {showLibras && (
              <button
                type="button"
                onClick={() => setLibrasOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label={`${t("libras.description")} ${item.name}`}
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
