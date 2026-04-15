import { useState } from "react";
import { Play, Pause, ImageIcon, AlertTriangle, X, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage, getAudioLang, type Language } from "@/hooks/useLanguage";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

const audioCurrencyLabels: Record<Language, string> = {
  pt: "reais",
  en: "Brazilian reais",
  es: "reales",
  fr: "euros",
};

function buildAudioText(item: MenuItem, language: Language) {
  if (item.audio_text) return item.audio_text;
  const formattedPrice = new Intl.NumberFormat(getAudioLang(language), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(item.price));
  return [item.name, item.description, `${formattedPrice} ${audioCurrencyLabels[language]}`, item.ingredients]
    .filter((value): value is string => Boolean(value))
    .join(". ");
}

export function MenuItemCard({ item }: { item: MenuItem }) {
  const { t, language } = useLanguage();
  const audioText = buildAudioText(item, language);
  const { audioState, isSupported, togglePlayback } = useSpeechSynthesis({
    itemId: item.id,
    text: audioText,
    lang: getAudioLang(language),
    fallbackLang: "en-US",
  });

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [ingredientImageUrl, setIngredientImageUrl] = useState<string | null>(
    (item as any).ingredientes_imagem_url || null
  );
  const [generating, setGenerating] = useState(false);

  const hasIngredients = !!item.ingredients;

  const handleViewIngredients = async () => {
    if (ingredientImageUrl) {
      setImageModalOpen(true);
      return;
    }

    if (!item.ingredients) return;

    setGenerating(true);
    setImageModalOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-ingredient-image", {
        body: {
          itemId: item.id,
          itemName: item.name,
          ingredients: item.ingredients,
        },
      });

      if (error) throw error;
      if (data?.url) {
        setIngredientImageUrl(data.url);
      } else {
        throw new Error(data?.error || "Failed to generate image");
      }
    } catch (e: any) {
      console.error("Error generating ingredient image:", e);
      toast.error(t("ingredients.image.error"));
      setImageModalOpen(false);
    } finally {
      setGenerating(false);
    }
  };

  const audioButtonText = !isSupported
    ? t("audio.unavailable")
    : audioState === "playing"
      ? t("audio.pause")
      : audioState === "paused"
        ? t("audio.resume")
        : t("audio.play");
  const audioAriaLabel = !isSupported
    ? t("audio.aria.unavailable")
    : audioState === "playing"
      ? t("audio.aria.pause")
      : audioState === "paused"
        ? t("audio.aria.resume")
        : t("audio.aria.listen");
  const audioStatusId = `menu-item-audio-status-${item.id}`;
  const audioStatusText = !isSupported
    ? t("audio.status.unavailable")
    : audioState === "playing"
      ? t("audio.status.playing")
      : audioState === "paused"
        ? t("audio.status.paused")
        : t("audio.status.ready");

  return (
    <>
      <article
        className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        aria-label={item.name}
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

            {hasIngredients && (
              <button
                type="button"
                onClick={handleViewIngredients}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={`${t("ingredients.image.aria")} ${item.name}`}
              >
                <ImageIcon className="w-4 h-4" aria-hidden="true" />
                <span>{t("ingredients.image.button")}</span>
              </button>
            )}
          </div>
        </div>
      </article>

      {/* Ingredient Image Modal */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`${t("ingredients.image.modal.title")} ${item.name}`}
          onClick={() => setImageModalOpen(false)}
        >
          <div
            className="bg-card rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-base font-bold text-foreground truncate">
                {t("ingredients.image.modal.title")} – {item.name}
              </h2>
              <button
                onClick={() => setImageModalOpen(false)}
                className="p-1.5 rounded-md hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={t("ingredients.image.modal.close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {generating ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground font-medium">
                    {t("ingredients.image.loading")}
                  </p>
                </div>
              ) : ingredientImageUrl ? (
                <img
                  src={ingredientImageUrl}
                  alt={t("ingredients.image.figure_alt")}
                  className="w-full rounded-lg"
                  loading="lazy"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
