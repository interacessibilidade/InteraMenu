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
    hint: "Esta mensagem não é enviada pelo sistema. Mostre a tela do celular pessoalmente ao garçom para ele ler.",
    ariaOpen: "Escrever mensagem para mostrar pessoalmente ao garçom. Esta opção não envia nada pelo sistema, é só para exibir na tela do celular.",
  },
  en: {
    button: "Write to Waiter",
    title: "Message for the waiter",
    placeholder: "Type your message to show the waiter...",
    clear: "Clear",
    close: "Close",
    hint: "This message is not sent through the system. Show your phone screen to the waiter in person so they can read it.",
    ariaOpen: "Write a message to show the waiter in person. This does not send anything through the system, it only displays on your phone screen.",
  },
  es: {
    button: "Escribir al Camarero",
    title: "Mensaje para el camarero",
    placeholder: "Escribe tu mensaje para mostrar al camarero...",
    clear: "Limpiar",
    close: "Cerrar",
    hint: "Este mensaje no se envía por el sistema. Muestra la pantalla de tu celular personalmente al camarero para que la lea.",
    ariaOpen: "Escribir un mensaje para mostrar personalmente al camarero. Esta opción no envía nada por el sistema, solo se muestra en la pantalla del celular.",
  },
  fr: {
    button: "Écrire au Serveur",
    title: "Message pour le serveur",
    placeholder: "Saisissez votre message à montrer au serveur...",
    clear: "Effacer",
    close: "Fermer",
    hint: "Ce message n'est pas envoyé par le système. Montrez l'écran de votre téléphone en personne au serveur pour qu'il puisse le lire.",
    ariaOpen: "Écrire un message à montrer en personne au serveur. Cette option n'envoie rien par le système, elle s'affiche uniquement sur l'écran du téléphone.",
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
        className="interactive-feedback inline-flex items-center gap-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90dvh] flex flex-col overflow-hidden"
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
                className="w-full min-h-[180px] sm:min-h-[260px] max-h-[45dvh] rounded-lg border-2 border-input bg-background p-4 text-2xl sm:text-3xl font-bold leading-snug text-foreground placeholder:text-muted-foreground/70 placeholder:font-normal placeholder:text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
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
