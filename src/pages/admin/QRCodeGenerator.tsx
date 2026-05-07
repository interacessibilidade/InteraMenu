import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Printer, Download, FileText, Save, Upload, X, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { supabase } from "@/integrations/supabase/client";
import {
  QRTemplate,
  TemplateConfig,
  TemplateId,
  FormatId,
  getFormatDimensions,
} from "@/components/qr-templates/QRTemplate";

const TEMPLATE_OPTIONS: { id: TemplateId; name: string; desc: string }[] = [
  { id: "minimal", name: "Minimalista Premium", desc: "Elegante e clean" },
  { id: "modern", name: "Moderno", desc: "QR code em destaque" },
  { id: "bistro", name: "Café/Bistrô", desc: "Sofisticado e acolhedor" },
];

const FORMAT_OPTIONS: { id: FormatId; name: string }[] = [
  { id: "a6", name: "A6 — Display de mesa" },
  { id: "mini", name: "Mini display (8×12cm)" },
  { id: "sticker", name: "Adesivo (7×7cm)" },
];

const COLOR_PRESETS: { name: string; value: string }[] = [
  { name: "Preto", value: "#1a1a1a" },
  { name: "Verde", value: "#0a4d2e" },
  { name: "Vinho", value: "#6b1f2a" },
  { name: "Azul", value: "#1e3a5f" },
  { name: "Marrom", value: "#5a3924" },
  { name: "Dourado", value: "#a8842b" },
];

// Pixel sizing for screen preview — keeps aspect ratio of physical format
const PREVIEW_WIDTH_PX = 280;

export default function QRCodeGenerator() {
  const [baseUrl, setBaseUrl] = useState(window.location.origin);
  const [tableCount, setTableCount] = useState(10);
  const [names, setNames] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  const [config, setConfig] = useState<TemplateConfig>({
    template: "minimal",
    format: "a6",
    primaryColor: "#1a1a1a",
    logoUrl: "",
    restaurantName: "Café Infinito Olhar",
    showSelo: true,
    showRestaurantName: true,
  });

  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const tables = Array.from({ length: tableCount }, (_, i) => i + 1);
  const dim = getFormatDimensions(config.format);
  const previewHeight = Math.round((PREVIEW_WIDTH_PX * dim.h) / dim.w);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("tables").select("*");
      const map: Record<number, string> = {};
      (data || []).forEach((t: any) => {
        if (t.display_name) map[t.table_number] = t.display_name;
      });
      setNames(map);
    })();
  }, []);

  const handleSaveName = async (num: number) => {
    setSavingId(num);
    const display_name = names[num]?.trim() || null;
    const { error } = await supabase
      .from("tables")
      .upsert({ table_number: num, display_name }, { onConflict: "table_number" });
    setSavingId(null);
    if (error) toast.error("Erro ao salvar nome");
    else toast.success(display_name ? `Nome salvo: ${display_name}` : "Nome removido");
  };

  const handleLogoUpload = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo muito grande (máx 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setConfig((c) => ({ ...c, logoUrl: e.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const renderToCanvas = async (el: HTMLDivElement) => {
    return html2canvas(el, {
      scale: 4,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
  };

  const exportPNG = async (num: number) => {
    const el = cardRefs.current[num];
    if (!el) return;
    setExporting(true);
    try {
      const canvas = await renderToCanvas(el);
      const link = document.createElement("a");
      link.download = `mesa-${num}-${config.template}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("PNG exportado");
    } catch {
      toast.error("Erro ao exportar PNG");
    } finally {
      setExporting(false);
    }
  };

  const exportAllPDF = async () => {
    setExporting(true);
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 10;
      const cardW = dim.w;
      const cardH = dim.h;
      const cols = Math.max(1, Math.floor((pageW - margin * 2) / (cardW + 5)));
      const rows = Math.max(1, Math.floor((pageH - margin * 2) / (cardH + 5)));
      const perPage = cols * rows;

      for (let i = 0; i < tables.length; i++) {
        const num = tables[i];
        const el = cardRefs.current[num];
        if (!el) continue;
        const canvas = await renderToCanvas(el);
        const imgData = canvas.toDataURL("image/png");
        const pageIndex = Math.floor(i / perPage);
        const slot = i % perPage;
        const col = slot % cols;
        const row = Math.floor(slot / cols);
        if (slot === 0 && pageIndex > 0) pdf.addPage();
        const x = margin + col * (cardW + 5);
        const y = margin + row * (cardH + 5);
        pdf.addImage(imgData, "PNG", x, y, cardW, cardH);
      }

      pdf.save(`qrcodes-${config.template}-${config.format}.pdf`);
      toast.success("PDF gerado");
    } catch (e: any) {
      toast.error("Erro ao gerar PDF: " + (e.message || ""));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border print:hidden">
        <div className="container py-4 flex items-center gap-3 flex-wrap">
          <Link to="/admin" className="interactive-feedback p-2 rounded-md hover:bg-secondary" aria-label="Voltar">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-extrabold text-foreground">QR Codes Personalizados</h1>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="interactive-feedback flex items-center gap-2 px-3 py-2 rounded-md bg-secondary text-secondary-foreground font-medium text-sm"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button
              onClick={exportAllPDF}
              disabled={exporting}
              className="interactive-feedback flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm disabled:opacity-60"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Exportar PDF (A4)
            </button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Configuration Panel */}
        <section className="bg-card border border-border rounded-2xl p-5 print:hidden space-y-5">
          <h2 className="text-base font-bold text-foreground">Personalização</h2>

          {/* Templates */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Template</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TEMPLATE_OPTIONS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setConfig((c) => ({ ...c, template: t.id }))}
                  className={`interactive-feedback text-left p-3 rounded-lg border-2 transition-colors ${
                    config.template === t.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  aria-pressed={config.template === t.id}
                >
                  <p className="font-bold text-sm text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Formato de impressão</p>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setConfig((c) => ({ ...c, format: f.id }))}
                  className={`interactive-feedback px-3 py-2 rounded-md text-sm font-medium border ${
                    config.format === f.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-input hover:bg-secondary"
                  }`}
                  aria-pressed={config.format === f.id}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cor principal</p>
            <div className="flex flex-wrap items-center gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setConfig((s) => ({ ...s, primaryColor: c.value }))}
                  className={`interactive-feedback w-10 h-10 rounded-full border-2 ${config.primaryColor === c.value ? "border-foreground scale-110" : "border-border"}`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.name}
                  title={c.name}
                />
              ))}
              <input
                type="color"
                value={config.primaryColor}
                onChange={(e) => setConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                className="w-10 h-10 rounded-full border border-border cursor-pointer"
                aria-label="Cor personalizada"
              />
            </div>
          </div>

          {/* Logo + restaurant name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Logo</label>
              <div className="flex items-center gap-3">
                {config.logoUrl ? (
                  <div className="relative">
                    <img src={config.logoUrl} alt="Logo preview" className="w-16 h-16 object-contain rounded-md border border-border bg-white" />
                    <button
                      onClick={() => setConfig((c) => ({ ...c, logoUrl: "" }))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      aria-label="Remover logo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="interactive-feedback cursor-pointer flex items-center gap-2 px-3 py-2 rounded-md bg-background border border-input text-sm font-medium hover:bg-secondary">
                    <Upload className="w-4 h-4" /> Enviar logo
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                    />
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nome do restaurante</label>
              <input
                type="text"
                value={config.restaurantName || ""}
                onChange={(e) => setConfig((c) => ({ ...c, restaurantName: e.target.value }))}
                className="w-full px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm"
                placeholder="Ex: Café Infinito Olhar"
              />
              <div className="flex flex-wrap gap-3 mt-2 text-xs">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={config.showRestaurantName}
                    onChange={(e) => setConfig((c) => ({ ...c, showRestaurantName: e.target.checked }))}
                  />
                  Exibir nome
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={config.showSelo}
                    onChange={(e) => setConfig((c) => ({ ...c, showSelo: e.target.checked }))}
                  />
                  Exibir selo Parceiro da Inclusão
                </label>
              </div>
            </div>
          </div>

          {/* Base URL + tables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">URL base</label>
              <input
                className="w-full px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Nº de mesas</label>
              <input
                className="w-full px-3 py-2 rounded-md bg-background border border-input text-foreground text-sm"
                type="number"
                min={1}
                max={100}
                value={tableCount}
                onChange={(e) => setTableCount(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        </section>

        {/* Preview Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((num) => {
            const url = `${baseUrl}/?mesa=${num}`;
            const customName = names[num] || "";
            const tableLabel = customName.trim() || `Mesa ${num}`;
            return (
              <div key={num} className="bg-card text-card-foreground border border-border rounded-2xl p-4 shadow-sm space-y-3 print:break-inside-avoid">
                {/* Card preview */}
                <div className="flex justify-center">
                  <div
                    ref={(el) => { cardRefs.current[num] = el; }}
                    style={{ width: PREVIEW_WIDTH_PX, height: previewHeight }}
                    className="overflow-hidden rounded-lg shadow-md border border-border"
                  >
                    <QRTemplate
                      config={config}
                      url={url}
                      tableLabel={tableLabel}
                      tableSubLabel={customName.trim() ? `Mesa ${num}` : null}
                    />
                  </div>
                </div>

                <div className="space-y-2 print:hidden">
                  <label className="block text-xs font-semibold text-muted-foreground" htmlFor={`name-${num}`}>
                    Nome personalizado
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`name-${num}`}
                      type="text"
                      placeholder={`Mesa ${num}`}
                      className="flex-1 px-2 py-1.5 rounded-md bg-background border border-input text-foreground text-sm"
                      value={customName}
                      onChange={(e) => setNames((p) => ({ ...p, [num]: e.target.value }))}
                      onBlur={() => handleSaveName(num)}
                    />
                    <button
                      onClick={() => handleSaveName(num)}
                      disabled={savingId === num}
                      className="interactive-feedback shrink-0 flex items-center gap-1 px-2 py-1.5 rounded-md border border-input bg-background text-foreground text-xs font-medium hover:bg-secondary disabled:opacity-60"
                      aria-label={`Salvar nome da mesa ${num}`}
                    >
                      <Save className="w-3.5 h-3.5" /> Salvar
                    </button>
                  </div>
                  <button
                    onClick={() => exportPNG(num)}
                    disabled={exporting}
                    className="interactive-feedback w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60"
                  >
                    <Download className="w-4 h-4" /> Baixar PNG
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}