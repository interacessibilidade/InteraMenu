import { useState } from "react";
import { ShoppingCart, ClipboardList } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useMyOrders, orderStatusLabels } from "@/hooks/useMyOrders";
import { CartModal } from "@/components/ordering/CartModal";

function formatMoney(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

const statusStyles: Record<string, string> = {
  pending: "bg-muted text-foreground",
  confirmed: "bg-blue-100 text-blue-800",
  preparing: "bg-amber-100 text-amber-900",
  delivered: "bg-green-100 text-green-800",
  canceled: "bg-red-100 text-red-800",
};

interface OrderingPanelProps {
  restaurantId: string;
  tableNumber: number;
}

export function OrderingPanel({ restaurantId, tableNumber }: OrderingPanelProps) {
  const { items, totalItems, subtotal } = useCart();
  const { orders, trackOrder } = useMyOrders(restaurantId, tableNumber);
  const [cartOpen, setCartOpen] = useState(false);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  return (
    <>
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>

      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur px-4 py-2 flex gap-2">
        <button
          type="button"
          onClick={() => setOrdersOpen((v) => !v)}
          aria-expanded={ordersOpen}
          aria-controls="my-orders-panel"
          className="flex-1 min-h-11 flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ClipboardList className="w-4 h-4" aria-hidden="true" />
          Seus pedidos {orders.length > 0 ? `(${orders.length})` : ""}
        </button>
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="flex-1 min-h-11 flex items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-bold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Ver seu pedido, ${totalItems} ${totalItems === 1 ? "item" : "itens"}, subtotal ${formatMoney(subtotal)}`}
        >
          <ShoppingCart className="w-4 h-4" aria-hidden="true" />
          Meu pedido {items.length > 0 ? `· ${formatMoney(subtotal)}` : ""}
        </button>
      </div>

      {ordersOpen && (
        <div
          id="my-orders-panel"
          className="fixed bottom-14 inset-x-0 z-40 max-h-[45vh] overflow-y-auto border-t border-border bg-card px-4 py-3 shadow-lg"
        >
          <h2 className="text-sm font-bold text-foreground mb-2">Seus pedidos nesta mesa</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você ainda não enviou nenhum pedido nesta mesa.</p>
          ) : (
            <ul className="space-y-2">
              {orders.map((order) => (
                <li key={order.id} className="rounded-md border border-border p-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">
                      Pedido às {new Date(order.createdAt).toLocaleTimeString("pt-BR")}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        statusStyles[order.status] || "bg-muted text-foreground"
                      }`}
                    >
                      {orderStatusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <ul className="text-sm text-foreground/90 space-y-0.5">
                    {order.items.map((it, idx) => (
                      <li key={idx}>
                        {it.quantity}× {it.name}
                        {it.notes ? ` (${it.notes})` : ""}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <CartModal
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        restaurantId={restaurantId}
        tableNumber={tableNumber}
        onOrderCreated={(orderId) => {
          trackOrder(orderId);
          setStatusMessage("Pedido enviado com sucesso! Acompanhe o status em Seus pedidos.");
          setOrdersOpen(true);
        }}
      />
    </>
  );
}
