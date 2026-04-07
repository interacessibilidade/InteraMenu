import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MenuItemCard } from "@/components/MenuItemCard";
import { CallWaiterButton } from "@/components/CallWaiterButton";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CategoryFilter, type CategoryFilterValue } from "@/components/CategoryFilter";
import { UtensilsCrossed } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { useMenuTranslation } from "@/hooks/useMenuTranslation";
import type { Database } from "@/integrations/supabase/types";

type MenuCategory = Database["public"]["Enums"]["menu_category"];

const categoryOrder: MenuCategory[] = ["entrada", "prato", "acompanhamento", "bebida", "sobremesa"];

const filterToCategories: Record<CategoryFilterValue, MenuCategory[] | null> = {
  all: null,
  prato: ["prato"],
  bebida: ["bebida"],
  sobremesa: ["sobremesa"],
  outros: ["entrada", "acompanhamento"],
};

export default function Index() {
  const [searchParams] = useSearchParams();
  const mesa = searchParams.get("mesa");
  const tableNumber = mesa ? parseInt(mesa, 10) : null;
  const { t } = useLanguage();
  const [filter, setFilter] = useState<CategoryFilterValue>("all");

  const { data: items, isLoading } = useQuery({
    queryKey: ["menu_items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("is_available", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { getTranslated, translating } = useMenuTranslation(items);

  const allowedCategories = filterToCategories[filter];

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: t(`category.${cat}`),
      items: (items || []).filter((i) => i.category === cat).map(getTranslated),
    }))
    .filter((g) => g.items.length > 0)
    .filter((g) => !allowedCategories || allowedCategories.includes(g.category));

  return (
    <div className="min-h-screen bg-background pb-36">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground leading-tight">{t("header.title")}</h1>
            {tableNumber && (
              <p className="text-xs text-muted-foreground font-medium">{t("header.table")} {tableNumber}</p>
            )}
          </div>
          <LanguageSelector />
        </div>
      </header>

      <div className="container pt-4 pb-2">
        <CategoryFilter selected={filter} onChange={setFilter} />
      </div>

      <main className="container py-4" role="main">
        {isLoading || translating ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground font-medium">{t("empty.title")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("empty.subtitle")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => (
              <section key={group.category} aria-labelledby={`cat-${group.category}`}>
                <h2
                  id={`cat-${group.category}`}
                  className="text-2xl font-extrabold text-foreground mb-4 border-b-2 border-primary pb-2"
                >
                  {group.label}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <MenuItemCard key={item.id} item={item} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>

      <CallWaiterButton tableNumber={tableNumber} />
      <AccessibilityToolbar />
    </div>
  );
}
