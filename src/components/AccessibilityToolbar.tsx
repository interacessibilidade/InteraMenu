import { useState } from "react";
import { Accessibility, Plus, Minus, Eye, Palette, Type, RotateCcw } from "lucide-react";
import { useAccessibility } from "@/hooks/useAccessibility";
import { motion, AnimatePresence } from "framer-motion";

export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const { fontSize, highContrast, grayscale, dyslexiaFont, increaseFontSize, decreaseFontSize, toggleHighContrast, toggleGrayscale, toggleDyslexiaFont, resetAll } = useAccessibility();

  const tools = [
    { icon: Plus, label: `Aumentar fonte (${fontSize}px)`, action: increaseFontSize, active: fontSize > 16 },
    { icon: Minus, label: `Diminuir fonte (${fontSize}px)`, action: decreaseFontSize, active: fontSize < 16 },
    { icon: Eye, label: "Alto contraste", action: toggleHighContrast, active: highContrast },
    { icon: Palette, label: "Escala de cinza", action: toggleGrayscale, active: grayscale },
    { icon: Type, label: "Fonte para dislexia", action: toggleDyslexiaFont, active: dyslexiaFont },
    { icon: RotateCcw, label: "Restaurar padrão", action: resetAll, active: false },
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
            aria-label="Ferramentas de acessibilidade"
          >
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Acessibilidade</p>
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
        aria-label={open ? "Fechar acessibilidade" : "Abrir acessibilidade"}
        aria-expanded={open}
      >
        <Accessibility className="w-7 h-7" />
      </button>
    </div>
  );
}
