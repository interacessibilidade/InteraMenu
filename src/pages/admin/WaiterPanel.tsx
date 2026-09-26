import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle, Clock, ArrowLeft, BarChart3, Receipt, ChefHat, Ban, PackageCheck } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import { useTableNames } from "@/hooks/useTableName";
import { useAuth } from "@/hooks/useAuth";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AccessibleConfirmDialog } from "@/components/AccessibleConfirmDialog";

type WaiterCall = Database["public"]["Tables"]["waiter_calls"]["Row"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type TableSessionRow = Database["public"]["Tables"]["table_sessions"]["Row"];

interface OrderWithItems extends OrderRow {
  order_items: OrderItemRow[];
}
interface SessionWithOrders extends TableSessionRow {
  orders: OrderWithItems[];
}

function timeSince(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

function timeSinceSpoken(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const minutosLabel = m === 1 ? "minuto" : "minutos";
  const segundosLabel = s === 1 ? "segundo" : "segundos";
  if (m === 0) return `${s} ${segundosLabel}`;
  return `${m} ${minutosLabel} e ${s} ${segundosLabel}`;
}

const URGENT_THRESHOLD_SECONDS = 180; // 3 minutes

function isUrgent(date: string) {
  return (Date.now() - new Date(date).getTime()) / 1000 >= URGENT_THRESHOLD_SECONDS;
}

function formatMoney(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

const orderStatusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  delivered: "Entregue",
  canceled: "Cancelado",
};

const orderStatusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-purple-100 text-purple-900",
  delivered: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
};

export default function WaiterPanel() {
  useDocumentTitle("Painel de Atendimento — InteraMenu");
  const { restaurantId, restaurantEnableOrdering, restaurantServiceFeePercent } = useAuth();
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [, setTick] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { data: tableNames } = useTableNames(restaurantId);

  // Fetch initial pending calls, só do restaurante logado
  useEffect(() => {
    if (!restaurantId) return;
    const fetchCalls = async () => {
      const { data } = await supabase
        .from("waiter_calls")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (data) setCalls(data);
    };
    fetchCalls();
  }, [restaurantId]);

  const playAlert = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1000;
        osc2.type = "sine";
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(ctx.currentTime + 0.3);
      }, 300);
    } catch (e) {
      console.log("Audio alert failed", e);
    }
  }, []);

  // Realtime subscription, filtrada pelo restaurante logado
  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`waiter-calls-realtime-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "waiter_calls",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const newCall = payload.new as WaiterCall;
          setCalls((prev) => [newCall, ...prev]);
          playAlert();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, playAlert]);

  // Timer tick every second
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const markAttended = async (id: string) => {
    const call = calls.find((c) => c.id === id);
    await supabase
      .from("waiter_calls")
      .update({ status: "attended", attended_at: new Date().toISOString() })
      .eq("id", id);
    setCalls((prev) => prev.filter((c) => c.id !== id));
    if (call) {
      const tableLabel = tableNames?.[call.table_number] || `Mesa ${call.table_number}`;
      setStatusMessage(`Chamado da ${tableLabel} marcado como atendido.`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-md hover:bg-secondary transition-colors" aria-label="Voltar para gestão do cardápio">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Bell className="w-6 h-6 text-primary" aria-hidden="true" />
          <h1 className="text-xl font-extrabold text-foreground">Painel de Atendimento</h1>
          <Link to="/admin/relatorio" className="ml-auto flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors">
            <BarChart3 className="w-4 h-4" /> Relatório
          </Link>
        </div>
      </header>

      <main className="container py-6 space-y-10" role="main">
        <section aria-labelledby="waiter-calls-heading">
          <div className="flex items-center gap-3 mb-4">
            <h2 id="waiter-calls-heading" className="text-lg font-extrabold text-foreground">
              Chamados de garçom
            </h2>
            <span className="bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
              {calls.length} chamado{calls.length !== 1 ? "s" : ""}
            </span>
            {calls.some((c) => isUrgent(c.created_at)) && (
              <span
                className="bg-destructive text-destructive-foreground text-sm font-bold px-3 py-1 rounded-full animate-pulse"
                role="status"
                aria-live="polite"
              >
                ⚠ {calls.filter((c) => isUrgent(c.created_at)).length} urgente{calls.filter((c) => isUrgent(c.created_at)).length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {calls.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
              <p className="text-xl font-bold text-foreground">Tudo em ordem!</p>
              <p className="text-muted-foreground mt-1">Nenhum chamado pendente.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...calls]
                .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                .map((call) => {
                const urgent = isUrgent(call.created_at);
                return (
                <div
                  key={call.id}
                  className={`rounded-lg p-5 shadow-lg animate-pulse-call border-2 ${
                    urgent
                      ? "bg-destructive/10 border-destructive ring-2 ring-destructive/40"
                      : "bg-card border-primary"
                  }`}
                  role="alert"
                  aria-live="assertive"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-3xl font-extrabold ${urgent ? "text-destructive" : "text-primary"}`}>
                      {tableNames?.[call.table_number] || `Mesa ${call.table_number}`}
                    </span>
                    <Bell className={`w-8 h-8 ${urgent ? "text-destructive" : "text-primary"}`} aria-hidden="true" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {urgent ? "está esperando há muito tempo!" : "está chamando!"}
                  </p>
                  {urgent && (
                    <p className="text-xs font-bold text-destructive mb-2 uppercase tracking-wide">
                      ⚠ Atenção urgente
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    <span className={urgent ? "text-destructive font-bold" : ""}>
                      <span aria-hidden="true">Esperando: {timeSince(call.created_at)}</span>
                      <span className="sr-only">Esperando há {timeSinceSpoken(call.created_at)}</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    Chamado às {new Date(call.created_at).toLocaleTimeString("pt-BR")}
                  </p>
                  <button
                    onClick={() => markAttended(call.id)}
                    aria-label={`Marcar chamado como atendido`}
                    className="w-full py-3 rounded-md bg-success text-success-foreground font-bold text-sm hover:bg-success/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    ✓ Atendido
                  </button>
                </div>
                );
              })}
            </div>
          )}
        </section>

        {restaurantEnableOrdering && (
          <OrdersSection
            restaurantId={restaurantId}
            tableNames={tableNames}
            serviceFeePercent={restaurantServiceFeePercent}
            playAlert={playAlert}
          />
        )}
      </main>

      <audio ref={audioRef} />
      <AccessibilityToolbar />
    </div>
  );
}

function OrdersSection({
  restaurantId,
  tableNames,
  serviceFeePercent,
  playAlert,
}: {
  restaurantId: string | null;
  tableNames: Record<number, string> | undefined;
  serviceFeePercent: number;
  playAlert: () => void;
}) {
  const [sessions, setSessions] = useState<SessionWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [cancelTarget, setCancelTarget] = useState<{ orderId: string; label: string } | null>(null);
  const [closeTarget, setCloseTarget] = useState<SessionWithOrders | null>(null);
  const [lastClosedSummary, setLastClosedSummary] = useState<{
    tableLabel: string;
    subtotal: number;
    fee: number;
    total: number;
    feePercent: number;
  } | null>(null);
  const knownOrderIds = useRef<Set<string>>(new Set());

  const fetchSessions = useCallback(async () => {
    if (!restaurantId) return;
    const { data, error } = await supabase
      .from("table_sessions")
      .select("*, orders(*, order_items(*))")
      .eq("restaurant_id", restaurantId)
      .eq("status", "open")
      .order("opened_at", { ascending: true })
      .order("created_at", { foreignTable: "orders", ascending: true });

    if (!error && data) {
      const typed = data as unknown as SessionWithOrders[];
      typed.forEach((s) => s.orders.forEach((o) => knownOrderIds.current.add(o.id)));
      setSessions(typed);
    }
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`orders-realtime-${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        (payload) => {
          const order = payload.new as OrderRow;
          if (!knownOrderIds.current.has(order.id)) {
            playAlert();
          }
          fetchSessions();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurantId}` },
        () => fetchSessions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, fetchSessions, playAlert]);

  const tableLabelFor = (tableNumber: number) => tableNames?.[tableNumber] || `Mesa ${tableNumber}`;

  const confirmOrder = async (order: OrderWithItems) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", order.id);
    if (!error) {
      setStatusMessage(`Pedido da ${tableLabelFor(order.table_number)} confirmado.`);
      fetchSessions();
    }
  };

  const markDelivered = async (order: OrderWithItems) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "delivered", delivered_at: new Date().toISOString() })
      .eq("id", order.id);
    if (!error) {
      setStatusMessage(`Pedido da ${tableLabelFor(order.table_number)} marcado como entregue.`);
      fetchSessions();
    }
  };

  const doCancelOrder = async (reason?: string) => {
    if (!cancelTarget) return;
    const { error } = await supabase
      .from("orders")
      .update({ status: "canceled", canceled_at: new Date().toISOString(), canceled_reason: reason })
      .eq("id", cancelTarget.orderId);
    if (!error) {
      setStatusMessage(`Pedido da ${cancelTarget.label} cancelado.`);
      fetchSessions();
    }
    setCancelTarget(null);
  };

  const computeSessionTotals = (session: SessionWithOrders) => {
    const activeOrders = session.orders.filter((o) => o.status !== "canceled");
    const subtotal = activeOrders.reduce(
      (sum, o) => sum + o.order_items.reduce((s, it) => s + Number(it.item_price) * it.quantity, 0),
      0
    );
    const fee = subtotal * (serviceFeePercent / 100);
    const total = subtotal + fee;
    return { subtotal, fee, total };
  };

  const doCloseSession = async () => {
    if (!closeTarget) return;
    const { subtotal, fee, total } = computeSessionTotals(closeTarget);
    const { error } = await supabase
      .from("table_sessions")
      .update({
        status: "closed",
        closed_at: new Date().toISOString(),
        service_fee_percent: serviceFeePercent,
        subtotal,
        service_fee_amount: fee,
        total_amount: total,
      })
      .eq("id", closeTarget.id);

    if (!error) {
      const tableLabel = tableLabelFor(closeTarget.table_number);
      setStatusMessage(`Comanda da ${tableLabel} fechada. Total: ${formatMoney(total)}.`);
      setLastClosedSummary({ tableLabel, subtotal, fee, total, feePercent: serviceFeePercent });
      fetchSessions();
    }
    setCloseTarget(null);
  };

  return (
    <section aria-labelledby="orders-heading">
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>
      <div className="flex items-center gap-3 mb-4">
        <Receipt className="w-5 h-5 text-primary" aria-hidden="true" />
        <h2 id="orders-heading" className="text-lg font-extrabold text-foreground">
          Pedidos (Pedido Online)
        </h2>
        <span className="bg-secondary text-secondary-foreground text-sm font-bold px-3 py-1 rounded-full">
          {sessions.length} comanda{sessions.length !== 1 ? "s" : ""} aberta{sessions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {lastClosedSummary && (
        <div role="status" className="mb-4 rounded-lg border border-success bg-success/10 p-4 text-sm">
          <p className="font-bold text-foreground mb-1">
            Comanda da {lastClosedSummary.tableLabel} fechada — leia este resumo no caixa:
          </p>
          <p>Subtotal dos itens: {formatMoney(lastClosedSummary.subtotal)}</p>
          <p>Taxa de serviço ({lastClosedSummary.feePercent}%): {formatMoney(lastClosedSummary.fee)}</p>
          <p className="font-bold">Total a cobrar: {formatMoney(lastClosedSummary.total)}</p>
        </div>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando pedidos...</p>
      ) : sessions.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma comanda aberta no momento.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {sessions.map((session) => {
            const { subtotal, fee, total } = computeSessionTotals(session);
            const activeOrders = session.orders.filter((o) => o.status !== "canceled");
            return (
              <div key={session.id} className="rounded-lg border-2 border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-foreground">{tableLabelFor(session.table_number)}</h3>
                  <span className="text-xs text-muted-foreground">
                    Aberta às {new Date(session.opened_at).toLocaleTimeString("pt-BR")}
                  </span>
                </div>

                {session.orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground mb-3">Nenhum pedido enviado ainda.</p>
                ) : (
                  <ul className="space-y-3 mb-3">
                    {session.orders.map((order) => (
                      <li key={order.id} className="rounded-md border border-border p-3">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                              orderStatusStyles[order.status] || "bg-muted"
                            }`}
                          >
                            {orderStatusLabels[order.status] || order.status}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleTimeString("pt-BR")}
                          </span>
                        </div>
                        <ul className="text-sm text-foreground space-y-0.5 mb-2">
                          {order.order_items.map((it) => (
                            <li key={it.id}>
                              {it.quantity}× {it.item_name}
                              {it.notes ? ` — ${it.notes}` : ""} ({formatMoney(Number(it.item_price) * it.quantity)})
                            </li>
                          ))}
                        </ul>
                        {order.status === "canceled" && order.canceled_reason && (
                          <p className="text-xs text-destructive mb-2">Motivo do cancelamento: {order.canceled_reason}</p>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {order.status === "pending" && (
                            <button
                              type="button"
                              onClick={() => confirmOrder(order)}
                              className="min-h-11 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
                            >
                              <CheckCircle className="w-4 h-4" aria-hidden="true" />
                              Confirmar pedido
                            </button>
                          )}
                          {(order.status === "confirmed" || order.status === "preparing") && (
                            <button
                              type="button"
                              onClick={() => markDelivered(order)}
                              className="min-h-11 inline-flex items-center gap-1.5 rounded-md bg-success px-3 py-2 text-xs font-bold text-success-foreground hover:bg-success/90"
                            >
                              <PackageCheck className="w-4 h-4" aria-hidden="true" />
                              Marcar como entregue
                            </button>
                          )}
                          {order.status !== "canceled" && order.status !== "delivered" && (
                            <button
                              type="button"
                              onClick={() =>
                                setCancelTarget({ orderId: order.id, label: tableLabelFor(order.table_number) })
                              }
                              className="min-h-11 inline-flex items-center gap-1.5 rounded-md bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/20"
                            >
                              <Ban className="w-4 h-4" aria-hidden="true" />
                              Cancelar pedido
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="border-t border-border pt-3 text-sm space-y-0.5 mb-3">
                  <p>Subtotal (pedidos não cancelados): {formatMoney(subtotal)}</p>
                  <p>Taxa de serviço ({serviceFeePercent}%): {formatMoney(fee)}</p>
                  <p className="font-bold text-foreground">Total estimado: {formatMoney(total)}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setCloseTarget(session)}
                  disabled={activeOrders.length === 0}
                  className="min-h-11 w-full inline-flex items-center justify-center gap-2 rounded-md bg-foreground px-3 py-2.5 text-sm font-bold text-background hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChefHat className="w-4 h-4" aria-hidden="true" />
                  Fechar comanda da {tableLabelFor(session.table_number)}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <AccessibleConfirmDialog
        open={!!cancelTarget}
        title="Cancelar pedido"
        description={`Tem certeza que deseja cancelar o pedido da ${cancelTarget?.label}? Essa ação não pode ser desfeita.`}
        confirmLabel="Cancelar pedido"
        cancelLabel="Voltar"
        danger
        requireReason
        reasonLabel="Motivo do cancelamento"
        reasonPlaceholder="ex.: item em falta na cozinha"
        onConfirm={(reason) => doCancelOrder(reason)}
        onClose={() => setCancelTarget(null)}
      />

      {closeTarget && (
        <AccessibleConfirmDialog
          open={!!closeTarget}
          title={`Fechar comanda da ${tableLabelFor(closeTarget.table_number)}`}
          confirmLabel="Confirmar fechamento"
          cancelLabel="Voltar"
          onConfirm={() => doCloseSession()}
          onClose={() => setCloseTarget(null)}
        >
          {(() => {
            const { subtotal, fee, total } = computeSessionTotals(closeTarget);
            return (
              <div className="text-sm text-foreground space-y-1 mb-2">
                <p>Confira os valores antes de fechar a comanda — essa ação não pode ser desfeita:</p>
                <p>Subtotal dos itens: {formatMoney(subtotal)}</p>
                <p>Taxa de serviço ({serviceFeePercent}%): {formatMoney(fee)}</p>
                <p className="font-bold">Total a cobrar no caixa: {formatMoney(total)}</p>
              </div>
            );
          })()}
        </AccessibleConfirmDialog>
      )}
    </section>
  );
}
