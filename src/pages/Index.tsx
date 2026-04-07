import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MenuItemCard } from "@/components/MenuItemCard";
import { CallWaiterButton } from "@/components/CallWaiterButton";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { UtensilsCrossed } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type MenuCategory = Database["public"]["Enums"]["menu_category"];

const categoryLabels: Record<MenuCategory, string> = {
  entrada: "Entradas",
  prato: "Pratos Principais",
  acompanhamento: "Acompanhamentos",
  bebida: "Bebidas",
  sobremesa: "Sobremesas",
};

const categoryOrder: MenuCategory[] = ["entrada", "prato", "acompanhamento", "bebida", "sobremesa"];

export default function Index() {
  const [searchParams] = useSearchParams();
  const mesa = searchParams.get("mesa");
  const tableNumber = mesa ? parseInt(mesa, 10) : null;

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

  const grouped = categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabels[cat],
      items: (items || []).filter((i) => i.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-background pb-36">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-foreground leading-tight">Cardápio Digital</h1>
            {tableNumber && (
              <p className="text-sm text-muted-foreground font-medium">Mesa {tableNumber}</p>
            )}
          </div>
        </div>
      </header>

      <main className="container py-6" role="main">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-20">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground font-medium">Nenhum item disponível no momento.</p>
            <p className="text-sm text-muted-foreground mt-1">Acesse /admin/gestao para cadastrar itens.</p>
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
