import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer, Copy, Check, Save } from "lucide-react";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function QRCodeGenerator() {
  useDocumentTitle("QR Codes das Mesas — InteraMenu");
  const { restaurantId, restaurantSlug } = useAuth();
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [tableCount, setTableCount] = useState(10);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [names, setNames] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      const { data } = await supabase
        .from("tables")
        .select("*")
        .eq("restaurant_id", restaurantId);
      const map: Record<number, string> = {};
      (data || []).forEach((t: any) => {
        if (t.display_name) map[t.table_number] = t.display_name;
      });
      setNames(map);
    })();
  }, [restaurantId]);

  const handlePrint = () => window.print();

  const handleCopy = async (url: string, num: number) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(num);
      toast.success("Link copiado com sucesso");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  };

  const handleSaveName = async (num: number) => {
    if (!restaurantId) return;
    setSavingId(num);
    const display_name = names[num]?.trim() || null;
    const { error } = await supabase
      .from("tables")
      .upsert(
        { table_number: num, display_name, restaurant_id: restaurantId },
        { onConflict: "restaurant_id,table_number" }
      );
    setSavingId(null);
    if (error) {
      toast.error("Erro ao salvar nome");
    } else {
      toast.success(display_name ? `Nome salvo: ${display_name}` : "Nome removido");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border print:hidden">
        <div className="container py-4 flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-md hover:bg-secondary transition-colors" aria-label="Voltar para gestão do cardápio">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-extrabold text-foreground">Gerador de QR Codes</h1>
          <button
            onClick={handlePrint}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm"
            aria-label="Imprimir QR Codes"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </header>

      <main className="container py-6">
        <div className="flex gap-4 mb-8 print:hidden">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1" htmlFor="qr-base-url">URL base</label>
            <input
              id="qr-base-url"
              className="px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm w-64"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1" htmlFor="qr-table-count">Nº de mesas</label>
            <input
              id="qr-table-count"
              className="px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm w-24"
              type="number"
              min={1}
              max={100}
              value={tableCount}
              onChange={(e) => setTableCount(parseInt(e.target.value) || 1)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map((num) => {
            const url = `${baseUrl}/${restaurantSlug || ""}?mesa=${num}`;
            const customName = names[num] || "";
            const displayLabel = customName.trim() || `Mesa ${num}`;
            return (
              <div key={num} className="bg-card text-card-foreground border border-border rounded-2xl overflow-hidden shadow-sm print:break-inside-avoid">
                <div className="p-5 flex flex-col items-center gap-4 text-center">
                  <div className="rounded-xl border border-border bg-background p-3 text-foreground">
                    <QRCodeSVG value={url} size={160} level="M" bgColor="transparent" fgColor="currentColor" className="text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-extrabold text-foreground">{displayLabel}</p>
                    {customName.trim() && (
                      <p className="text-xs font-medium text-muted-foreground">Mesa {num}</p>
                    )}
                    <p className="max-w-[18rem] text-sm font-medium leading-relaxed text-foreground">
                      Aproxime o celular para abrir o cardápio acessível com áudio e Libras.
                    </p>
                  </div>
                </div>

                <div className="border-t border-border bg-muted/50 px-4 py-3 space-y-3 print:hidden">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1" htmlFor={`name-${num}`}>
                      Nome personalizado (opcional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id={`name-${num}`}
                        type="text"
                        placeholder={`Mesa ${num}`}
                        className="flex-1 px-2 py-1.5 rounded-md bg-background border border-input text-foreground text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={customName}
                        onChange={(e) => setNames((p) => ({ ...p, [num]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSaveName(num); } }}
                        aria-describedby={`name-${num}-hint`}
                      />
                      <span id={`name-${num}-hint`} className="sr-only">
                        Digite um nome para esta mesa e ative o botão Salvar para confirmar
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSaveName(num)}
                        disabled={savingId === num}
                        className="shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-xs font-medium hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                        aria-label={`Salvar nome da mesa ${num}`}
                      >
                        <Save className="w-3.5 h-3.5" /> Salvar
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Link da mesa:</p>
                    <div className="flex items-center gap-2">
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 text-xs text-primary underline break-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                        aria-label={`Abrir link da mesa ${num}`}
                      >
                        {url}
                      </a>
                      <button
                        onClick={() => handleCopy(url, num)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-input bg-background text-foreground text-xs font-medium hover:bg-secondary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        aria-label={`Copiar link da mesa ${num}`}
                      >
                        {copiedId === num ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === num ? "Copiado" : "Copiar"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <AccessibilityToolbar />
    </div>
  );
}
