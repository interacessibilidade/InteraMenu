import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, ImageIcon, X } from "lucide-react";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { hexToHslString, restaurantThemeStyle, validateBrandColorContrast } from "@/lib/restaurantTheme";

const DEFAULT_COLOR = "#3a4a3f";

export default function BrandSettings() {
  useDocumentTitle("Identidade Visual — InteraMenu");
  const { restaurantId, refreshRestaurantProfile } = useAuth();
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [colorError, setColorError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("primary_color, logo_url")
        .eq("id", restaurantId)
        .single();
      if (!error && data) {
        setColor((data as any).primary_color || DEFAULT_COLOR);
        setLogoUrl((data as any).logo_url || "");
      }
      setLoading(false);
    })();
  }, [restaurantId]);

  async function handleSave() {
    if (!restaurantId) return;
    if (!hexToHslString(color)) {
      setColorError("Cor inválida. Use o formato #RRGGBB, por exemplo #2F6D3C.");
      return;
    }
    const contrastCheck = validateBrandColorContrast(color);
    if (!contrastCheck.ok) {
      setColorError(contrastCheck.message || "Essa cor não atende ao contraste mínimo de acessibilidade.");
      return;
    }
    setColorError(null);
    setSaving(true);
    const { error } = await supabase
      .from("restaurants")
      .update({ primary_color: color, logo_url: logoUrl || null } as any)
      .eq("id", restaurantId);

    if (error) {
      setSaving(false);
      toast.error("Não foi possível salvar. Tente novamente.");
      return;
    }

    // Atualiza a cor/logo em todo o sistema imediatamente (menu do admin,
    // cardápio, etc.), sem precisar sair e entrar de novo.
    await refreshRestaurantProfile();
    setSaving(false);
    toast.success("Identidade visual salva! A mudança já está valendo em todo o sistema.");
  }

  async function handleLogoFile(file: File) {
    if (!["image/png", "image/jpeg", "image/jpg", "image/svg+xml"].includes(file.type)) {
      toast.error("Use um arquivo PNG, JPG ou SVG.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 2MB.");
      return;
    }
    if (!restaurantId) return;

    setUploadingLogo(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const filePath = `${restaurantId}/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("cardapio-imagens")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("cardapio-imagens").getPublicUrl(filePath);
      setLogoUrl(urlData.publicUrl);
    } catch (e: any) {
      toast.error("Erro ao enviar o logo: " + (e.message || "tente novamente"));
    } finally {
      setUploadingLogo(false);
    }
  }

  const previewStyle = restaurantThemeStyle(color);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex items-center gap-3 py-5">
          <Link
            to="/admin"
            aria-label="Voltar para o painel"
            className="rounded-md p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">Identidade visual</h1>
            <p className="text-sm text-muted-foreground">Cor e logo do seu cardápio</p>
          </div>
        </div>
      </header>

      <main className="container max-w-xl py-8" role="main">
        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : (
          <div className="space-y-8">
            <section aria-labelledby="brand-color-heading">
              <h2 id="brand-color-heading" className="mb-1 text-lg font-bold text-foreground">Paleta de cores — cor principal</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Usada nos botões e destaques do seu cardápio. Escolhemos automaticamente um texto
                claro ou escuro por cima dela, para manter a leitura fácil.
              </p>
              <div className="flex items-center gap-3" role="group" aria-label="Paleta de cores: escolha da cor principal">
                <label htmlFor="brand-color-picker" className="sr-only">
                  Paleta de cores: selecionar visualmente a cor principal
                </label>
                <input
                  id="brand-color-picker"
                  type="color"
                  value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_COLOR}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-11 w-14 cursor-pointer rounded-md border border-input"
                />
                <div className="flex-1">
                  <label htmlFor="brand-color-hex" className="sr-only">
                    Paleta de cores: código da cor principal em hexadecimal
                  </label>
                  <input
                    id="brand-color-hex"
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#3A4A3F"
                    aria-invalid={!!colorError}
                    aria-describedby={colorError ? "brand-color-error" : undefined}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>
              {colorError && (
                <p id="brand-color-error" role="alert" className="mt-2 text-sm text-destructive">
                  {colorError}
                </p>
              )}
            </section>

            <section>
              <h2 className="mb-1 text-lg font-bold text-foreground">Logo ou ícone</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                Aparece no topo do cardápio, no lugar do ícone padrão. Opcional — sem logo, usamos
                um ícone genérico com a sua cor.
              </p>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="relative">
                    <img
                      src={logoUrl}
                      alt="Pré-visualização do logo"
                      className="h-16 w-16 rounded-full border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      aria-label="Remover logo"
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploadingLogo}
                    aria-label="Enviar logo"
                    className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  aria-label="Selecionar arquivo de logo"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoFile(file);
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingLogo}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {logoUrl ? "Substituir logo" : "Enviar logo (PNG, JPG ou SVG · até 2MB)"}
                </button>
              </div>
            </section>

            <section aria-label="Pré-visualização">
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Pré-visualização</h2>
              <div style={previewStyle} className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ${
                    logoUrl ? "bg-background border border-border" : "bg-primary"
                  }`}
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="h-full w-full object-contain p-0.5" />
                  ) : (
                    <ImageIcon className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
                  )}
                </div>
                <span className="text-sm font-bold text-foreground">Assim vai aparecer no topo do cardápio</span>
              </div>
            </section>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {saving ? "Salvando..." : "Salvar identidade visual"}
            </button>
          </div>
        )}
      </main>
      <AccessibilityToolbar />
    </div>
  );
}
