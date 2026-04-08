import { useState, useRef, useEffect } from "react";
import { useLanguage, type Language } from "@/hooks/useLanguage";
import { Globe, ChevronDown } from "lucide-react";

const languages: { value: Language; label: string; flag: string }[] = [
  { value: "pt", label: "Português", flag: "🇧🇷" },
  { value: "en", label: "English", flag: "🇺🇸" },
];

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const current = languages.find((l) => l.value === language)!;

  useEffect(() => {
    if (open && firstItemRef.current) {
      firstItemRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative" role="group" aria-label={t("language.options")}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t("language.options")}: ${current.label}`}
      >
        <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span aria-hidden="true">{current.flag}</span>
        <span>{current.label}</span>
        <ChevronDown className="w-3 h-3" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t("language.select")}
          className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg py-1 z-50"
        >
          {languages.map((l, i) => (
            <button
              type="button"
              key={l.value}
              ref={i === 0 ? firstItemRef : undefined}
              role="option"
              aria-selected={language === l.value}
              aria-label={`${t("language")}: ${l.label}`}
              onClick={() => {
                setLanguage(l.value);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground
                ${language === l.value ? "bg-accent text-accent-foreground font-semibold" : "text-popover-foreground hover:bg-secondary"}`}
            >
              <span aria-hidden="true">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
