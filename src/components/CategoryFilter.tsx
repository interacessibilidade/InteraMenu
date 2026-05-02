import { useLanguage } from "@/hooks/useLanguage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
}

export function CategoryFilter({ selected, onChange }: Props) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-sm font-semibold text-foreground" aria-hidden="true">
        {t("filter.findFavorite")}
      </span>
      <Select value={selected} onValueChange={(v) => onChange(v as CategoryFilterValue)}>
        <SelectTrigger
          className="interactive-feedback w-full max-w-xs h-10 rounded-full bg-secondary text-secondary-foreground border-0 font-semibold"
          aria-label={`${t("filter.findFavorite")}. ${t("filter.aria.label")}`}
        >
          <SelectValue placeholder={t("filter.all")} />
        </SelectTrigger>
        <SelectContent className="max-h-[60vh]">
          <SelectItem value="all" aria-label={t("filter.aria.all")}>
            {t("filter.all")}
          </SelectItem>
          {categoryFilterOrder.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {t(`category.${cat}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
