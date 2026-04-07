import { useState, useEffect, useCallback } from "react";
import { Volume2, Pause, Play, Hand, AlertTriangle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { LibrasModal } from "./LibrasModal";
import { useLanguage, getAudioLang } from "@/hooks/useLanguage";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];

type AudioState = "idle" | "playing" | "paused";

function findVoiceForLang(targetLang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const langPrefix = targetLang.split("-")[0];

  const keywords: Record<string, string[]> = {
    es: ["spanish", "español", "paulina", "jorge", "monica"],
    fr: ["french", "français", "thomas", "amelie", "marie"],
    pt: ["portuguese", "português", "luciana", "felipe"],
    en: ["english", "samantha", "daniel", "alex"],
  };

  const exact = voices.find((v) => v.lang === targetLang);
  if (exact) return exact;

  const prefix = voices.find((v) => v.lang.startsWith(langPrefix + "-"));
  if (prefix) return prefix;

  const hints = keywords[langPrefix] || [];
  const byName = voices.find((v) =>
    hints.some((kw) => v.name.toLowerCase().includes(kw))
  );
  if (byName) return byName;

  return null;
}

export function MenuItemCard({ item }: { item: MenuItem }) {
  const [librasOpen, setLibrasOpen] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>("idle");
  const { t, language } = useLanguage();

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
  }, []);

  // Reset state when speech ends or is cancelled externally
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioState !== "idle" && !window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        setAudioState("idle");
      }
    }, 200);
    return () => clearInterval(interval);
  }, [audioState]);

  const handleAudio = useCallback(() => {
    if (!("speechSynthesis" in window)) return;

    if (audioState === "playing") {
      window.speechSynthesis.pause();
      setAudioState("paused");
      return;
    }

    if (audioState === "paused") {
      window.speechSynthesis.resume();
      setAudioState("playing");
      return;
    }

    // idle → start new
    window.speechSynthesis.cancel();
    const targetLang = getAudioLang(language);
    const text = item.audio_text || `${item.name}. ${item.description || ""} ${item.price} ${language === "pt" ? "reais" : language === "es" ? "reales" : language === "fr" ? "euros" : "dollars"}. ${item.ingredients || ""}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = targetLang;
    utterance.rate = 0.9;

    const voice = findVoiceForLang(targetLang);
    if (voice) utterance.voice = voice;

    utterance.onend = () => setAudioState("idle");
    utterance.onerror = () => setAudioState("idle");

    window.speechSynthesis.speak(utterance);
    setAudioState("playing");
  }, [audioState, language, item]);

  const audioLabel =
    audioState === "playing"
      ? "Pausar áudio"
      : audioState === "paused"
        ? "Retomar áudio"
        : "Escutar o item de cardápio";

  const audioButtonText =
    audioState === "playing"
      ? t("audio.pause") !== "audio.pause" ? t("audio.pause") : "Pausar"
      : audioState === "paused"
        ? t("audio.resume") !== "audio.resume" ? t("audio.resume") : "Retomar"
        : t("audio");

  const AudioIcon = audioState === "playing" ? Pause : audioState === "paused" ? Play : Volume2;

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
              onClick={handleAudio}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={audioLabel}
            >
              <AudioIcon className="w-4 h-4" aria-hidden="true" />
              <span>{audioButtonText}</span>
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
