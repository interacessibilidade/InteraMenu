import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";

type WaiterCall = Database["public"]["Tables"]["waiter_calls"]["Row"];

function timeSince(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function WaiterPanel() {
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [, setTick] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch initial pending calls
  useEffect(() => {
    const fetchCalls = async () => {
      const { data } = await supabase
        .from("waiter_calls")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (data) setCalls(data);
    };
    fetchCalls();
  }, []);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("waiter-calls-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "waiter_calls" },
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
  }, []);

  // Timer tick every second
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const playAlert = () => {
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
  };

  const markAttended = async (id: string) => {
    await supabase
      .from("waiter_calls")
      .update({ status: "attended", attended_at: new Date().toISOString() })
      .eq("id", id);
    setCalls((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <Link to="/admin/gestao" className="p-2 rounded-md hover:bg-secondary transition-colors" aria-label="Voltar para gestão">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Bell className="w-6 h-6 text-primary" aria-hidden="true" />
          <h1 className="text-xl font-extrabold text-foreground">Painel do Garçom</h1>
          <span className="ml-auto bg-primary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full">
            {calls.length} chamado{calls.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <main className="container py-6" role="main">
        {calls.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <p className="text-xl font-bold text-foreground">Tudo em ordem!</p>
            <p className="text-muted-foreground mt-1">Nenhum chamado pendente.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {calls.map((call) => (
              <div
                key={call.id}
                className="bg-card border-2 border-primary rounded-lg p-5 shadow-lg animate-pulse-call"
                role="alert"
                aria-live="assertive"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl font-extrabold text-primary">Mesa {call.table_number}</span>
                  <Bell className="w-8 h-8 text-primary" aria-hidden="true" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">está chamando!</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <span>Esperando: {timeSince(call.created_at)}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Chamado às {new Date(call.created_at).toLocaleTimeString("pt-BR")}
                </p>
                <button
                  onClick={() => markAttended(call.id)}
                  className="w-full py-3 rounded-md bg-success text-success-foreground font-bold text-sm hover:bg-success/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  ✓ Atendido
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <audio ref={audioRef} />
    </div>
  );
}
