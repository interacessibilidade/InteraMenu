import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

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
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleCall}
      disabled={status === "loading" || status === "sent" || !tableNumber}
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl font-bold text-lg transition-colors focus:outline-none focus:ring-4 focus:ring-ring
        ${status === "sent"
          ? "bg-success text-success-foreground"
          : "bg-waiter-call text-waiter-call-foreground animate-pulse-call"
        }`}
      aria-label={status === "sent" ? "Garçom chamado com sucesso" : tableNumber ? `Chamar garçom para mesa ${tableNumber}` : "Chamar garçom"}
      aria-live="polite"
    >
      {status === "sent" ? (
        <>
          <Check className="w-6 h-6" aria-hidden="true" />
          Garçom chamado!
        </>
      ) : (
        <>
          <Bell className="w-6 h-6" aria-hidden="true" />
          {tableNumber ? `Chamar Garçom — Mesa ${tableNumber}` : "Chamar Garçom"}
        </>
      )}
    </motion.button>
  );
}
