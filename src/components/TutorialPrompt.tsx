import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";

const STORAGE_KEY = "tutorial_prompt_dismissed";

interface TutorialPromptProps {
  onWatch: () => void;
}

export function TutorialPrompt({ onWatch }: TutorialPromptProps) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  const handleWatch = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    onWatch();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="container py-2"
        >
          <div className="flex items-center justify-between gap-3 bg-accent/50 border border-border rounded-lg px-4 py-3">
            <p className="text-sm text-foreground font-medium">{t("tutorial.prompt")}</p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleWatch}
                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {t("tutorial.watchNow")}
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-1.5 text-xs font-medium rounded-md border border-input hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {t("tutorial.later")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
