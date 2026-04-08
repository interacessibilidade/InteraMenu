import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/hooks/useLanguage";
import { toast } from "sonner";

export function CallWaiterButton({ tableNumber }: { tableNumber: number | null }) {
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const { t } = useLanguage();

  const handleCall = async () => {
    if (!tableNumber || status === "loading") return;
    setStatus("loading");

    // Check for existing pending call from this table
    const { data: existing } = await supabase
      .from("waiter_calls")
      .select("id")
      .eq("table_number", tableNumber)
      .eq("status", "pending")
      .limit(1);

    if (existing && existing.length > 0) {
      toast.info(t("waiter.already_called") || "Garçom já foi chamado para esta mesa.");
      setStatus("sent");
      setTimeout(() => setStatus("idle"), 5000);
      return;
    }

    const { error } = await supabase.from("waiter_calls").insert({ table_number: tableNumber });
    if (error) {
      console.error("Waiter call failed:", error);
      setStatus("idle");
      return;
    }
    setStatus("sent");
    setTimeout(() => setStatus("idle"), 5000);
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
      aria-label={status === "sent" ? t("waiter.called") : tableNumber ? `${t("waiter.call.table")} ${tableNumber}` : t("waiter.call")}
      aria-live="polite"
    >
      {status === "sent" ? (
        <>
          <Check className="w-5 h-5" aria-hidden="true" />
          {t("waiter.called")}
        </>
      ) : (
        <>
          <Bell className="w-5 h-5" aria-hidden="true" />
          {tableNumber ? `${t("waiter.call.table")} ${tableNumber}` : t("waiter.call")}
        </>
      )}
    </button>
  );
}
