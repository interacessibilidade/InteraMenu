import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function CallWaiterButton({ tableNumber }: { tableNumber: number | null }) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");

  const handleCall = async () => {
    if (!tableNumber || status === "loading") return;
    setStatus("loading");
    try {
      await supabase.from("waiter_calls").insert({ table_number: tableNumber });
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <button
      onClick={handleCall}
      disabled={status === "loading" || status === "sent" || !tableNumber}
      className={`w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg font-bold text-base transition-colors focus:outline-none focus:ring-4 focus:ring-ring
        ${status === "sent"
          ? "bg-success text-success-foreground"
          : "bg-warning text-warning-foreground"
        }`}
      aria-label={status === "sent" ? "Garçom chamado com sucesso" : tableNumber ? `Chamar garçom para mesa ${tableNumber}` : "Chamar garçom"}
      aria-live="polite"
    >
      {status === "sent" ? (
        <>
          <Check className="w-5 h-5" aria-hidden="true" />
          Garçom chamado!
        </>
      ) : (
        <>
          <Bell className="w-5 h-5" aria-hidden="true" />
          {tableNumber ? `Chamar Garçom — Mesa ${tableNumber}` : "Chamar Garçom"}
        </>
      )}
    </button>
  );
}
