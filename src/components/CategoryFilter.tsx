import { useLanguage } from "@/hooks/useLanguage";

export type CategoryFilterValue = "all" | "prato" | "bebida" | "sobremesa" | "outros";

const filters: { value: CategoryFilterValue; labelKey: string }[] = [
  { value: "all", labelKey: "filter.all" },
  { value: "prato", labelKey: "filter.pratos" },
  { value: "bebida", labelKey: "filter.bebidas" },
  { value: "sobremesa", labelKey: "filter.sobremesas" },
  { value: "outros", labelKey: "filter.outros" },
];

interface Props {
  selected: CategoryFilterValue;
  onChange: (value: CategoryFilterValue) => void;
}

export function CategoryFilter({ selected, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Category filter">
      {filters.map((f) => (
        <button
          key={f.value}
          role="tab"
          aria-selected={selected === f.value}
          onClick={() => onChange(f.value)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors
            ${selected === f.value
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
        >
          {t(f.labelKey)}
        </button>
      ))}
    </div>
  );
}
