import { QRCodeSVG } from "qrcode.react";
import { Volume2, Hand, Type, Contrast, Globe, Image as ImageIcon } from "lucide-react";
import seloAcessibilidade from "@/assets/selo-acessibilidade.png";

export type TemplateId = "minimal" | "modern" | "bistro";
export type FormatId = "a6" | "mini" | "sticker";

export interface TemplateConfig {
  template: TemplateId;
  format: FormatId;
  primaryColor: string; // hex
  logoUrl?: string;
  restaurantName?: string;
  showSelo: boolean;
  showRestaurantName: boolean;
}

export interface QRTemplateProps {
  config: TemplateConfig;
  url: string;
  tableLabel: string;
  tableSubLabel?: string | null;
}

// Format dimensions in mm — used to compute aspect ratio. Rendered card has fixed pixel width
// for nice on-screen preview; print uses html2canvas at higher scale.
const FORMAT_DIMENSIONS: Record<FormatId, { w: number; h: number; label: string }> = {
  a6: { w: 105, h: 148, label: "A6 (10,5 × 14,8 cm)" },
  mini: { w: 80, h: 120, label: "Mini (8 × 12 cm)" },
  sticker: { w: 70, h: 70, label: "Adesivo (7 × 7 cm)" },
};

export function getFormatDimensions(format: FormatId) {
  return FORMAT_DIMENSIONS[format];
}

const ACCESS_ICONS = [
  { Icon: Volume2, label: "Áudio" },
  { Icon: Hand, label: "Libras" },
  { Icon: Type, label: "Ajuste de texto" },
  { Icon: Contrast, label: "Alto contraste" },
  { Icon: Globe, label: "Idiomas" },
  { Icon: ImageIcon, label: "Imagens" },
];

function AccessibilityIcons({ color, compact = false }: { color: string; compact?: boolean }) {
  return (
    <div className={`flex items-end justify-around w-full ${compact ? "gap-1" : "gap-2"}`}>
      {ACCESS_ICONS.map(({ Icon, label }) => (
        <div key={label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
          <Icon
            className={compact ? "w-4 h-4" : "w-5 h-5"}
            style={{ color }}
            strokeWidth={2.2}
            aria-hidden="true"
          />
          <span
            className={`${compact ? "text-[7px]" : "text-[9px]"} font-semibold leading-tight text-center`}
            style={{ color }}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------- TEMPLATE 1: Minimal Premium ----------
function MinimalTemplate({ config, url, tableLabel }: QRTemplateProps) {
  const { primaryColor, logoUrl, showSelo, showRestaurantName, restaurantName } = config;
  return (
    <div className="w-full h-full flex flex-col bg-white text-black">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: primaryColor, color: "#fff" }}
      >
        <h2 className="text-2xl font-extrabold tracking-tight truncate">{tableLabel}</h2>
        {logoUrl && (
          <img src={logoUrl} alt="" className="h-10 w-10 object-contain rounded-sm bg-white/10 p-0.5" crossOrigin="anonymous" />
        )}
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 text-center gap-2">
        <p className="text-[11px] font-medium text-neutral-700">
          Aproxime a câmera do celular para acessar nosso
        </p>
        <h3 className="text-xl font-extrabold leading-tight" style={{ color: primaryColor }}>
          Cardápio Acessível
        </h3>
        <p className="text-[10px] text-neutral-600 max-w-[80%]">
          Com áudio, recursos de acessibilidade, idiomas e muito mais.
        </p>

        <div className="flex items-center justify-center gap-3 mt-1">
          <div className="p-2 rounded-md border border-neutral-300 bg-white">
            <QRCodeSVG value={url} size={96} level="M" bgColor="#ffffff" fgColor="#000000" />
          </div>
          {showSelo && (
            <img src={seloAcessibilidade} alt="Selo Parceiro da Inclusão" className="w-20 h-20 object-contain" crossOrigin="anonymous" />
          )}
        </div>
        {showRestaurantName && restaurantName && (
          <p className="text-[10px] font-semibold mt-1 truncate max-w-full" style={{ color: primaryColor }}>
            {restaurantName}
          </p>
        )}
      </div>

      {/* Icons + Footer */}
      <div className="px-3 pt-2 pb-1 bg-white border-t border-neutral-200">
        <AccessibilityIcons color="#1a1a1a" />
      </div>
      <div
        className="text-center py-1.5 text-[10px] font-semibold"
        style={{ backgroundColor: primaryColor, color: "#fff" }}
      >
        Mais autonomia para você escolher
      </div>
    </div>
  );
}

// ---------- TEMPLATE 2: Modern ----------
function ModernTemplate({ config, url, tableLabel }: QRTemplateProps) {
  const { primaryColor, logoUrl, showSelo, showRestaurantName, restaurantName } = config;
  return (
    <div className="w-full h-full flex flex-col bg-white text-black relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{ backgroundColor: primaryColor }}
      />
      <div className="flex items-center justify-between px-4 pt-5 pb-2">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-9 object-contain" crossOrigin="anonymous" />
        ) : (
          <span className="text-xs font-bold tracking-widest" style={{ color: primaryColor }}>
            {(restaurantName || "RESTAURANTE").toUpperCase()}
          </span>
        )}
        {showSelo && (
          <img src={seloAcessibilidade} alt="Selo Parceiro da Inclusão" className="w-12 h-12 object-contain" crossOrigin="anonymous" />
        )}
      </div>

      <div className="px-4">
        <div
          className="rounded-lg px-3 py-2 text-center"
          style={{ backgroundColor: primaryColor, color: "#fff" }}
        >
          <p className="text-[9px] uppercase tracking-widest opacity-80">Sua mesa</p>
          <p className="text-2xl font-black leading-none mt-0.5">{tableLabel}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 text-center gap-2">
        <h3 className="text-lg font-extrabold" style={{ color: primaryColor }}>
          Cardápio Acessível
        </h3>
        <p className="text-[10px] text-neutral-600">
          Aproxime a câmera para acessar
        </p>
        <div
          className="p-2.5 rounded-xl"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="bg-white p-1.5 rounded-md">
            <QRCodeSVG value={url} size={110} level="M" bgColor="#ffffff" fgColor="#000000" />
          </div>
        </div>
        <p className="text-[9px] text-neutral-500 max-w-[85%]">
          Com áudio, recursos de acessibilidade, idiomas e muito mais.
        </p>
      </div>

      <div className="px-3 py-2" style={{ backgroundColor: `${primaryColor}10` }}>
        <AccessibilityIcons color={primaryColor} />
      </div>
      <div className="text-center py-1.5 text-[10px] font-bold text-white" style={{ backgroundColor: primaryColor }}>
        {showRestaurantName && restaurantName ? restaurantName + " · " : ""}Mais autonomia para você escolher
      </div>
    </div>
  );
}

// ---------- TEMPLATE 3: Café/Bistrô ----------
function BistroTemplate({ config, url, tableLabel }: QRTemplateProps) {
  const { primaryColor, logoUrl, showSelo, showRestaurantName, restaurantName } = config;
  return (
    <div
      className="w-full h-full flex flex-col text-black"
      style={{ backgroundColor: "#faf6ee" }}
    >
      <div className="text-center px-4 pt-3 pb-2 border-b-2" style={{ borderColor: primaryColor }}>
        {logoUrl && (
          <img src={logoUrl} alt="" className="h-10 object-contain mx-auto mb-1" crossOrigin="anonymous" />
        )}
        {showRestaurantName && restaurantName && (
          <p className="text-[10px] italic tracking-wider" style={{ color: primaryColor }}>
            {restaurantName}
          </p>
        )}
        <h2 className="text-2xl font-serif italic font-bold mt-0.5" style={{ color: primaryColor }}>
          {tableLabel}
        </h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 text-center gap-2">
        <p className="text-[11px] font-serif italic text-neutral-700">
          Bem-vindo(a) ao nosso
        </p>
        <h3 className="text-xl font-serif font-extrabold" style={{ color: primaryColor }}>
          Cardápio Acessível
        </h3>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-white border-2" style={{ borderColor: primaryColor }}>
            <QRCodeSVG value={url} size={96} level="M" bgColor="#ffffff" fgColor="#000000" />
          </div>
          {showSelo && (
            <img src={seloAcessibilidade} alt="Selo Parceiro da Inclusão" className="w-20 h-20 object-contain" crossOrigin="anonymous" />
          )}
        </div>
        <p className="text-[10px] text-neutral-600 max-w-[85%] italic">
          Aproxime a câmera do celular. Com áudio, idiomas e recursos de acessibilidade.
        </p>
      </div>

      <div className="px-3 py-2 border-t-2" style={{ borderColor: primaryColor }}>
        <AccessibilityIcons color={primaryColor} />
      </div>
      <div className="text-center py-1.5 text-[10px] font-serif italic font-semibold" style={{ color: "#fff", backgroundColor: primaryColor }}>
        Mais autonomia para você escolher
      </div>
    </div>
  );
}

// ---------- STICKER (square, compact) — used regardless of template when format=sticker ----------
function StickerTemplate({ config, url, tableLabel }: QRTemplateProps) {
  const { primaryColor, showSelo } = config;
  return (
    <div className="w-full h-full flex flex-col bg-white text-black">
      <div
        className="text-center py-1 text-[10px] font-extrabold uppercase tracking-wider"
        style={{ backgroundColor: primaryColor, color: "#fff" }}
      >
        {tableLabel}
      </div>
      <div className="flex-1 flex items-center justify-center gap-2 px-2 py-2">
        <div className="p-1.5 rounded-md border border-neutral-300">
          <QRCodeSVG value={url} size={88} level="M" bgColor="#ffffff" fgColor="#000000" />
        </div>
        {showSelo && (
          <img src={seloAcessibilidade} alt="Selo Parceiro da Inclusão" className="w-14 h-14 object-contain" crossOrigin="anonymous" />
        )}
      </div>
      <div className="px-2 pb-1">
        <AccessibilityIcons color={primaryColor} compact />
      </div>
      <div className="text-center py-1 text-[8px] font-bold" style={{ backgroundColor: primaryColor, color: "#fff" }}>
        Cardápio Acessível
      </div>
    </div>
  );
}

export function QRTemplate(props: QRTemplateProps) {
  if (props.config.format === "sticker") return <StickerTemplate {...props} />;
  switch (props.config.template) {
    case "modern":
      return <ModernTemplate {...props} />;
    case "bistro":
      return <BistroTemplate {...props} />;
    default:
      return <MinimalTemplate {...props} />;
  }
}