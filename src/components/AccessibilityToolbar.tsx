import { useState, useRef, useEffect } from "react";
import { Accessibility, Plus, Minus, Eye, Palette, Type, RotateCcw } from "lucide-react";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useLanguage } from "@/hooks/useLanguage";
import { motion, AnimatePresence } from "framer-motion";

export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => firstItemRef.current?.focus(), 100);
    }
  }, [open]);

  const { fontSize, highContrast, grayscale, dyslexiaFont, increaseFontSize, decreaseFontSize, toggleHighContrast, toggleGrayscale, toggleDyslexiaFont, resetAll } = useAccessibility();
  const { t } = useLanguage();

  // Announce status (enabled/disabled) for screen readers when toggled
  const announceToggle = (label: string, willBeActive: boolean) => {
    const status = willBeActive ? t("accessibility.enabled") : t("accessibility.disabled");
    // Force re-announcement even if same message: append zero-width space alternation
    setLiveMessage("");
    setTimeout(() => setLiveMessage(`${label}: ${status}`), 50);
  };

  const handleIncrease = () => {
    increaseFontSize();
    setLiveMessage("");
    setTimeout(() => setLiveMessage(`${t("accessibility.font_size")} ${Math.min(fontSize + 2, 28)}px`), 50);
  };
  const handleDecrease = () => {
    decreaseFontSize();
    setLiveMessage("");
    setTimeout(() => setLiveMessage(`${t("accessibility.font_size")} ${Math.max(fontSize - 2, 12)}px`), 50);
  };
  const handleHighContrast = () => {
    announceToggle(t("accessibility.high_contrast"), !highContrast);
    toggleHighContrast();
  };
  const handleGrayscale = () => {
    announceToggle(t("accessibility.grayscale"), !grayscale);
    toggleGrayscale();
  };
  const handleDyslexia = () => {
    announceToggle(t("accessibility.dyslexia_font"), !dyslexiaFont);
    toggleDyslexiaFont();
  };
  const handleReset = () => {
    resetAll();
    setLiveMessage("");
    setTimeout(() => setLiveMessage(t("accessibility.reset.done")), 50);
  };

  const tools = [
    { icon: Plus, label: `${t("accessibility.increase_font")} (${fontSize}px)`, action: handleIncrease, active: fontSize > 16 },
    { icon: Minus, label: `${t("accessibility.decrease_font")} (${fontSize}px)`, action: handleDecrease, active: fontSize < 16 },
    { icon: Eye, label: t("accessibility.high_contrast"), action: handleHighContrast, active: highContrast },
    { icon: Palette, label: t("accessibility.grayscale"), action: handleGrayscale, active: grayscale },
    { icon: Type, label: t("accessibility.dyslexia_font"), action: handleDyslexia, active: dyslexiaFont },
    { icon: RotateCcw, label: t("accessibility.reset"), action: handleReset, active: false, isReset: true },
  ];

  return (
    <div ref={containerRef} className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {/* Live region for screen reader feedback */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMessage}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-card border border-border rounded-lg shadow-xl p-3 flex flex-col gap-2 min-w-[220px]"
            role="menu"
            aria-label={t("accessibility.title")}
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{t("accessibility.title")}</p>
            {tools.map((tool, index) => (
                <button
                key={tool.label}
                ref={index === 0 ? firstItemRef : undefined}
                role="menuitem"
                onClick={tool.action}
                className={`interactive-feedback flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium
                  ${(tool as any).isReset ? "bg-primary/15 text-primary hover:bg-primary/25 font-semibold" : tool.active ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"}`}
                aria-label={tool.label}
                aria-pressed={tool.active}
              >
                <tool.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{tool.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className="interactive-feedback w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105"
        aria-label={open ? t("accessibility.close") : t("accessibility.open.description")}
        aria-expanded={open}
      >
        <Accessibility className="w-7 h-7" />
      </button>
    </div>
  );
}
