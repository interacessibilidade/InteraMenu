import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Edit2, ArrowLeft, ArrowUp, ArrowDown, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import ImageUpload from "@/components/admin/ImageUpload";
import IngredientImageUpload from "@/components/admin/IngredientImageUpload";
import { CategoryManagerModal } from "@/components/admin/CategoryManagerModal";
import { toast } from "sonner";
import { AccessibilityToolbar } from "@/components/AccessibilityToolbar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
type MenuInsert = Database["public"]["Tables"]["menu_items"]["Insert"];
type RestaurantCategory = Database["public"]["Tables"]["restaurant_categories"]["Row"];

const allergenOptions = [
  { value: "gluten", label: "Glúten" },
  { value: "lactose", label: "Lactose" },
  { value: "nuts", label: "Nozes" },
  { value: "soy", label: "Soja" },
  { value: "eggs", label: "Ovos" },
  { value: "fish", label: "Peixe" },
  { value: "shellfish", label: "Frutos do mar" },
  { value: "vegano", label: "Vegano" },
];

const emptyForm: Omit<MenuInsert, "id"> = {
  name: "",
  description: "",
  price: 0,
  category_id: null,
  ingredients: "",
  allergens: [],
  image_url: "",
  image_alt: "",
  ingredientes_imagem_url: "",
  audio_text: "",
  libras_video_url: "",
  is_available: true,
  sort_order: 0,
} as any;

function buildAutoAudioText(form: Omit<MenuInsert, "id">) {
  const parts: string[] = [];
  if (form.name) parts.push(form.name);
  if (form.price) parts.push(`R$ ${Number(form.price).toFixed(2).replace(".", ",")}`);
  if (form.description) parts.push(String(form.description));
  if (form.ingredients) parts.push(`Ingredientes: ${String(form.ingredients)}`);
  return parts.join(". ") + ".";
}

function findCategoryByName(categories: RestaurantCategory[] | undefined, name: string) {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) return undefined;
  return (categories || []).find((c) => c.name.trim().toLowerCase() === trimmed);
}

export default function MenuManagement() {
  useDocumentTitle("Gestão do cardápio — InteraMenu");
  const queryClient = useQueryClient();
  const { restaurantId, loading: authLoading } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const manageCategoriesButtonRef = useRef<HTMLButtonElement>(null);
  const DRAFT_KEY = "interamenu_menu_item_draft";
  const [form, setForm] = useState<Omit<MenuInsert, "id">>(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) return JSON.parse(saved).form ?? emptyForm;
    } catch {
      // ignora rascunho corrompido
    }
    return emptyForm;
  });
  const [categoryText, setCategoryText] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) return JSON.parse(saved).categoryText ?? "";
    } catch {
      // ignora
    }
    return "";
  });
  const [editingId, setEditingId] = useState<string | null>(() => {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (saved) return JSON.parse(saved).editingId ?? null;
    } catch {
      // ignora
    }
    return null;
  });
  const [showForm, setShowForm] = useState(() => {
    try {
      return !!sessionStorage.getItem(DRAFT_KEY);
    } catch {
      return false;
    }
  });
  const [autoAudio, setAutoAudio] = useState(true);
  const [customAllergen, setCustomAllergen] = useState("");
  const [formErrors, setFormErrors] = useState<{ name?: string; price?: string }>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);

  // Mantém um rascunho do formulário salvo, para não perder o que foi
  // digitado caso a página recarregue (ex: ao voltar de uma troca de app
  // no celular durante o upload de uma foto).
  useEffect(() => {
    try {
      if (showForm) {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ form, categoryText, editingId }));
      } else {
        sessionStorage.removeItem(DRAFT_KEY);
      }
    } catch {
      // armazenamento indisponível — segue sem rascunho, sem quebrar a tela
    }
  }, [form, categoryText, editingId, showForm]);

  const { data: categories } = useQuery({
    queryKey: ["restaurant_categories", restaurantId],
    enabled: !!restaurantId,
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

  const { data: items, isLoading } = useQuery({
    queryKey: ["admin_menu_items", restaurantId],
    enabled: !!restaurantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Auto-fill sort_order when the category changes (new items only)
  useEffect(() => {
    if (editingId) return;
    if (!items) return;
    const matched = findCategoryByName(categories, categoryText);
    const sameCat = matched ? items.filter((i) => i.category_id === matched.id) : [];
    const maxOrder = sameCat.length > 0 ? Math.max(...sameCat.map((i) => i.sort_order)) : -1;
    setForm((prev) => ({ ...prev, sort_order: maxOrder + 1 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryText, items, editingId]);

  // Auto-fill audio_text
  useEffect(() => {
    if (!autoAudio) return;
    setForm((prev) => ({ ...prev, audio_text: buildAutoAudioText(prev) }));
  }, [form.name, form.price, form.description, form.ingredients, autoAudio]);

  const saveMutation = useMutation({
    mutationFn: async (data: Omit<MenuInsert, "id">) => {
      if (!restaurantId) {
        throw new Error(
          "Ainda estamos carregando os dados da sua conta. Aguarde alguns segundos e tente salvar de novo."
        );
      }

      // Resolve a categoria digitada: reaproveita uma já existente (mesmo
      // nome, sem diferenciar maiúsculas/minúsculas) ou cria uma nova.
      let categoryId: string | null = null;
      const trimmedCategory = categoryText.trim();
      if (trimmedCategory) {
        const existing = findCategoryByName(categories, trimmedCategory);
        if (existing) {
          categoryId = existing.id;
        } else {
          const maxOrder =
            categories && categories.length > 0 ? Math.max(...categories.map((c) => c.sort_order)) : -1;
          const { data: created, error: createErr } = await supabase
            .from("restaurant_categories")
            .insert({ name: trimmedCategory, restaurant_id: restaurantId, sort_order: maxOrder + 1 })
            .select()
            .single();
          if (createErr) throw createErr;
          categoryId = created.id;
        }
      }

      const payload = { ...data, category_id: categoryId };

      if (editingId) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("menu_items").insert({ ...payload, restaurant_id: restaurantId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant_categories"] });
      setStatusMessage(editingId ? "Item do cardápio atualizado." : "Item do cardápio cadastrado.");
      setForm(emptyForm);
      setCategoryText("");
      setEditingId(null);
      setShowForm(false);
      setAutoAudio(true);
    },
    onError: (err: any) => {
      toast.error("Não foi possível salvar o item: " + (err?.message || "tente novamente."));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] }),
  });

  const swapMutation = useMutation({
    mutationFn: async ({ a, b }: { a: { id: string; sort_order: number }; b: { id: string; sort_order: number } }) => {
      const results = await Promise.all([
        supabase.from("menu_items").update({ sort_order: b.sort_order }).eq("id", a.id),
        supabase.from("menu_items").update({ sort_order: a.sort_order }).eq("id", b.id),
      ]);
      const firstError = results.find((r) => r.error)?.error;
      if (firstError) throw firstError;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin_menu_items"] }),
    onError: () => toast.error("Não foi possível salvar a nova ordem."),
  });

  const startEdit = (item: MenuItem) => {
    const currentCategory = (categories || []).find((c) => c.id === item.category_id);
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category_id: item.category_id,
      ingredients: item.ingredients || "",
      allergens: item.allergens || [],
      image_url: item.image_url || "",
      image_alt: item.image_alt || "",
      ingredientes_imagem_url: (item as any).ingredientes_imagem_url || "",
      audio_text: item.audio_text || "",
      libras_video_url: item.libras_video_url || "",
      is_available: item.is_available,
      sort_order: item.sort_order,
    } as any);
    setCategoryText(currentCategory?.name || "");
    setEditingId(item.id);
    setAutoAudio(false); // Don't overwrite existing audio text
    setShowForm(true);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => nameInputRef.current?.focus(), 300);
    });
  };

  const toggleAllergen = (val: string) => {
    const current = form.allergens || [];
    setForm({
      ...form,
      allergens: current.includes(val) ? current.filter((a) => a !== val) : [...current, val],
    });
  };

  const addCustomAllergen = () => {
    const val = customAllergen.trim();
    if (!val) return;
    const current = form.allergens || [];
    if (current.includes(val)) {
      setCustomAllergen("");
      return;
    }
    setForm({ ...form, allergens: [...current, val] });
    setCustomAllergen("");
  };

  const inputClass = "w-full px-3 py-2.5 rounded-md bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "block text-sm font-semibold text-foreground mb-1";

  return (
    <div className="min-h-screen bg-background">
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container py-4 flex items-center gap-3 flex-wrap">
          <Link to="/admin" className="p-2 rounded-md hover:bg-secondary transition-colors" aria-label="Voltar para gestão do cardápio">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-extrabold text-foreground">Cadastro de Itens</h1>
          <div className="ml-auto flex gap-2">
            <button
              ref={manageCategoriesButtonRef}
              type="button"
              onClick={() => setManageCategoriesOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
              Gerenciar categorias
            </button>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setForm(emptyForm);
                setCategoryText("");
                setAutoAudio(true);
                requestAnimationFrame(() => {
                  formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  setTimeout(() => nameInputRef.current?.focus(), 300);
                });
              }}
              aria-label="Cadastrar novo item"
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" /> Novo Item
            </button>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {showForm && (
          <div ref={formRef} className="bg-card border border-border rounded-lg p-6 mb-8 shadow-sm">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {editingId ? "Editar Item" : "Novo Item"}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const errors: { name?: string; price?: string } = {};
                if (!form.name.trim()) errors.name = "Digite o nome do prato.";
                if (!form.price || form.price <= 0) errors.price = "Digite um preço maior que zero.";
                setFormErrors(errors);
                if (Object.keys(errors).length > 0) {
                  toast.error("Corrija os campos destacados antes de salvar.");
                  return;
                }
                saveMutation.mutate(form);
              }}
              noValidate
              className="grid gap-4 sm:grid-cols-2"
            >
              <div>
                <label className={labelClass} htmlFor="item-name">
                  Nome <span aria-hidden="true">*</span>
                  <span className="sr-only"> (obrigatório)</span>
                </label>
                <input
                  id="item-name"
                  ref={nameInputRef}
                  className={inputClass}
                  placeholder="Digite o nome do item"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  aria-required="true"
                  aria-invalid={!!formErrors.name}
                  aria-describedby={formErrors.name ? "item-name-error" : undefined}
                />
                {formErrors.name && (
                  <p id="item-name-error" role="alert" className="text-sm text-destructive mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass} htmlFor="item-price">
                  Preço (R$) <span aria-hidden="true">*</span>
                  <span className="sr-only"> (obrigatório)</span>
                </label>
                <input
                  id="item-price"
                  className={inputClass}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Digite o preço do item"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                  required
                  aria-required="true"
                  aria-invalid={!!formErrors.price}
                  aria-describedby={formErrors.price ? "item-price-error" : undefined}
                />
                {formErrors.price && (
                  <p id="item-price-error" role="alert" className="text-sm text-destructive mt-1">
                    {formErrors.price}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass} htmlFor="item-category">Categoria</label>
                <input
                  id="item-category"
                  className={inputClass}
                  list="item-category-options"
                  placeholder="Digite ou escolha uma categoria"
                  value={categoryText}
                  onChange={(e) => setCategoryText(e.target.value)}
                  aria-describedby="item-category-hint"
                />
                <datalist id="item-category-options">
                  {(categories || []).map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
                <p id="item-category-hint" className="text-xs text-muted-foreground mt-1">
                  Digite o nome de uma categoria já existente para reaproveitá-la, ou de uma categoria nova
                  para criá-la automaticamente ao salvar. Deixe em branco para não ter categoria.
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="item-sort-order">Ordem</label>
                <input
                  id="item-sort-order"
                  className={inputClass}
                  type="number"
                  placeholder="Digite a posição do item na lista"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                  aria-describedby="item-sort-order-hint"
                />
                <span id="item-sort-order-hint" className="sr-only">
                  Número que define a ordem de exibição deste item dentro da categoria. Menor número aparece primeiro.
                </span>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="item-description">Descrição</label>
                <textarea
                  id="item-description"
                  className={inputClass}
                  rows={2}
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Digite a descrição do prato"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="item-ingredients">Ingredientes</label>
                <textarea
                  id="item-ingredients"
                  className={inputClass}
                  rows={2}
                  placeholder="Digite os ingredientes do prato, separados por vírgula"
                  value={form.ingredients || ""}
                  onChange={(e) => setForm({ ...form, ingredients: e.target.value })}
                />
              </div>
              <fieldset className="sm:col-span-2 border-0 p-0 m-0">
                <legend className={labelClass}>
                  Alérgenos
                  <span className="block font-normal text-xs text-muted-foreground mt-0.5">
                    Informe se o item contém algum destes alérgenos
                  </span>
                </legend>
                <div className="flex flex-wrap gap-2 mt-1">
                  {allergenOptions.map((a) => {
                    const isSelected = (form.allergens || []).includes(a.value);
                    return (
                      <button
                        key={a.value}
                        type="button"
                        onClick={() => toggleAllergen(a.value)}
                        aria-pressed={isSelected}
                        aria-label={`${a.label}${isSelected ? ", selecionado" : ""}`}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border
                          ${isSelected ? "bg-destructive text-destructive-foreground border-destructive" : "bg-secondary text-secondary-foreground border-border"}`}
                      >
                        {a.label}
                      </button>
                    );
                  })}
                  {(form.allergens || [])
                    .filter((a) => !allergenOptions.some((o) => o.value === a))
                    .map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => toggleAllergen(a)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors border bg-destructive text-destructive-foreground border-destructive"
                        aria-label={`${a}, selecionado. Ativar para remover`}
                      >
                        {a} ✕
                      </button>
                    ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <label htmlFor="item-custom-allergen" className="sr-only">Adicionar outro alérgeno</label>
                  <input
                    id="item-custom-allergen"
                    type="text"
                    value={customAllergen}
                    onChange={(e) => setCustomAllergen(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomAllergen();
                      }
                    }}
                    placeholder="Digite outro alérgeno"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={addCustomAllergen}
                    aria-label="Selecione para inserir outro alérgeno"
                    className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground font-medium text-sm whitespace-nowrap hover:bg-secondary/80 transition-colors"
                  >
                    + Outro
                  </button>
                </div>
              </fieldset>
              <ImageUpload
                currentUrl={form.image_url || ""}
                onUrlChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
                altText={form.image_alt || ""}
                onAltChange={(alt) => setForm((prev) => ({ ...prev, image_alt: alt }))}
              />
              <IngredientImageUpload
                currentUrl={(form as any).ingredientes_imagem_url || ""}
                onUrlChange={(url) =>
                  setForm((prev) => ({ ...(prev as any), ingredientes_imagem_url: url } as any))
                }
              />
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="item-audio-text">Texto para Áudio</label>
                <textarea
                  id="item-audio-text"
                  className={inputClass}
                  rows={3}
                  value={form.audio_text || ""}
                  onChange={(e) => { setAutoAudio(false); setForm({ ...form, audio_text: e.target.value }); }}
                  placeholder="Digite o texto para áudio, ou deixe em branco para gerar automaticamente"
                  aria-describedby="item-audio-text-status"
                />
                <p id="item-audio-text-status" className="text-xs text-muted-foreground mt-1">
                  {autoAudio ? "✨ Preenchido automaticamente" : "Editado manualmente"}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs text-muted-foreground">
                  💡 A foto de ingredientes só aparece no cardápio se você subir uma acima — a geração automática por IA foi desativada.
                </p>
              </div>
              <div className="sm:col-span-2 flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer" htmlFor="item-is-available">
                  <input
                    id="item-is-available"
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                    className="w-4 h-4 accent-primary"
                    aria-describedby="item-is-available-hint"
                  />
                  <span className="text-sm font-medium text-foreground">Disponível</span>
                </label>
              </div>
              <div className="sm:col-span-2 -mt-2">
                <p id="item-is-available-hint" className="text-xs text-muted-foreground">
                  Marque esta opção se quer que o item apareça no cardápio visto pelos clientes. Desmarcado, o item fica oculto.
                </p>
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button
                  type="submit"
                  disabled={saveMutation.isPending || authLoading}
                  aria-label={editingId ? "Atualizar item de cardápio" : "Criar item de cardápio"}
                  className="px-6 py-2.5 rounded-md bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {saveMutation.isPending ? "Salvando..." : authLoading ? "Carregando conta..." : editingId ? "Atualizar" : "Criar"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); setCategoryText(""); setAutoAudio(true); setFormErrors({}); }}
                  aria-label="Cancelar cadastro de item de cardápio"
                  className="px-6 py-2.5 rounded-md bg-secondary text-secondary-foreground font-medium text-sm"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
        ) : (
          <MenuItemList
            items={items || []}
            categories={categories || []}
            onSwap={(a, b) => swapMutation.mutate({ a, b })}
            onEdit={startEdit}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        )}
      </main>
      <AccessibilityToolbar />

      <CategoryManagerModal
        open={manageCategoriesOpen}
        onClose={() => setManageCategoriesOpen(false)}
        restaurantId={restaurantId}
        triggerRef={manageCategoriesButtonRef}
      />
    </div>
  );
}

// ============= List with category groups, reordered via up/down buttons =============

interface MenuItemListProps {
  items: MenuItem[];
  categories: RestaurantCategory[];
  onSwap: (a: { id: string; sort_order: number }, b: { id: string; sort_order: number }) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

function MenuItemList({ items, categories, onSwap, onEdit, onDelete }: MenuItemListProps) {
  const grouped = categories
    .map((cat) => ({
      id: cat.id,
      label: cat.name,
      items: items.filter((i) => i.category_id === cat.id).sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter((g) => g.items.length > 0);

  const semCategoria = items
    .filter((i) => !i.category_id || !categories.some((c) => c.id === i.category_id))
    .sort((a, b) => a.sort_order - b.sort_order);

  const allGroups = [
    ...grouped,
    ...(semCategoria.length > 0 ? [{ id: "sem-categoria", label: "Sem categoria", items: semCategoria }] : []),
  ];

  if (allGroups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Nenhum item cadastrado ainda.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {allGroups.map((group) => (
        <ItemGroup key={group.id} categoryLabel={group.label} items={group.items} onSwap={onSwap} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

interface ItemGroupProps {
  categoryLabel: string;
  items: MenuItem[];
  onSwap: (a: { id: string; sort_order: number }, b: { id: string; sort_order: number }) => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

function ItemGroup({ categoryLabel, items, onSwap, onEdit, onDelete }: ItemGroupProps) {
  const headingId = `categoria-${categoryLabel.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-lg font-extrabold text-foreground mb-3 pb-2 border-b border-border">
        {categoryLabel}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          ({items.length} {items.length === 1 ? "item" : "itens"})
        </span>
      </h2>
      <ul className="space-y-2" aria-label={`Itens da categoria ${categoryLabel}`}>
        {items.map((item, index) => (
          <MenuItemRow
            key={item.id}
            item={item}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            onMoveUp={() => onSwap({ id: item.id, sort_order: item.sort_order }, { id: items[index - 1].id, sort_order: items[index - 1].sort_order })}
            onMoveDown={() => onSwap({ id: item.id, sort_order: item.sort_order }, { id: items[index + 1].id, sort_order: items[index + 1].sort_order })}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </section>
  );
}

interface MenuItemRowProps {
  item: MenuItem;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: (item: MenuItem) => void;
  onDelete: (id: string) => void;
}

function MenuItemRow({ item, isFirst, isLast, onMoveUp, onMoveDown, onEdit, onDelete }: MenuItemRowProps) {
  return (
    <li className="flex items-center gap-3 p-4 bg-card border border-border rounded-lg">
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label={`Mover ${item.name} para cima`}
          className="p-1 rounded hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowUp className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label={`Mover ${item.name} para baixo`}
          className="p-1 rounded hover:bg-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

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
          onClick={() => {
            if (window.confirm(`Tem certeza que deseja excluir "${item.name}"? Essa ação não pode ser desfeita.`)) {
              onDelete(item.id);
            }
          }}
          className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors"
          aria-label={`Excluir ${item.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </li>
  );
}
