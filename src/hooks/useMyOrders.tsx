import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Tables"]["orders"]["Row"]["status"];

export interface MyOrderItem {
  name: string;
  price: number;
  quantity: number;
  notes: string | null;
}

export interface MyOrder {
  id: string;
  status: OrderStatus;
  createdAt: string;
  notes: string | null;
  items: MyOrderItem[];
}

function storageKey(restaurantId: string, tableNumber: number) {
  return `interamenu:my-orders:${restaurantId}:${tableNumber}`;
}

function readTrackedIds(restaurantId: string, tableNumber: number): string[] {
  try {
    const raw = sessionStorage.getItem(storageKey(restaurantId, tableNumber));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeTrackedIds(restaurantId: string, tableNumber: number, ids: string[]) {
  try {
    sessionStorage.setItem(storageKey(restaurantId, tableNumber), JSON.stringify(ids));
  } catch {
    // sessionStorage indisponível (ex.: navegação privada) — segue sem persistir
  }
}

export function useMyOrders(restaurantId: string | null, tableNumber: number | null) {
  const [orders, setOrders] = useState<MyOrder[]>([]);

  const fetchOrders = useCallback(async () => {
    if (!restaurantId || !tableNumber) {
      setOrders([]);
      return;
    }
    const ids = readTrackedIds(restaurantId, tableNumber);
    if (ids.length === 0) {
      setOrders([]);
      return;
    }
    const { data, error } = await supabase
      .from("orders")
      .select("id, status, created_at, notes, order_items(item_name, item_price, quantity, notes)")
      .in("id", ids)
      .order("created_at", { ascending: false });

    if (error || !data) return;

    setOrders(
      data.map((o: any) => ({
        id: o.id,
        status: o.status,
        createdAt: o.created_at,
        notes: o.notes,
        items: (o.order_items || []).map((it: any) => ({
          name: it.item_name,
          price: Number(it.item_price),
          quantity: it.quantity,
          notes: it.notes,
        })),
      }))
    );
  }, [restaurantId, tableNumber]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (!restaurantId) return;
    const channel = supabase
      .channel(`my-orders-realtime-${restaurantId}-${tableNumber}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, status: updated.status } : o))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, tableNumber]);

  const trackOrder = useCallback(
    (orderId: string) => {
      if (!restaurantId || !tableNumber) return;
      const ids = readTrackedIds(restaurantId, tableNumber);
      const next = [orderId, ...ids.filter((id) => id !== orderId)];
      writeTrackedIds(restaurantId, tableNumber, next);
      fetchOrders();
    },
    [restaurantId, tableNumber, fetchOrders]
  );

  return { orders, trackOrder };
}

export const orderStatusLabels: Record<string, string> = {
  pending: "Pendente",
  confirmed: "Confirmado",
  preparing: "Preparando",
  delivered: "Entregue",
  canceled: "Cancelado",
};
