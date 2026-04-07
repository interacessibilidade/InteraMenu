import { useState } from "react";
import { PersonStanding, Plus, Minus, Eye, Palette, Type, RotateCcw } from "lucide-react";
import { useAccessibility } from "@/hooks/useAccessibility";
import { useLanguage } from "@/hooks/useLanguage";
import { motion, AnimatePresence } from "framer-motion";

export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const { fontSize, highContrast, grayscale, dyslexiaFont, increaseFontSize, decreaseFontSize, toggleHighContrast, toggleGrayscale, toggleDyslexiaFont, resetAll } = useAccessibility();
  const { t } = useLanguage();

  const tools = [
    { icon: Plus, label: `${t("accessibility.increase_font")} (${fontSize}px)`, action: increaseFontSize, active: fontSize > 16 },
    { icon: Minus, label: `${t("accessibility.decrease_font")} (${fontSize}px)`, action: decreaseFontSize, active: fontSize < 16 },
    { icon: Eye, label: t("accessibility.high_contrast"), action: toggleHighContrast, active: highContrast },
    { icon: Palette, label: t("accessibility.grayscale"), action: toggleGrayscale, active: grayscale },
    { icon: Type, label: t("accessibility.dyslexia_font"), action: toggleDyslexiaFont, active: dyslexiaFont },
    { icon: RotateCcw, label: t("accessibility.reset"), action: resetAll, active: false },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-card border border-border rounded-lg shadow-xl p-3 flex flex-col gap-2 min-w-[220px]"
            role="toolbar"
            aria-label={t("accessibility.title")}
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">{t("accessibility.title")}</p>
            {tools.map((tool) => (
              <button
                key={tool.label}
                onClick={tool.action}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                  ${tool.active ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground"}`}
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
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform focus:outline-none focus:ring-4 focus:ring-ring"
        aria-label={open ? t("accessibility.close") : t("accessibility.open")}
        aria-expanded={open}
      >
        <PersonStanding className="w-7 h-7" />
      </button>
    </div>
  );
}
