import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { X, Loader2, ImageIcon } from "lucide-react";
import { toast } from "sonner";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
const MAX_SIZE = 8 * 1024 * 1024;
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.75;

interface IngredientImageUploadProps {
  currentUrl: string;
  onUrlChange: (url: string) => void;
}

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

/**
 * Upload manual da foto de ingredientes. Se o restaurante subir uma foto
 * aqui, ela é usada no lugar da imagem gerada por IA — o cliente final
 * nunca aciona a geração automática quando já existe uma foto salva.
 */
export default function IngredientImageUpload({ currentUrl, onUrlChange }: IngredientImageUploadProps) {
  const { restaurantId } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/\.[^.]+$/, "")}.jpg`;
      const filePath = `${restaurantId}/ingredientes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("cardapio-imagens")
        .upload(filePath, compressed, { upsert: true, contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("cardapio-imagens")
        .getPublicUrl(filePath);

      onUrlChange(urlData.publicUrl);
      toast.success("Foto de ingredientes salva");
    } catch (err: any) {
      toast.error("Erro ao enviar imagem: " + (err.message || "tente novamente"));
    } finally {
      setUploading(false);
    }
  };

  const labelClass = "block text-sm font-semibold text-foreground mb-1";

  return (
    <div className="sm:col-span-2 space-y-3">
      <label className={labelClass}>Foto dos ingredientes (opcional)</label>
      <p className="text-xs text-muted-foreground">
        Se você não subir uma foto aqui, o botão de "ver ingredientes" simplesmente não aparece
        pra esse prato no cardápio — a geração automática por IA foi desativada.
      </p>

      {currentUrl ? (
        <div className="relative inline-block">
          <img
            src={currentUrl}
            alt=""
            className="w-32 h-32 rounded-lg object-cover border border-border"
          />
          <button
            type="button"
            onClick={() => onUrlChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
            aria-label="Remover foto de ingredientes e voltar a usar geração automática"
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
          aria-label="Selecionar foto dos ingredientes"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <ImageIcon className="w-6 h-6" />
              <span className="text-xs font-medium text-center px-2">Enviar foto (opcional)</span>
            </>
          )}
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png"
        className="hidden"
        aria-label="Foto dos ingredientes"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {currentUrl && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs text-primary hover:underline block"
        >
          Substituir foto
        </button>
      )}

      {!currentUrl && (
        <p className="text-xs text-muted-foreground">
          Sem foto própria, o botão de ver ingredientes não aparece pra esse prato.
        </p>
      )}
    </div>
  );
}
