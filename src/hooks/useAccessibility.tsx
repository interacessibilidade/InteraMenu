import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface AccessibilityState {
  fontSize: number;
  highContrast: boolean;
  grayscale: boolean;
  dyslexiaFont: boolean;
}

interface AccessibilityContextType extends AccessibilityState {
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  toggleHighContrast: () => void;
  toggleGrayscale: () => void;
  toggleDyslexiaFont: () => void;
  resetAll: () => void;
}

const defaultState: AccessibilityState = {
  fontSize: 16,
  highContrast: false,
  grayscale: false,
  dyslexiaFont: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccessibilityState>(defaultState);

  const increaseFontSize = useCallback(() => {
    setState((s) => {
      const next = Math.min(s.fontSize + 2, 28);
      document.documentElement.style.fontSize = `${next}px`;
      return { ...s, fontSize: next };
    });
  }, []);

  const decreaseFontSize = useCallback(() => {
    setState((s) => {
      const next = Math.max(s.fontSize - 2, 12);
      document.documentElement.style.fontSize = `${next}px`;
      return { ...s, fontSize: next };
    });
  }, []);

  const toggleHighContrast = useCallback(() => {
    setState((s) => {
      const next = !s.highContrast;
      document.documentElement.classList.toggle("high-contrast", next);
      return { ...s, highContrast: next };
    });
  }, []);

  const toggleGrayscale = useCallback(() => {
    setState((s) => {
      const next = !s.grayscale;
      document.documentElement.classList.toggle("grayscale-mode", next);
      return { ...s, grayscale: next };
    });
  }, []);

  const toggleDyslexiaFont = useCallback(() => {
    setState((s) => {
      const next = !s.dyslexiaFont;
      document.documentElement.classList.toggle("dyslexia-font", next);
      return { ...s, dyslexiaFont: next };
    });
  }, []);

  const resetAll = useCallback(() => {
    document.documentElement.style.fontSize = "16px";
    document.documentElement.classList.remove("high-contrast", "grayscale-mode", "dyslexia-font");
    setState(defaultState);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{ ...state, increaseFontSize, decreaseFontSize, toggleHighContrast, toggleGrayscale, toggleDyslexiaFont, resetAll }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used within AccessibilityProvider");
  return ctx;
}
