import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { ChevronDown } from "lucide-react";

export type CategoryFilterValue =
  | "all"
  | "cafe_espresso"
  | "chocolate"
  | "sobremesa"
  | "empanada_salgado"
  | "metodos_extracao"
  | "paulistinha"
  | "waffles"
  | "almoco"
  | "espresso_gelado"
  | "chocolate_gelado"
  | "bebidas"
  | "drinks_sem_alcool"
  | "chai_latte"
  | "chas"
  | "drinks_especiais"
  | "cervejas";

export const categoryFilterOrder: CategoryFilterValue[] = [
  "cafe_espresso",
  "chocolate",
  "sobremesa",
  "empanada_salgado",
  "metodos_extracao",
  "paulistinha",
  "waffles",
  "almoco",
  "espresso_gelado",
  "chocolate_gelado",
  "bebidas",
  "drinks_sem_alcool",
  "chai_latte",
  "chas",
  "drinks_especiais",
  "cervejas",
];

interface Props {
  selected: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
  showLabel?: boolean;
}

export function CategoryFilter({ selected, onChange, showLabel = true }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const allValues: CategoryFilterValue[] = ["all", ...categoryFilterOrder];
  const currentLabel = selected === "all" ? t("filter.all") : t(`category.${selected}`);

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

  const handleListKeyDown = (e: KeyboardEvent) => {
    const list = listboxRef.current;
    if (!list) return;
    const options = Array.from(list.querySelectorAll<HTMLButtonElement>('[role="option"]'));
    const currentIndex = options.findIndex((el) => el === document.activeElement);

    if (e.key === "ArrowDown") {
      e.preventDefault();
      options[(currentIndex + 1) % options.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      options[(currentIndex - 1 + options.length) % options.length]?.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      options[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      options[options.length - 1]?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {showLabel && (
        <span className="text-sm font-semibold text-foreground" aria-hidden="true">
          {t("filter.findFavorite")}
        </span>
      )}
      <div ref={containerRef} className="relative w-full max-w-xs">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="interactive-feedback w-full h-10 px-4 rounded-full bg-secondary text-secondary-foreground border-0 font-semibold flex items-center justify-between gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`${t("filter.findFavorite")}. ${t("filter.aria.label")}: ${currentLabel}`}
        >
          <span>{currentLabel}</span>
          <ChevronDown className="w-4 h-4 shrink-0" aria-hidden="true" />
        </button>

        {open && (
          <div
            ref={listboxRef}
            role="listbox"
            aria-label={t("filter.findFavorite")}
            onKeyDown={handleListKeyDown}
            className="absolute left-0 right-0 top-full mt-1 max-h-[60vh] overflow-y-auto bg-popover border border-border rounded-md shadow-lg py-1 z-50"
          >
            {allValues.map((cat, i) => {
              const label = cat === "all" ? t("filter.all") : t(`category.${cat}`);
              return (
                <button
                  type="button"
                  key={cat}
                  ref={i === 0 ? firstItemRef : undefined}
                  role="option"
                  aria-selected={selected === cat}
                  aria-label={cat === "all" ? t("filter.aria.all") : label}
                  onClick={() => {
                    onChange(cat);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground
                    ${selected === cat ? "bg-accent text-accent-foreground font-semibold" : "text-popover-foreground hover:bg-secondary"}`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
