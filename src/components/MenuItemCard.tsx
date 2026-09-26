import { useState, useRef, useEffect } from "react";
import { Play, Pause, ImageIcon, AlertTriangle, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useLanguage, getAudioLang, type Language } from "@/hooks/useLanguage";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { AddToOrderControl } from "@/components/ordering/AddToOrderControl";

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

export function MenuItemCard({
  item,
  showIngredientsButton = true,
  orderingEnabled = false,
}: {
  item: MenuItem;
  showIngredientsButton?: boolean;
  orderingEnabled?: boolean;
}) {
  const { t, language } = useLanguage();
  const audioText = buildAudioText(item, language);
  const { audioState, isSupported, togglePlayback } = useSpeechSynthesis({
    itemId: item.id,
    text: audioText,
    lang: getAudioLang(language),
    fallbackLang: "en-US",
  });

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const ingredientImageUrl = (item as any).ingredientes_imagem_url || null;

  // Só mostra o botão de ver ingredientes quando existe uma foto enviada
  // manualmente pelo restaurante — a geração automática por IA foi desativada.
  const hasIngredients = !!ingredientImageUrl && showIngredientsButton;

  const handleViewIngredients = () => {
    setImageModalOpen(true);
  };

  useEffect(() => {
    if (imageModalOpen) {
      closeButtonRef.current?.focus();
    }
  }, [imageModalOpen]);

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
        className="bg-card rounded-lg border border-border overflow-hidden shadow-sm hover:shadow-md"
        aria-label={item.name}
      >
        {item.image_url && (
          <div className="aspect-[16/10] overflow-hidden bg-muted flex items-center justify-center">
            <img
              src={item.image_url}
              alt={item.image_alt || item.name}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        )}

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-bold text-foreground leading-tight">{item.name}</h3>
            <span className="text-lg font-extrabold text-primary whitespace-nowrap">
              <span aria-hidden="true">R$ {Number(item.price).toFixed(2).replace(".", ",")}</span>
              <span className="sr-only">
                {(() => {
                  const [reaisPart, centavosPart] = Number(item.price).toFixed(2).split(".");
                  const reaisNum = Number(reaisPart);
                  const centavosNum = Number(centavosPart);
                  const reaisLabel = `${reaisNum} ${reaisNum === 1 ? "real" : "reais"}`;
                  const centavosLabel = centavosNum > 0 ? ` e ${centavosNum} ${centavosNum === 1 ? "centavo" : "centavos"}` : "";
                  return `${reaisLabel}${centavosLabel}`;
                })()}
              </span>
            </span>
          </div>

          {item.description && (
            <p className="text-sm text-foreground/80 leading-relaxed">{item.description}</p>
          )}

          {item.ingredients && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground/70">Ingredientes: </span>
              {item.ingredients}
            </p>
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
              className="interactive-feedback flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-60"
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

            <p id={audioStatusId} className="sr-only" aria-live="polite" aria-hidden="true">
              {audioStatusText}
            </p>

            {hasIngredients && (
              <button
                type="button"
                onClick={handleViewIngredients}
                className="interactive-feedback flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80"
                aria-label={`${t("ingredients.image.aria")} ${item.name}`}
              >
                <ImageIcon className="w-4 h-4" aria-hidden="true" />
                <span>{t("ingredients.image.button")}</span>
              </button>
            )}
          </div>

          {orderingEnabled && (
            <AddToOrderControl menuItemId={item.id} itemName={item.name} price={Number(item.price)} />
          )}
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
                ref={closeButtonRef}
                onClick={() => setImageModalOpen(false)}
                className="interactive-feedback p-1.5 rounded-md hover:bg-secondary"
                aria-label={t("ingredients.image.modal.close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {ingredientImageUrl ? (
                <img
                  src={ingredientImageUrl}
                  alt={`Ilustração dos ingredientes de ${item.name}: ${item.ingredients || ""}`}
                  className="w-full rounded-lg"
                  loading="lazy"
                />
              ) : null}
              {item.ingredients && (
                <p className="text-sm text-foreground">
                  <strong>Ingredientes:</strong> {item.ingredients}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
