import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit2, ArrowLeft, GripVertical } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Announcements,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { toast } from "sonner";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
type MenuInsert = Database["public"]["Tables"]["menu_items"]["Insert"];
type MenuCategory = Database["public"]["Enums"]["menu_category"];

const categories: { value: MenuCategory; label: string }[] = [
  { value: "cafe_espresso", label: "Café Espresso" },
  { value: "chocolate", label: "Chocolate" },
  { value: "sobremesa", label: "Sobremesa" },
  { value: "empanada_salgado", label: "Empanada e Salgado" },
  { value: "metodos_extracao", label: "Métodos de Extração" },
  { value: "paulistinha", label: "Paulistinha" },
  { value: "waffles", label: "Waffles" },
  { value: "almoco", label: "Almoço" },
  { value: "espresso_gelado", label: "Espresso Gelado" },
  { value: "chocolate_gelado", label: "Chocolate Gelado" },
  { value: "bebida", label: "Bebidas" },
  { value: "drinks_sem_alcool", label: "Drinks sem Álcool" },
  { value: "chai_latte", label: "Chai-Latte" },
  { value: "chas", label: "Chás" },
  { value: "drinks_especiais", label: "Drinks Especiais" },
  { value: "cervejas", label: "Cervejas" },
  { value: "entrada", label: "Entrada" },
  { value: "prato", label: "Prato" },
  { value: "acompanhamento", label: "Acompanhamento" },
  { value: "outros", label: "Outros" },
];

const allergenOptions = [
  { value: "gluten", label: "Glúten" },
  { value: "lactose", label: "Lactose" },
  { value: "nuts", label: "Nozes" },
  { value: "soy", label: "Soja" },
  { value: "eggs", label: "Ovos" },
  { value: "fish", label: "Peixe" },
  { value: "shellfish", label: "Frutos do mar" },
];

const emptyForm: Omit<MenuInsert, "id"> = {
  name: "",
  description: "",
  price: 0,
  category: "prato",
  ingredients: "",
  allergens: [],
  image_url: "",
  image_alt: "",
  audio_text: "",
  libras_video_url: "",
  is_available: true,
  sort_order: 0,
};

function buildAutoAudioText(form: Omit<MenuInsert, "id">) {
  const parts: string[] = [];
  if (form.name) parts.push(form.name);
  if (form.price) parts.push(`R$ ${Number(form.price).toFixed(2).replace(".", ",")}`);
  if (form.description) parts.push(String(form.description));
  if (form.ingredients) parts.push(String(form.ingredients));
  return parts.join(". ") + ".";
}

export default function MenuManagement() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Omit<MenuInsert, "id">>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [autoAudio, setAutoAudio] = useState(true);

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin_menu_items"],
    queryFn: async () => {
      const { data, error } = await supabase.from("menu_items").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Auto-fill sort_order when category changes (new items only)
  useEffect(() => {
    if (editingId) return;
    if (!items) return;
    const sameCat = items.filter((i) => i.category === form.category);
    const maxOrder = sameCat.length > 0 ? Math.max(...sameCat.map((i) => i.sort_order)) : -1;
    setForm((prev) => ({ ...prev, sort_order: maxOrder + 1 }));
  }, [form.category, items, editingId]);

  // Auto-fill audio_text
  useEffect(() => {
    if (!autoAudio) return;
    setForm((prev) => ({ ...prev, audio_text: buildAutoAudioText(prev) }));
  }, [form.name, form.price, form.description, form.ingredients, autoAudio]);

  const saveMutation = useMutation({
    mutationFn: async (data: Omit<MenuInsert, "id">) => {
      if (editingId) {
        const { error } = await supabase.from("menu_items").update(data).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] });
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      setAutoAudio(true);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      // Update each item's sort_order. Run in parallel.
      const results = await Promise.all(
        updates.map((u) =>
          supabase.from("menu_items").update({ sort_order: u.sort_order }).eq("id", u.id)
        )
      );
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] }),
    onError: () => toast.error("Não foi possível salvar a nova ordem."),
  });

  const startEdit = (item: MenuItem) => {
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category,
      ingredients: item.ingredients || "",
      allergens: item.allergens || [],
      image_url: item.image_url || "",
      image_alt: item.image_alt || "",
      audio_text: item.audio_text || "",
      libras_video_url: item.libras_video_url || "",
      is_available: item.is_available,
      sort_order: item.sort_order,
    });
    setEditingId(item.id);
    setAutoAudio(false); // Don't overwrite existing audio text
    setShowForm(true);
  };

  const toggleAllergen = (val: string) => {
    const current = form.allergens || [];
    setForm({
      ...form,
      allergens: current.includes(val) ? current.filter((a) => a !== val) : [...current, val],
    });
  };

  const inputClass = "w-full px-3 py-2.5 rounded-md bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "block text-sm font-semibold text-foreground mb-1";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-4 flex items-center gap-3 flex-wrap">
          <Link to="/admin" className="p-2 rounded-md hover:bg-secondary transition-colors" aria-label="Voltar para gestão do cardápio">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-extrabold text-foreground">Cadastro de Itens</h1>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); setAutoAudio(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Novo Item
            </button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {showForm && (
          <div className="bg-card border border-border rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {editingId ? "Editar Item" : "Novo Item"}
            </h2>
            <form
              onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
              className="grid gap-4 sm:grid-cols-2"
            >
              <div>
                <label className={labelClass}>Nome *</label>
                <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className={labelClass}>Preço (R$) *</label>
                <input className={inputClass} type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} required />
              </div>
              <div>
                <label className={labelClass}>Categoria</label>
                <select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as MenuCategory })}>
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Ordem</label>
                <input className={inputClass} type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Descrição</label>
                <textarea className={inputClass} rows={2} value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição do prato" />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Ingredientes</label>
                <textarea className={inputClass} rows={2} value={form.ingredients || ""} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Alérgenos</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {allergenOptions.map((a) => (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => toggleAllergen(a.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                        ${(form.allergens || []).includes(a.value) ? "bg-destructive text-destructive-foreground border-destructive" : "bg-secondary text-secondary-foreground border-border"}`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
              <ImageUpload
                currentUrl={form.image_url || ""}
                onUrlChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
                altText={form.image_alt || ""}
                onAltChange={(alt) => setForm((prev) => ({ ...prev, image_alt: alt }))}
              />
              <div className="sm:col-span-2">
                <label className={labelClass}>Texto para Áudio</label>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={form.audio_text || ""}
                  onChange={(e) => { setAutoAudio(false); setForm({ ...form, audio_text: e.target.value }); }}
                  placeholder="Gerado automaticamente: Nome. Preço. Descrição. Ingredientes."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {autoAudio ? "✨ Preenchido automaticamente" : "Editado manualmente"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">
                  💡 A ilustração dos ingredientes será gerada automaticamente por IA quando o cliente clicar em "Ver ingredientes" no cardápio.
                </p>
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} className="w-4 h-4 accent-primary" />
                  <span className="text-sm font-medium text-foreground">Disponível</span>
                </label>
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={saveMutation.isPending} className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                  {saveMutation.isPending ? "Salvando..." : editingId ? "Atualizar" : "Criar"}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); setAutoAudio(true); }} className="px-6 py-2.5 rounded-md bg-secondary text-secondary-foreground font-medium text-sm">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : (
          <SortableMenuList
            items={items || []}
            onReorder={(updates) => reorderMutation.mutate(updates)}
            onEdit={startEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        )}
      </main>
    </div>
  );
}

// ============= Sortable list with category groups =============

interface SortableMenuListProps {
  items: MenuItem[];
  onReorder: (updates: { id: string; sort_order: number }[]) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

function SortableMenuList({ items, onReorder, onEdit, onDelete }: SortableMenuListProps) {
  // Group items by category preserving the categories order defined above.
  const grouped = categories
    .map((cat) => ({
      category: cat,
      items: items
        .filter((i) => i.category === cat.value)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter((g) => g.items.length > 0);

  if (grouped.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum item cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <CategoryGroup
          key={group.category.value}
          categoryLabel={group.category.label}
          items={group.items}
          onReorder={onReorder}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface CategoryGroupProps {
  categoryLabel: string;
  items: MenuItem[];
  onReorder: (updates: { id: string; sort_order: number }[]) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

function CategoryGroup({ categoryLabel, items, onReorder, onEdit, onDelete }: CategoryGroupProps) {
  const [localItems, setLocalItems] = useState(items);

  // Sync when external items change (after refetch).
  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const announcements: Announcements = {
    onDragStart({ active }) {
      const item = localItems.find((i) => i.id === active.id);
      return `Item ${item?.name ?? ""} selecionado para mover. Use as setas para cima e para baixo para reordenar e a tecla espaço para confirmar.`;
    },
    onDragOver({ active, over }) {
      if (!over) return;
      const activeItem = localItems.find((i) => i.id === active.id);
      const overIndex = localItems.findIndex((i) => i.id === over.id);
      return `Item ${activeItem?.name ?? ""} está sobre a posição ${overIndex + 1} de ${localItems.length}.`;
    },
    onDragEnd({ active, over }) {
      const activeItem = localItems.find((i) => i.id === active.id);
      if (!over) {
        return `Movimentação de ${activeItem?.name ?? ""} cancelada.`;
      }
      const overIndex = localItems.findIndex((i) => i.id === over.id);
      return `Item ${activeItem?.name ?? ""} movido para a posição ${overIndex + 1} de ${localItems.length}.`;
    },
    onDragCancel({ active }) {
      const activeItem = localItems.find((i) => i.id === active.id);
      return `Movimentação de ${activeItem?.name ?? ""} cancelada.`;
    },
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localItems.findIndex((i) => i.id === active.id);
    const newIndex = localItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(localItems, oldIndex, newIndex);
    setLocalItems(reordered);
    const updates = reordered.map((it, idx) => ({ id: it.id, sort_order: idx }));
    onReorder(updates);
  };

  const headingId = `categoria-${categoryLabel.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="text-lg font-extrabold text-foreground mb-3 pb-2 border-b border-border"
      >
        {categoryLabel}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          ({items.length} {items.length === 1 ? "item" : "itens"})
        </span>
      </h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        accessibility={{ announcements }}
      >
        <SortableContext items={localItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2" aria-label={`Itens da categoria ${categoryLabel}, arrastáveis`}>
            {localItems.map((item) => (
              <SortableItem
                key={item.id}
                item={item}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

interface SortableItemProps {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

function SortableItem({ item, onEdit, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 bg-card border border-border rounded-lg ${
        isDragging ? "shadow-lg ring-2 ring-primary" : ""
      }`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-2 -m-2 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-none"
        aria-label={`Mover ${item.name}. Pressione espaço para selecionar e use as setas para reordenar.`}
      >
        <GripVertical className="w-5 h-5" aria-hidden="true" />
      </button>

      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.image_alt || item.name}
          className="w-14 h-14 rounded-md object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-foreground truncate">{item.name}</h3>
          {!item.is_available && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              Indisponível
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          R$ {Number(item.price).toFixed(2).replace(".", ",")}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onEdit(item)}
          className="p-2 rounded-md hover:bg-secondary transition-colors"
          aria-label={`Editar ${item.name}`}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
          aria-label={`Excluir ${item.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}
