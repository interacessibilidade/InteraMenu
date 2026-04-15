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
    <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label={t("filter.aria.label")}>
      {filters.map((f) => (
        <button
          key={f.value}
          role="tab"
          aria-selected={selected === f.value}
          aria-label={f.value === "all" ? t("filter.aria.all") : undefined}
          onClick={() => onChange(f.value)}
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-colors
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
