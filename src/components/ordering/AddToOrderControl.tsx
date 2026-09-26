import { useId, useState } from "react";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface AddToOrderControlProps {
  menuItemId: string;
  itemName: string;
  price: number;
}

/**
 * Controle acessível "Adicionar ao pedido": campo de observação + contador
 * de quantidade com botões +/- rotulados individualmente, e um botão de
 * ação explícito (nunca adiciona sozinho ao digitar ou ao focar).
 */
export function AddToOrderControl({ menuItemId, itemName, price }: AddToOrderControlProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [justAdded, setJustAdded] = useState(false);
  const notesId = useId();
  const qtyLabelId = useId();

  const handleAdd = () => {
    addItem(menuItemId, itemName, price, quantity, notes.trim());
    setJustAdded(true);
    setQuantity(1);
    setNotes("");
    window.setTimeout(() => setJustAdded(false), 2500);
  };

  return (
    <div className="pt-1 border-t border-border/60 space-y-2">
      <div>
        <label htmlFor={notesId} className="text-xs font-medium text-foreground/80 block mb-1">
          Observação para {itemName} (opcional)
        </label>
        <input
          id={notesId}
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ex.: sem cebola"
          className="w-full rounded-md border border-input bg-background px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="flex items-center gap-2">
        <span id={qtyLabelId} className="text-xs font-medium text-foreground/80">
          Quantidade
        </span>
        <div className="flex items-center gap-1" role="group" aria-labelledby={qtyLabelId}>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label={`Diminuir quantidade de ${itemName}`}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Minus className="w-4 h-4" aria-hidden="true" />
          </button>
          <span className="w-8 text-center text-sm font-semibold text-foreground" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            disabled={quantity >= 20}
            aria-label={`Aumentar quantidade de ${itemName}`}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Adicionar ${quantity} ${quantity === 1 ? "unidade" : "unidades"} de ${itemName} ao pedido`}
          className="ml-auto flex-1 min-h-11 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {justAdded ? (
            <>
              <Check className="w-4 h-4" aria-hidden="true" />
              Adicionado
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" aria-hidden="true" />
              Adicionar ao pedido
            </>
          )}
        </button>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {justAdded ? `${itemName} adicionado ao seu pedido.` : ""}
      </p>
    </div>
  );
}
