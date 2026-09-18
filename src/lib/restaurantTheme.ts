// Converte uma cor hex (#rrggbb) para a string "H S% L%" que as variáveis
// de tema do Tailwind/shadcn esperam (ex: "222.2 47.4% 11.2%").
export function hexToHslString(hex: string): string | null {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${(h * 360).toFixed(1)} ${(s * 100).toFixed(1)}% ${(l * 100).toFixed(1)}%`;
}

// Decide se o texto sobre essa cor deve ser quase-branco ou quase-preto,
// para manter contraste mínimo de acessibilidade (aprox. WCAG AA).
export function contrastingForegroundHsl(hex: string): string {
  const clean = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return "0 0% 98%";

  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);

  // Fórmula de luminância percebida (YIQ)
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 150 ? "0 0% 9%" : "0 0% 98%";
}

// Estilo inline pronto para aplicar num elemento envolvente, sobrescrevendo
// as variáveis de cor principal do tema para essa árvore de componentes.
export function restaurantThemeStyle(primaryColorHex?: string | null): Record<string, string> {
  if (!primaryColorHex) return {};
  const hsl = hexToHslString(primaryColorHex);
  if (!hsl) return {};
  return {
    ["--primary" as any]: hsl,
    ["--primary-foreground" as any]: contrastingForegroundHsl(primaryColorHex),
  };
}
