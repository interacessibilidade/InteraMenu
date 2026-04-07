import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Printer } from "lucide-react";
import { Link } from "react-router-dom";

export default function QRCodeGenerator() {
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {tables.map((num) => {
            const url = `${baseUrl}/?mesa=${num}`;
            return (
              <div key={num} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-3 print:break-inside-avoid">
                <QRCodeSVG value={url} size={140} level="M" bgColor="transparent" fgColor="currentColor" className="text-foreground" />
                <p className="text-xl font-extrabold text-foreground">Mesa {num}</p>
                <p className="text-xs text-muted-foreground break-all text-center">{url}</p>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
