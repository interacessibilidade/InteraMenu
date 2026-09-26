import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Trash2, X, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";

interface CartModalProps {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
  tableNumber: number;
  onOrderCreated: (orderId: string) => void;
}

function formatMoney(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function CartModal({ open, onClose, restaurantId, tableNumber, onOrderCreated }: CartModalProps) {
  const { items, subtotal, updateQuantity, removeItem, clear } = useCart();
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setStep("edit");
      setErrorMessage(null);
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    }
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
            'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
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

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrorMessage(null);
    const { data, error } = await supabase.rpc("create_order", {
      p_restaurant_id: restaurantId,
      p_table_number: tableNumber,
      p_items: items.map((i) => ({
        menu_item_id: i.menuItemId,
        quantity: i.quantity,
        notes: i.notes || null,
      })),
      p_notes: null,
    });

    setSubmitting(false);

    if (error || !data) {
      setErrorMessage(
        error?.message?.includes("disponível")
          ? "Um dos itens do seu pedido não está mais disponível. Atualize o cardápio (recarregue a página) e monte o pedido novamente."
          : "Não foi possível enviar o pedido agora. Verifique sua conexão e tente novamente."
      );
      return;
    }

    clear();
    onOrderCreated(data as string);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto pt-10 sm:pt-16" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-modal-title"
        className="w-full max-w-lg bg-card border border-border rounded-lg shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="cart-modal-title" className="text-lg font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" aria-hidden="true" />
            {step === "edit" ? "Seu pedido" : "Confirmar pedido"}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar seu pedido"
            className="p-2 -m-2 rounded-md hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {errorMessage && (
          <p role="alert" className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Seu pedido está vazio. Adicione itens do cardápio usando o botão "Adicionar ao pedido" em cada prato.
          </p>
        ) : (
          <>
            <ul className="space-y-3 max-h-[45vh] overflow-y-auto mb-4">
              {items.map((item) => (
                <li key={item.menuItemId} className="flex items-start gap-3 border-b border-border pb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{item.name}</p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground">Observação: {item.notes}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatMoney(item.price)} cada · subtotal {formatMoney(item.price * item.quantity)}
                    </p>
                  </div>

                  {step === "edit" ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                        aria-label={`Diminuir quantidade de ${item.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-input hover:bg-secondary"
                      >
                        <Minus className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold" aria-live="polite">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                        aria-label={`Aumentar quantidade de ${item.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-input hover:bg-secondary"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.menuItemId)}
                        aria-label={`Remover ${item.name} do pedido`}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <span className="shrink-0 text-sm font-semibold text-foreground">×{item.quantity}</span>
                  )}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between font-bold text-foreground mb-4">
              <span>Subtotal estimado</span>
              <span>{formatMoney(subtotal)}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              A taxa de serviço e o total final da comanda são calculados pelo restaurante ao fechar a conta da
              mesa e serão conferidos no caixa.
            </p>

            {step === "edit" ? (
              <button
                type="button"
                onClick={() => setStep("review")}
                className="w-full min-h-11 rounded-md bg-primary px-4 py-2.5 font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Revisar e confirmar pedido
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-foreground">
                  Confira os itens acima. Ao confirmar, seu pedido será enviado para a cozinha/equipe do
                  restaurante.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("edit")}
                    disabled={submitting}
                    className="flex-1 min-h-11 rounded-md bg-secondary px-4 py-2.5 font-medium text-secondary-foreground hover:bg-secondary/80"
                  >
                    Voltar e editar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 min-h-11 rounded-md bg-primary px-4 py-2.5 font-bold text-primary-foreground hover:opacity-90 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {submitting ? "Enviando..." : "Confirmar pedido"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
