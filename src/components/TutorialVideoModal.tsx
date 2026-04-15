import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { X, Play, Pause, RotateCcw, Volume2, VolumeX, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

interface TutorialVideoModalProps {
  open: boolean;
  onClose: () => void;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5];

export function TutorialVideoModal({ open, onClose }: TutorialVideoModalProps) {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");

  useEffect(() => {
    if (open) {
      // Focus the close button first, then autoplay
      setTimeout(() => {
        closeButtonRef.current?.focus();
        const v = videoRef.current;
        if (v) {
          v.play().then(() => {
            setPlaying(true);
            setLiveMessage(t("tutorial.aria.started"));
          }).catch(() => {
            // autoplay blocked
            setLiveMessage(t("tutorial.aria.ready"));
          });
        }
      }, 100);
    } else {
      setPlaying(false);
      setSpeed(1);
      setShowSpeedMenu(false);
      setLiveMessage("");
    }
  }, [open, t]);

  // Focus trap: cycle Tab from last element back to close button
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const modal = closeButtonRef.current?.closest('[role="dialog"]');
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
      setLiveMessage(t("tutorial.aria.playing"));
    } else {
      v.pause();
      setPlaying(false);
      setLiveMessage(t("tutorial.aria.paused"));
    }
  }, [t]);

  const stopVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setPlaying(false);
    setLiveMessage(t("tutorial.aria.stopped"));
  }, [t]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const changeSpeed = useCallback((s: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = s;
    setSpeed(s);
    setShowSpeedMenu(false);
  }, []);

  const handleVideoKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      togglePlay();
    }
  }, [togglePlay]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={t("tutorial.modal.aria")}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-lg w-full max-w-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-foreground">{t("tutorial.title")}</h2>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="p-1 rounded-md hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={t("tutorial.close")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video */}
            <div className="aspect-video bg-black">
              <video
                ref={videoRef}
                src="/videos/tutorial-cardapio.mp4"
                className="w-full h-full"
                preload="none"
                playsInline
                tabIndex={0}
                aria-label={t("tutorial.modal.aria")}
                onKeyDown={handleVideoKeyDown}
                onEnded={() => {
                  setPlaying(false);
                  setLiveMessage(t("tutorial.aria.ended"));
                }}
              />
            </div>

            {/* Live region for screen reader feedback */}
            <div aria-live="polite" aria-atomic="true" className="sr-only">
              {liveMessage}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 p-3 border-t border-border flex-wrap" role="toolbar" aria-label={t("tutorial.aria.controls")}>
              <button
                onClick={togglePlay}
                className="p-2 rounded-md hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={playing ? t("tutorial.pause") : t("tutorial.play")}
              >
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={stopVideo}
                className="p-2 rounded-md hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={t("tutorial.stop")}
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              <button
                onClick={toggleMute}
                className="p-2 rounded-md hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label={muted ? t("tutorial.unmute") : t("tutorial.mute")}
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              {/* Speed control */}
              <div className="relative ml-auto">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-sm hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label={t("tutorial.speed")}
                  aria-expanded={showSpeedMenu}
                  aria-haspopup="true"
                >
                  <Gauge className="w-4 h-4" />
                  <span>{speed}x</span>
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full right-0 mb-1 bg-popover border border-border rounded-md shadow-lg py-1 z-10" role="menu">
                    {SPEED_OPTIONS.map((s) => (
                      <button
                        key={s}
                        role="menuitem"
                        onClick={() => changeSpeed(s)}
                        className={`block w-full text-left px-4 py-1.5 text-sm transition-colors ${
                          speed === s ? "bg-accent text-accent-foreground font-semibold" : "hover:bg-secondary"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}