import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X, Loader2, ImageIcon, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 8 * 1024 * 1024; // 8MB no arquivo original — a compressão reduz bastante antes do envio
const MAX_DIMENSION = 1280; // lado maior da imagem final, em pixels
const JPEG_QUALITY = 0.75;

interface ImageUploadProps {
  currentUrl: string;
  onUrlChange: (url: string) => void;
  altText: string;
  onAltChange: (alt: string) => void;
}

/**
 * Redimensiona e recomprime a imagem inteiramente no navegador, antes do upload.
 * Isso reduz o espaço ocupado no Storage e o tráfego (egress) gerado a cada
 * vez que um cliente abre o cardápio e a foto é carregada.
 */
function compressImage(file: File, maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Não foi possível processar a imagem neste navegador."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (blob) resolve(blob);
          else reject(new Error("Falha ao comprimir a imagem."));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível carregar a imagem selecionada."));
    };

    img.src = objectUrl;
  });
}

export default function ImageUpload({ currentUrl, onUrlChange, altText, onAltChange }: ImageUploadProps) {
  const { restaurantId } = useAuth();
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
      toast.error("Arquivo muito grande. Máximo: 8MB antes da compressão");
      return;
    }
    if (!restaurantId) {
      toast.error("Não foi possível identificar o restaurante logado. Faça login novamente.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const compressed = await compressImage(file);

      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.[^.]+$/, "")}.jpg`;
      const filePath = `${restaurantId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("cardapio-imagens")
        .upload(filePath, compressed, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("cardapio-imagens")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      onUrlChange(publicUrl);
      toast.success("Upload concluído");

      // Gera o texto alternativo automaticamente via IA
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
      <p className="text-xs text-muted-foreground">
        Fique à vontade para enviar qualquer foto — ela nunca é cortada. Mas, para preencher bem o
        espaço sem sobrar borda, fotos na <strong>horizontal</strong>, com o prato centralizado
        (proporção aproximada de 16:10, por exemplo 1600×1000px), costumam ficar melhores.
      </p>

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

      <p id="image-upload-status" className="text-xs text-muted-foreground" aria-live="polite">
        {uploading ? "Upload em andamento..." : generatingAlt ? "Gerando descrição com IA, aguarde..." : "Formatos: JPG, PNG · a imagem é redimensionada e comprimida automaticamente. Depois de enviar uma foto, aguarde alguns segundos: a IA preenche a descrição abaixo automaticamente."}
      </p>

      <div>
        <label className={labelClass} htmlFor="item-image-alt">
          Texto alternativo da imagem *
          {generatingAlt && <Sparkles className="inline w-3.5 h-3.5 ml-1 animate-pulse text-primary" aria-hidden="true" />}
        </label>
        <input
          id="item-image-alt"
          className={inputClass}
          value={altText}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder={generatingAlt ? "Gerando com IA..." : "Descreva a imagem para acessibilidade"}
          aria-describedby="image-upload-status"
          required={!!displayUrl}
        />
      </div>
    </div>
  );
}
