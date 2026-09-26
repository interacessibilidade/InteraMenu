import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUp, ArrowDown, Edit2, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Category = Database["public"]["Tables"]["restaurant_categories"]["Row"];

interface Props {
  open: boolean;
  onClose: () => void;
  restaurantId: string | null;
  triggerRef: React.RefObject<HTMLElement>;
}

export function CategoryManagerModal({ open, onClose, restaurantId, triggerRef }: Props) {
  const queryClient = useQueryClient();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["restaurant_categories", restaurantId],
    enabled: !!restaurantId && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurant_categories")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["restaurant_categories"] });
    queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] });
  };

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("restaurant_categories").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setStatusMessage("Categoria renomeada.");
    },
    onError: (err: any) => {
      const msg = String(err?.message || "");
      toast.error(
        msg.includes("duplicate") || msg.includes("unique")
          ? "Você já tem uma categoria com esse nome."
          : "Não foi possível renomear a categoria: " + (msg || "tente novamente.")
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("restaurant_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setStatusMessage("Categoria excluída.");
    },
    onError: () => toast.error("Não foi possível excluir a categoria. Tente novamente."),
  });

  const swapMutation = useMutation({
    mutationFn: async ({ a, b }: { a: { id: string; sort_order: number }; b: { id: string; sort_order: number } }) => {
      const results = await Promise.all([
        supabase.from("restaurant_categories").update({ sort_order: b.sort_order }).eq("id", a.id),
        supabase.from("restaurant_categories").update({ sort_order: a.sort_order }).eq("id", b.id),
      ]);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;
    },
    onSuccess: () => invalidate(),
    onError: () => toast.error("Não foi possível mudar a ordem. Tente novamente."),
  });

  const moveUp = (index: number) => {
    if (!categories || index <= 0) return;
    swapMutation.mutate({
      a: { id: categories[index].id, sort_order: categories[index].sort_order },
      b: { id: categories[index - 1].id, sort_order: categories[index - 1].sort_order },
    });
    setStatusMessage(`${categories[index].name} movida para cima.`);
  };

  const moveDown = (index: number) => {
    if (!categories || index >= categories.length - 1) return;
    swapMutation.mutate({
      a: { id: categories[index].id, sort_order: categories[index].sort_order },
      b: { id: categories[index + 1].id, sort_order: categories[index + 1].sort_order },
    });
    setStatusMessage(`${categories[index].name} movida para baixo.`);
  };

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => closeButtonRef.current?.focus());
    } else {
      triggerRef.current?.focus();
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto pt-10 sm:pt-20">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-manager-title"
        className="w-full max-w-lg bg-card border border-border rounded-lg shadow-lg p-6"
      >
        <p role="status" aria-live="polite" className="sr-only">
          {statusMessage}
        </p>
        <div className="flex items-center justify-between mb-4">
          <h2 id="category-manager-title" className="text-lg font-bold text-foreground">
            Gerenciar Categorias
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar gerenciador de categorias"
            className="p-2 -m-2 rounded-md hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Novas categorias são criadas automaticamente quando você digita um nome novo no cadastro de item.
          Aqui você pode corrigir o nome, mudar a ordem ou excluir uma categoria.
        </p>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando categorias...</p>
        ) : !categories || categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma categoria criada ainda. Cadastre um item com uma categoria nova para começar.
          </p>
        ) : (
          <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
            {categories.map((cat, index) => (
              <CategoryRow
                key={cat.id}
                category={cat}
                isFirst={index === 0}
                isLast={index === categories.length - 1}
                onMoveUp={() => moveUp(index)}
                onMoveDown={() => moveDown(index)}
                onRename={(name) => renameMutation.mutate({ id: cat.id, name })}
                onDelete={() => deleteMutation.mutate(cat.id)}
                checkDuplicate={(name) =>
                  categories.some((c) => c.id !== cat.id && c.name.trim().toLowerCase() === name.trim().toLowerCase())
                }
              />
            ))}
          </ul>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

interface CategoryRowProps {
  category: Category;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  checkDuplicate: (name: string) => boolean;
}

function CategoryRow({ category, isFirst, isLast, onMoveUp, onMoveDown, onRename, onDelete, checkDuplicate }: CategoryRowProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(category.name);
  const [editError, setEditError] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setEditValue(category.name);
    setEditError("");
    setEditing(true);
    requestAnimationFrame(() => editInputRef.current?.focus());
  };

  const confirmEditing = () => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditError("Digite o nome da categoria.");
      return;
    }
    if (checkDuplicate(trimmed)) {
      setEditError("Você já tem uma categoria com esse nome.");
      return;
    }
    if (trimmed !== category.name) onRename(trimmed);
    setEditing(false);
    setEditError("");
  };

  return (
    <li className="flex items-center gap-2 p-3 bg-background border border-border rounded-md">
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label={`Mover categoria ${category.name} para cima`}
          className="p-1 rounded hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowUp className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label={`Mover categoria ${category.name} para baixo`}
          className="p-1 rounded hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {editing ? (
        <div className="flex-1 min-w-0">
          <label htmlFor={`rename-category-${category.id}`} className="sr-only">
            Renomear categoria {category.name}
          </label>
          <input
            id={`rename-category-${category.id}`}
            ref={editInputRef}
            className="w-full px-2 py-1.5 rounded-md bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              if (editError) setEditError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmEditing();
              } else if (e.key === "Escape") {
                e.preventDefault();
                setEditing(false);
                setEditError("");
              }
            }}
            aria-invalid={!!editError}
            aria-describedby={editError ? `rename-category-${category.id}-error` : undefined}
          />
          {editError && (
            <p id={`rename-category-${category.id}-error`} role="alert" className="text-xs text-destructive mt-1">
              {editError}
            </p>
          )}
        </div>
      ) : (
        <span className="flex-1 min-w-0 font-medium text-foreground truncate">{category.name}</span>
      )}

      <div className="flex gap-1 shrink-0">
        {editing ? (
          <>
            <button
              type="button"
              onClick={confirmEditing}
              aria-label={`Confirmar novo nome da categoria ${category.name}`}
              className="p-2 rounded-md hover:bg-secondary transition-colors"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setEditError(""); }}
              aria-label="Cancelar edição do nome da categoria"
              className="p-2 rounded-md hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={startEditing}
              aria-label={`Renomear categoria ${category.name}`}
              className="p-2 rounded-md hover:bg-secondary transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Tem certeza que deseja excluir a categoria "${category.name}"? Os itens que estiverem nela ficarão sem categoria. Essa ação não pode ser desfeita.`
                  )
                ) {
                  onDelete();
                }
              }}
              aria-label={`Excluir categoria ${category.name}`}
              className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </li>
  );
}
