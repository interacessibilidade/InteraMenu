import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, BarChart3, Calendar, Printer } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface CallRow {
  id: string;
  table_number: number;
  created_at: string;
  attended_at: string | null;
  status: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function calcMinutes(start: string, end: string | null) {
  if (!end) return "—";
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
  return diff.toFixed(1) + " min";
}

export default function WaiterReport() {
  useDocumentTitle("Relatório de Atendimento — InteraMenu");
  const { restaurantId } = useAuth();
  const [dateFilter, setDateFilter] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });

  const { data: calls, isLoading } = useQuery({
    queryKey: ["waiter_report", dateFilter, restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const startOfDay = `${dateFilter}T00:00:00.000Z`;
      const endOfDay = `${dateFilter}T23:59:59.999Z`;
      const { data, error } = await supabase
        .from("waiter_calls")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CallRow[];
    },
  });

  const attended = (calls || []).filter((c) => c.attended_at);
  const avgMinutes =
    attended.length > 0
      ? (attended.reduce((sum, c) => sum + (new Date(c.attended_at!).getTime() - new Date(c.created_at).getTime()), 0) / attended.length / 60000).toFixed(1)
      : "—";
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-md hover:bg-secondary transition-colors" aria-label="Voltar para gestão do cardápio">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <BarChart3 className="w-6 h-6 text-primary" aria-hidden="true" />
          <h1 className="text-xl font-extrabold text-foreground">Relatório de Atendimento</h1>
          <button
            type="button"
            onClick={handlePrint}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm print:hidden"
            aria-label="Imprimir relatório de atendimento"
          >
            <Printer className="w-4 h-4" aria-hidden="true" />
            Imprimir relatório
          </button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Filter */}
        <div className="flex items-center gap-3 print:hidden">
          <Calendar className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
          <label htmlFor="date-filter" className="text-sm font-semibold text-foreground">Data:</label>
          <input
            id="date-filter"
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{(calls || []).length}</p>
            <p className="text-xs text-muted-foreground font-medium">Total de chamados</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{attended.length}</p>
            <p className="text-xs text-muted-foreground font-medium">Atendidos</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 text-center">
            <p className="text-2xl font-extrabold text-primary">{avgMinutes}</p>
            <p className="text-xs text-muted-foreground font-medium">Tempo médio (min)</p>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (calls || []).length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">Nenhum chamado nesta data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">
                Relatório de chamados de garçom em {formatDate(`${dateFilter}T12:00:00`)}: mesa, horário da solicitação, horário do atendimento, tempo decorrido e status.
              </caption>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="text-left py-3 px-2 font-semibold text-foreground">Mesa</th>
                  <th scope="col" className="text-left py-3 px-2 font-semibold text-foreground">Solicitação</th>
                  <th scope="col" className="text-left py-3 px-2 font-semibold text-foreground">Atendimento</th>
                  <th scope="col" className="text-left py-3 px-2 font-semibold text-foreground">Tempo</th>
                  <th scope="col" className="text-left py-3 px-2 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {(calls || []).map((call) => (
                  <tr key={call.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-2 font-bold text-primary">{call.table_number}</td>
                    <td className="py-3 px-2 text-foreground">{formatTime(call.created_at)}</td>
                    <td className="py-3 px-2 text-foreground">{call.attended_at ? formatTime(call.attended_at) : "—"}</td>
                    <td className="py-3 px-2 text-foreground">{calcMinutes(call.created_at, call.attended_at)}</td>
                    <td className="py-3 px-2">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${call.status === "attended" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"}`}>
                        {call.status === "attended" ? "Atendido" : "Pendente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <AccessibilityToolbar />
    </div>
  );
}
