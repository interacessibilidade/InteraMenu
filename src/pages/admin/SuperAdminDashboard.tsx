import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

interface RestaurantRow {
  id: string;
  name: string;
  slug: string;
  status: "active" | "inactive" | "pending";
  contact_email: string | null;
  created_at: string;
}

export default function SuperAdminDashboard() {
  const { user, signOut } = useAuth();
  const [restaurants, setRestaurants] = useState<RestaurantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");

  const loadRestaurants = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("restaurants")
      .select("id, name, slug, status, contact_email, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Não foi possível carregar a lista de restaurantes.");
    } else {
      setRestaurants((data ?? []) as RestaurantRow[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  async function toggleStatus(restaurant: RestaurantRow) {
    const newStatus = restaurant.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("restaurants")
      .update({ status: newStatus })
      .eq("id", restaurant.id);

    if (error) {
      toast.error("Não foi possível atualizar o status.");
      return;
    }

    setRestaurants((prev) =>
      prev.map((r) => (r.id === restaurant.id ? { ...r, status: newStatus } : r))
    );
    setStatusMessage(
      `${restaurant.name} agora está ${newStatus === "active" ? "ativo" : "inativo"}.`
    );
    toast.success(`${restaurant.name} agora está ${newStatus === "active" ? "ativo" : "inativo"}.`);
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center justify-between py-5">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Restaurantes cadastrados</h1>
            <p className="text-sm text-muted-foreground">
              Painel geral do InteraMenu · conectada como {user?.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/admin"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Voltar
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Região anunciada por leitor de tela quando um status muda */}
      <p className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </p>

      <main className="container py-8" role="main">
        {loading ? (
          <p className="text-muted-foreground">Carregando restaurantes...</p>
        ) : restaurants.length === 0 ? (
          <p className="text-muted-foreground">Nenhum restaurante cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <caption className="mb-3 text-left text-sm text-muted-foreground">
                Lista de restaurantes cadastrados no sistema, com seu status atual
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="py-2 pr-4 font-semibold text-foreground">Restaurante</th>
                  <th scope="col" className="py-2 pr-4 font-semibold text-foreground">Endereço do cardápio</th>
                  <th scope="col" className="py-2 pr-4 font-semibold text-foreground">Status</th>
                  <th scope="col" className="py-2 pr-4 font-semibold text-foreground">Cadastrado em</th>
                  <th scope="col" className="py-2 font-semibold text-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr key={r.id} className="border-b border-border">
                    <td className="py-3 pr-4">{r.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">/{r.slug}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={
                          r.status === "active"
                            ? "rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800"
                            : "rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-800"
                        }
                      >
                        {r.status === "active" ? "Ativo" : r.status === "pending" ? "Pendente" : "Inativo"}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleStatus(r)}
                        aria-label={`${r.status === "active" ? "Desativar" : "Ativar"} ${r.name}`}
                      >
                        {r.status === "active" ? "Desativar" : "Ativar"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
