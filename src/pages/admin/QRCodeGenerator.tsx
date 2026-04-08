import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer, Copy, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function QRCodeGenerator() {
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [tableCount, setTableCount] = useState(10);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border print:hidden">
        <div className="container py-4 flex items-center gap-3">
          <Link to="/admin/gestao" className="p-2 rounded-md hover:bg-secondary transition-colors" aria-label="Voltar">
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
            <label className="block text-sm font-semibold text-foreground mb-1">URL base</label>
            <input
              className="px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm w-64"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Nº de mesas</label>
            <input
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
            const url = `${baseUrl}/?mesa=${num}`;
            return (
              <div key={num} className="bg-card text-card-foreground border border-border rounded-2xl overflow-hidden shadow-sm print:break-inside-avoid">
                {/* QR Code + info */}
                <div className="p-5 flex flex-col items-center gap-4 text-center">
                  <div className="rounded-xl border border-border bg-background p-3 text-foreground">
                    <QRCodeSVG value={url} size={160} level="M" bgColor="transparent" fgColor="currentColor" className="text-foreground" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-2xl font-extrabold text-foreground">Mesa {num}</p>
                    <p className="max-w-[18rem] text-sm font-medium leading-relaxed text-foreground">
                      Aproxime o celular para abrir o cardápio acessível com áudio e Libras.
                    </p>
                  </div>
                </div>

                {/* URL area */}
                <div className="border-t border-border bg-muted/50 px-4 py-3 space-y-2 print:hidden">
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
            );
          })}
        </div>
      </main>
    </div>
  );
}
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [tableCount, setTableCount] = useState(10);

  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border print:hidden">
        <div className="container py-4 flex items-center gap-3">
          <Link to="/admin/gestao" className="p-2 rounded-md hover:bg-secondary transition-colors" aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-extrabold text-foreground">Gerador de QR Codes</h1>
          <button
            onClick={handlePrint}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
        </div>
      </header>

      <main className="container py-6">
        <div className="flex gap-4 mb-8 print:hidden">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">URL base</label>
            <input
              className="px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm w-64"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Nº de mesas</label>
            <input
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
            const url = `${baseUrl}/?mesa=${num}`;
            return (
              <div key={num} className="bg-card text-card-foreground border border-border rounded-2xl p-5 flex flex-col items-center gap-4 text-center shadow-sm print:break-inside-avoid">
                <div className="rounded-xl border border-border bg-background p-3 text-foreground">
                  <QRCodeSVG value={url} size={160} level="M" bgColor="transparent" fgColor="currentColor" className="text-foreground" />
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-extrabold text-foreground">Mesa {num}</p>
                  <p className="max-w-[18rem] text-sm font-medium leading-relaxed text-foreground">
                    Aproxime o celular para abrir o cardápio acessível com áudio e Libras.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
