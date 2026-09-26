import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MenuItemCard } from "@/components/MenuItemCard";
import { CallWaiterButton } from "@/components/CallWaiterButton";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CategoryFilter, type CategoryFilterValue } from "@/components/CategoryFilter";
import { UtensilsCrossed, PlayCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { TutorialVideoModal } from "@/components/TutorialVideoModal";
import { TutorialPrompt } from "@/components/TutorialPrompt";
import { WelcomeModal } from "@/components/WelcomeModal";
import { WriteToWaiterModal } from "@/components/WriteToWaiterModal";
import { useMenuTranslation } from "@/hooks/useMenuTranslation";
import { useTableName } from "@/hooks/useTableName";
import { restaurantThemeStyle } from "@/lib/restaurantTheme";
import { CartProvider } from "@/hooks/useCart";
import { OrderingPanel } from "@/components/ordering/OrderingPanel";

export default function Index() {
  const { restaurantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const mesa = searchParams.get("mesa");
  const tableNumber = mesa ? parseInt(mesa, 10) : null;
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState<CategoryFilterValue>("all");
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // Descobre qual restaurante mostrar a partir do endereço da URL.
  // Sem slug na URL (site raiz), cai de volta para o único restaurante
  // legado — mantém o link antigo do Café Infinito Olhar funcionando.
  const { data: restaurant, isLoading: loadingRestaurant } = useQuery({
    queryKey: ["restaurant_by_slug", restaurantSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, status, primary_color, logo_url, show_ingredients_button, enable_ordering")
        .eq("slug", restaurantSlug || "cafe-infinito-olhar")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const restaurantId = restaurant?.id ?? null;
  const customTableName = useTableName(tableNumber, restaurantId);

  const { data: categories } = useQuery({
    queryKey: ["restaurant_categories_public", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_categories")
        .select("id, name, sort_order")
        .eq("restaurant_id", restaurantId as string)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["menu_items", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId as string)
        .eq("is_available", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { getTranslated, translating } = useMenuTranslation(items);

  const isFirstFilterRender = useRef(true);
  useEffect(() => {
    if (isFirstFilterRender.current) {
      isFirstFilterRender.current = false;
      return;
    }
    if (filter === "all") return;
    // Espera o DOM atualizar com a lista filtrada antes de rolar
    const timeoutId = window.setTimeout(() => {
      const section = document.getElementById(`cat-${filter}`);
      section?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
    return () => window.clearTimeout(timeoutId);
  }, [filter]);

  if (!loadingRestaurant && (!restaurant || restaurant.status !== "active")) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background px-4 text-center">
        <UtensilsCrossed className="mb-2 h-10 w-10 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-bold text-foreground">Cardápio não encontrado</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Não encontramos um cardápio ativo neste endereço. Verifique o link ou o QR Code e tente novamente.
        </p>
      </div>
    );
  }

  const orderingEnabled = Boolean((restaurant as any)?.enable_ordering);
  const canOrder = orderingEnabled && !!restaurantId && !!tableNumber;

  const grouped = (categories || [])
    .map((cat) => ({
      category: cat.id,
      label: cat.name,
      items: (items || []).filter((i) => i.category_id === cat.id).map(getTranslated),
    }))
    .filter((g) => g.items.length > 0)
    .filter((g) => filter === "all" || g.category === filter);

  const pageContent = (
    <div
      key={language}
      style={restaurantThemeStyle((restaurant as any)?.primary_color)}
      className={`min-h-screen bg-background ${canOrder ? "pb-24" : "pb-8"}`}
      lang={language === "en" ? "en-US" : language === "es" ? "es-ES" : language === "fr" ? "fr-FR" : "pt-BR"}
    >
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-3 flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden ${
              (restaurant as any)?.logo_url ? "bg-background border border-border" : "bg-primary"
            }`}
          >
            {(restaurant as any)?.logo_url ? (
              <img
                src={(restaurant as any).logo_url}
                alt=""
                className="w-full h-full object-contain p-0.5"
              />
            ) : (
              <UtensilsCrossed className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-foreground leading-tight">{t("header.title")}</h1>
            {tableNumber && (
              <p className="text-xs text-muted-foreground font-medium">{customTableName || `${t("header.table")} ${tableNumber}`}</p>
            )}
          </div>
          <button
            onClick={() => setTutorialOpen(true)}
            className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("tutorial.modal.aria")}
          >
            <PlayCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{t("tutorial.button")}</span>
          </button>
          <LanguageSelector />
        </div>
      </header>

      <TutorialPrompt onWatch={() => setTutorialOpen(true)} />

      {/* Sticky categories + waiter call */}
      <div className="sticky top-[57px] z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-2 space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-sm font-semibold text-foreground text-center sm:text-left whitespace-nowrap">
              {t("filter.findFavorite")}
            </span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <CategoryFilter
                  categories={(categories || []).map((c) => ({ id: c.id, name: c.name }))}
                  selected={filter}
                  onChange={setFilter}
                  showLabel={false}
                />
              </div>
              <WriteToWaiterModal />
            </div>
          </div>
          <CallWaiterButton tableNumber={tableNumber ?? 0} restaurantId={restaurantId} />
        </div>
      </div>

      <main className="container py-4" role="main">
        {isLoading || translating || loadingRestaurant ? (
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
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      showIngredientsButton={(restaurant as any)?.show_ingredients_button ?? true}
                      orderingEnabled={canOrder}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {orderingEnabled && !tableNumber && (
          <p role="status" className="mt-8 text-center text-sm text-muted-foreground">
            Para fazer pedidos pelo celular, acesse o cardápio usando o QR Code da sua mesa.
          </p>
        )}
      </main>

      <AccessibilityToolbar />
      <TutorialVideoModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
      <WelcomeModal onWatchVideo={() => setTutorialOpen(true)} />

      {canOrder && <OrderingPanel restaurantId={restaurantId as string} tableNumber={tableNumber as number} />}
    </div>
  );

  return canOrder ? <CartProvider>{pageContent}</CartProvider> : pageContent;
}
