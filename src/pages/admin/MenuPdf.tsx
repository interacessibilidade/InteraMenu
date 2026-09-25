import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";

interface MenuItemRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  ingredients: string | null;
  allergens: string[] | null;
  sort_order: number;
}

const categoryLabels: Record<string, string> = {
  cafe_espresso: "Café Espresso",
  chocolate: "Chocolate",
  sobremesa: "Sobremesa",
  empanada_salgado: "Empanada / Salgado",
  metodos_extracao: "Métodos de Extração",
  paulistinha: "Paulistinha",
  waffles: "Waffles",
  almoco: "Almoço",
  espresso_gelado: "Espresso Gelado",
  chocolate_gelado: "Chocolate Gelado",
  bebidas: "Bebidas",
  drinks_sem_alcool: "Drinks Sem Álcool",
  chai_latte: "Chai Latte",
  chas: "Chás",
  drinks_especiais: "Drinks Especiais",
  cervejas: "Cervejas",
  prato: "Prato",
  entrada: "Entrada",
  acompanhamento: "Acompanhamento",
  outros: "Outros",
};

export default function MenuPdf() {
  useDocumentTitle("Cardápio em PDF — InteraMenu");
  const { restaurantId, restaurantName } = useAuth();

  const { data: items, isLoading } = useQuery({
    queryKey: ["menu_pdf", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, price, category, ingredients, allergens, sort_order")
        .eq("restaurant_id", restaurantId as string)
        .eq("is_available", true)
        .order("category")
        .order("sort_order");
      if (error) throw error;
      return data as MenuItemRow[];
    },
  });

  const grouped = (items || []).reduce<Record<string, MenuItemRow[]>>((acc, item) => {
    (acc[item.category] ||= []).push(item);
    return acc;
  }, {});

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border print:hidden">
        <div className="container py-4 flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-md hover:bg-secondary transition-colors" aria-label="Voltar para gestão do cardápio">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-extrabold text-foreground">Cardápio em PDF</h1>
          <button
            type="button"
            onClick={handlePrint}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm"
            aria-label="Imprimir ou salvar o cardápio como PDF"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            Imprimir / Salvar como PDF
          </button>
        </div>
        <p className="container pb-3 text-xs text-muted-foreground">
          Dica: ao imprimir, escolha "Salvar como PDF" no destino da impressora para baixar o arquivo.
        </p>
      </header>

      <main className="container py-8 max-w-2xl mx-auto">
        {isLoading ? (
          <p className="text-muted-foreground">Carregando cardápio...</p>
        ) : (items || []).length === 0 ? (
          <p className="text-muted-foreground">Nenhum item disponível no cardápio ainda.</p>
        ) : (
          <article lang="pt-BR">
            <h1 className="text-3xl font-extrabold text-foreground mb-1">
              {restaurantName || "Cardápio"}
            </h1>
            <p className="text-muted-foreground mb-8">Cardápio completo</p>

            {Object.entries(grouped).map(([category, catItems]) => (
              <section key={category} className="mb-8 break-inside-avoid">
                <h2 className="text-xl font-bold text-foreground border-b border-border pb-1 mb-3">
                  {categoryLabels[category] || category}
                </h2>
                <ul className="space-y-4 list-none pl-0">
                  {catItems.map((item) => (
                    <li key={item.id} className="break-inside-avoid">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-bold text-foreground">{item.name}</h3>
                        <span className="font-bold text-foreground whitespace-nowrap">
                          R$ {Number(item.price).toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-foreground/80">{item.description}</p>
                      )}
                      {item.ingredients && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Ingredientes:</strong> {item.ingredients}
                        </p>
                      )}
                      {item.allergens && item.allergens.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          <strong>Contém:</strong> {item.allergens.join(", ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </article>
        )}
      </main>
      <AccessibilityToolbar />
    </div>
  );
}
