import { useEffect, useRef, useState, ReactNode } from "react";
import { X } from "lucide-react";

interface AccessibleConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: (reason?: string) => void;
  onClose: () => void;
  danger?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  children?: ReactNode;
}

/**
 * Diálogo de confirmação acessível (focus trap, Escape fecha, foco devolvido
 * ao acionador ao fechar). Usado para toda ação consequente do projeto:
 * cancelar pedido com motivo, fechar comanda, etc. Nunca usa window.confirm
 * ou window.prompt, que não são confiáveis para leitores de tela.
 */
export function AccessibleConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  onConfirm,
  onClose,
  danger = false,
  requireReason = false,
  reasonLabel = "Motivo",
  reasonPlaceholder,
  children,
}: AccessibleConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const reasonInputRef = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason("");
      setReasonError(null);
      requestAnimationFrame(() => {
        (requireReason ? reasonInputRef.current : confirmButtonRef.current)?.focus();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleConfirmClick = () => {
    if (requireReason) {
      const trimmed = reason.trim();
      if (!trimmed) {
        setReasonError("Digite o motivo antes de confirmar.");
        reasonInputRef.current?.focus();
        return;
      }
      onConfirm(trimmed);
      return;
    }
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/50 p-4 overflow-y-auto pt-10 sm:pt-20"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-md bg-card border border-border rounded-lg shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 id="confirm-dialog-title" className="text-lg font-bold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar sem confirmar"
            className="p-2 -m-2 rounded-md hover:bg-secondary transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {description && <div className="text-sm text-muted-foreground mb-4">{description}</div>}

        {children}

        {requireReason && (
          <div className="mt-2 mb-4">
            <label htmlFor="confirm-dialog-reason" className="mb-1 block text-sm font-medium text-foreground">
              {reasonLabel}
            </label>
            <textarea
              id="confirm-dialog-reason"
              ref={reasonInputRef}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError(null);
              }}
              placeholder={reasonPlaceholder}
              rows={3}
              aria-invalid={!!reasonError}
              aria-describedby={reasonError ? "confirm-dialog-reason-error" : undefined}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {reasonError && (
              <p id="confirm-dialog-reason-error" role="alert" className="mt-1 text-sm text-destructive">
                {reasonError}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={handleConfirmClick}
            className={`min-h-11 px-4 py-2 rounded-md font-bold text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              danger
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : "bg-primary text-primary-foreground hover:opacity-90"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
