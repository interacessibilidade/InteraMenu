import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useLanguage } from "@/hooks/useLanguage";
import { ChevronDown } from "lucide-react";

// "all" ou o id (UUID) de uma restaurant_categories do restaurante atual.
export type CategoryFilterValue = "all" | string;

export interface CategoryFilterOption {
  id: string;
  name: string;
}

interface Props {
  categories: CategoryFilterOption[];
  selected: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
  showLabel?: boolean;
}

export function CategoryFilter({ categories, selected, onChange, showLabel = true }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  const currentLabel =
    selected === "all" ? t("filter.all") : categories.find((c) => c.id === selected)?.name ?? t("filter.all");

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
            <button
              type="button"
              ref={firstItemRef}
              role="option"
              aria-selected={selected === "all"}
              aria-label={t("filter.aria.all")}
              onClick={() => {
                onChange("all");
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground
                ${selected === "all" ? "bg-accent text-accent-foreground font-semibold" : "text-popover-foreground hover:bg-secondary"}`}
            >
              {t("filter.all")}
            </button>
            {categories.map((cat) => (
              <button
                type="button"
                key={cat.id}
                role="option"
                aria-selected={selected === cat.id}
                aria-label={cat.name}
                onClick={() => {
                  onChange(cat.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground
                  ${selected === cat.id ? "bg-accent text-accent-foreground font-semibold" : "text-popover-foreground hover:bg-secondary"}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
