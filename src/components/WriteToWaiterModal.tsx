import { useEffect, useRef, useState } from "react";
import { PenSquare, X, Eraser } from "lucide-react";
import { useLanguage, type Language } from "@/hooks/useLanguage";

const labels: Record<Language, {
  button: string;
  title: string;
  placeholder: string;
  clear: string;
  close: string;
  hint: string;
  ariaOpen: string;
}> = {
  pt: {
    button: "Escrever para o Garçom",
    title: "Mensagem para o garçom",
    placeholder: "Digite sua mensagem para mostrar ao garçom...",
    clear: "Limpar",
    close: "Fechar",
    hint: "Mostre esta tela ao garçom.",
    ariaOpen: "Abrir caixa para escrever mensagem ao garçom",
  },
  en: {
    button: "Write to Waiter",
    title: "Message for the waiter",
    placeholder: "Type your message to show the waiter...",
    clear: "Clear",
    close: "Close",
    hint: "Show this screen to the waiter.",
    ariaOpen: "Open box to write a message to the waiter",
  },
  es: {
    button: "Escribir al Camarero",
    title: "Mensaje para el camarero",
    placeholder: "Escribe tu mensaje para mostrar al camarero...",
    clear: "Limpiar",
    close: "Cerrar",
    hint: "Muestra esta pantalla al camarero.",
    ariaOpen: "Abrir caja para escribir un mensaje al camarero",
  },
  fr: {
    button: "Écrire au Serveur",
    title: "Message pour le serveur",
    placeholder: "Saisissez votre message à montrer au serveur...",
    clear: "Effacer",
    close: "Fermer",
    hint: "Montrez cet écran au serveur.",
    ariaOpen: "Ouvrir la boîte pour écrire un message au serveur",
  },
};

export function WriteToWaiterModal() {
  const { language } = useLanguage();
  const l = labels[language] || labels.pt;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => textareaRef.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => triggerRef.current?.focus(), 50);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="interactive-feedback inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={l.ariaOpen}
      >
        <PenSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">{l.button}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="write-waiter-title"
          onClick={handleClose}
        >
          <div
            className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2
                id="write-waiter-title"
                className="text-lg font-bold text-foreground flex items-center gap-2"
              >
                <PenSquare className="w-5 h-5 text-primary" aria-hidden="true" />
                {l.title}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="interactive-feedback p-2 rounded-md hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={l.close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto space-y-3">
              <p className="text-sm text-muted-foreground font-medium">{l.hint}</p>
              <label htmlFor="waiter-message" className="sr-only">
                {l.placeholder}
              </label>
              <textarea
                ref={textareaRef}
                id="waiter-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={l.placeholder}
                className="w-full min-h-[40vh] sm:min-h-[260px] rounded-lg border-2 border-input bg-background p-4 text-2xl sm:text-3xl font-bold leading-snug text-foreground placeholder:text-muted-foreground/70 placeholder:font-normal placeholder:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                aria-label={l.placeholder}
              />
            </div>

            <div className="p-4 border-t border-border flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => {
                  setMessage("");
                  textareaRef.current?.focus();
                }}
                disabled={!message}
                className="interactive-feedback inline-flex items-center gap-2 h-11 px-4 rounded-md border border-input bg-background text-sm font-semibold hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={l.clear}
              >
                <Eraser className="w-4 h-4" aria-hidden="true" />
                {l.clear}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="interactive-feedback inline-flex items-center gap-2 h-11 px-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {l.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
