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
// Calcula a luminância relativa (fórmula oficial do WCAG) de uma cor hex.
function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const linearize = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

// Razão de contraste WCAG entre duas cores hex (1:1 a 21:1).
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

// Verifica se uma cor escolhida como "cor principal" é acessível: precisa ser
// distinguível do fundo branco da página (3:1, contraste de componente de UI)
// e precisa permitir texto legível em cima dela, preto ou branco (4,5:1).
export function validateBrandColorContrast(hex: string): { ok: boolean; message?: string } {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return { ok: false, message: "Cor inválida. Use o formato #RRGGBB." };
  }

  const contrastWithPageBackground = contrastRatio(hex, "#FFFFFF");
  if (contrastWithPageBackground < 4.5) {
    return {
      ok: false,
      message:
        "Essa cor não atinge o contraste mínimo de 4,5:1 exigido pela acessibilidade. Escolha uma cor mais escura ou mais saturada.",
    };
  }

  const contrastWithWhiteText = contrastRatio(hex, "#FFFFFF");
  const contrastWithBlackText = contrastRatio(hex, "#000000");
  if (Math.max(contrastWithWhiteText, contrastWithBlackText) < 4.5) {
    return {
      ok: false,
      message:
        "Com essa cor, o texto por cima fica com contraste insuficiente (nem preto nem branco leem bem). Escolha uma cor mais escura ou mais clara.",
    };
  }

  return { ok: true };
}

export function restaurantThemeStyle(primaryColorHex?: string | null): Record<string, string> {
  if (!primaryColorHex) return {};
  const hsl = hexToHslString(primaryColorHex);
  if (!hsl) return {};
  const foreground = contrastingForegroundHsl(primaryColorHex);
  return {
    ["--primary" as any]: hsl,
    ["--primary-foreground" as any]: foreground,
    // "accent" (usado em itens selecionados/foco de menus) e "ring" (o contorno
    // de foco do teclado) também precisam seguir a cor da identidade — do
    // contrário eles continuam na cor verde padrão do tema em vez da cor
    // escolhida pelo restaurante.
    ["--accent" as any]: hsl,
    ["--accent-foreground" as any]: foreground,
    ["--ring" as any]: hsl,
  };
}
