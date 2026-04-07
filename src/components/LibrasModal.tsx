import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LibrasModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  itemName: string;
}

function getEmbedUrl(url: string): string {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;

  return url;
}

export function LibrasModal({ open, onClose, videoUrl, itemName }: LibrasModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Vídeo em Libras para ${itemName}`}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-lg w-full max-w-lg overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-bold text-foreground">Libras — {itemName}</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                src={getEmbedUrl(videoUrl)}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title={`Vídeo em Libras: ${itemName}`}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
