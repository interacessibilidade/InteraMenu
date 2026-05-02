import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PlayCircle, ArrowRight, Volume2, Square } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

const STORAGE_KEY = "welcome_modal_dismissed";

interface WelcomeModalProps {
  onWatchVideo: () => void;
}

export function WelcomeModal({ onWatchVideo }: WelcomeModalProps) {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => titleRef.current?.focus(), 80);
  }, [open]);

  // Focus trap + Esc
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open]);

  // Stop speech on unmount/close
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const persist = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const stopSpeech = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
  };

  const dismiss = () => {
    persist();
    stopSpeech();
    setOpen(false);
  };

  const handleWatchVideo = () => {
    persist();
    stopSpeech();
    setOpen(false);
    onWatchVideo();
  };

  const handleListen = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (speaking) {
      stopSpeech();
      return;
    }
    const text = `${t("welcome.title")}. ${t("welcome.message")}`;
    const utter = new SpeechSynthesisUtterance(text);
    const langMap: Record<string, string> = {
      pt: "pt-BR",
      en: "en-US",
      es: "es-ES",
      fr: "fr-FR",
    };
    utter.lang = langMap[language] || "pt-BR";
    utter.rate = 1;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    setSpeaking(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
          aria-describedby="welcome-desc"
          aria-label={t("welcome.modal.aria")}
        >
          <motion.div
            ref={dialogRef}
            initial={{ scale: 0.94, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative bg-card rounded-2xl w-full max-w-md shadow-2xl max-h-[95vh] overflow-y-auto border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              ref={closeBtnRef}
              onClick={dismiss}
              className="absolute right-3 top-3 p-2 rounded-full hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label={t("welcome.close")}
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="text-center space-y-3 pt-2">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-3xl" aria-hidden="true">☕</span>
                </div>
                <h2
                  id="welcome-title"
                  ref={titleRef}
                  tabIndex={-1}
                  className="text-xl sm:text-2xl font-extrabold text-foreground leading-tight focus:outline-none"
                >
                  {t("welcome.title")}
                </h2>
                <p
                  id="welcome-desc"
                  className="text-sm sm:text-base text-muted-foreground leading-relaxed"
                >
                  {t("welcome.message")}
                </p>
              </div>

              {/* Listen button */}
              <div className="flex justify-center">
                <button
                  onClick={handleListen}
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-md px-2 py-1"
                  aria-label={speaking ? t("welcome.stopListen") : t("welcome.listen")}
                  aria-pressed={speaking}
                >
                  {speaking ? (
                    <Square className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>{speaking ? t("welcome.stopListen") : t("welcome.listen")}</span>
                </button>
              </div>

              {/* Video question */}
              <div className="text-center pt-2 border-t border-border">
                <p className="text-sm font-semibold text-foreground mt-4 mb-3">
                  {t("welcome.videoQuestion")}
                </p>

                {/* Action buttons */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleWatchVideo}
                    aria-label={t("welcome.watchVideo.aria")}
                    className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <PlayCircle className="w-5 h-5" aria-hidden="true" />
                    <span>{t("welcome.watchVideo")}</span>
                  </button>
                  <button
                    onClick={dismiss}
                    aria-label={t("welcome.goToMenu.aria")}
                    className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-lg border-2 border-input bg-background text-foreground font-semibold text-base hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                    <span>{t("welcome.goToMenu")}</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}