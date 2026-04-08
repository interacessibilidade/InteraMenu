import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, Loader2, ImageIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

interface ImageUploadProps {
  currentUrl: string;
  onUrlChange: (url: string) => void;
  altText: string;
  onAltChange: (alt: string) => void;
}

export default function ImageUpload({ currentUrl, onUrlChange, altText, onAltChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [generatingAlt, setGeneratingAlt] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const generateAltText = async (imageUrl: string) => {
    setGeneratingAlt(true);
    try {
      const { data, error } = await supabase.functions.invoke("describe-image", {
        body: { imageUrl },
      });
      if (error) throw error;
      if (data?.description) {
        onAltChange(data.description);
        toast.success("Descrição gerada automaticamente");
      }
    } catch (err: any) {
      console.error("Alt text generation failed:", err);
    } finally {
      setGeneratingAlt(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato inválido. Use .jpg, .jpeg ou .png");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("Arquivo muito grande. Máximo: 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = `restaurante-default/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("cardapio-imagens")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("cardapio-imagens")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      onUrlChange(publicUrl);
      toast.success("Upload concluído");

      // Auto-generate alt text via AI
      generateAltText(publicUrl);
    } catch (err: any) {
      toast.error("Erro ao enviar imagem: " + (err.message || "tente novamente"));
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = preview || currentUrl;

  const removeImage = () => {
    setPreview(null);
    onUrlChange("");
    onAltChange("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const inputClass = "w-full px-3 py-2.5 rounded-md bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "block text-sm font-semibold text-foreground mb-1";

  return (
    <div className="sm:col-span-2 space-y-3">
      <label className={labelClass}>Imagem do prato</label>

      {displayUrl ? (
        <div className="relative inline-block">
          <img
            src={displayUrl}
            alt={altText || "Preview do prato"}
            className="w-32 h-32 rounded-lg object-cover border border-border"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            aria-label="Remover imagem"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-background/70 rounded-lg flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          aria-label="Selecionar imagem do prato"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6" />
              <span className="text-xs font-medium">Enviar foto</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        aria-label="Imagem do prato"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {displayUrl && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs text-primary hover:underline"
        >
          Substituir imagem
        </button>
      )}

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {uploading ? "Upload em andamento..." : generatingAlt ? "Gerando descrição com IA..." : "Formatos: JPG, PNG · Máximo: 2MB"}
      </p>

      <div>
        <label className={labelClass}>
          Texto alternativo da imagem *
          {generatingAlt && <Sparkles className="inline w-3.5 h-3.5 ml-1 animate-pulse text-primary" />}
        </label>
        <input
          className={inputClass}
          value={altText}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder={generatingAlt ? "Gerando com IA..." : "Descreva a imagem para acessibilidade"}
          required={!!displayUrl}
        />
      </div>
    </div>
  );
}
