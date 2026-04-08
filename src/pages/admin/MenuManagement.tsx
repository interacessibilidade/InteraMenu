import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { Database } from "@/integrations/supabase/types";
import ImageUpload from "@/components/admin/ImageUpload";

type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
type MenuInsert = Database["public"]["Tables"]["menu_items"]["Insert"];
type MenuCategory = Database["public"]["Enums"]["menu_category"];

const categories: { value: MenuCategory; label: string }[] = [
  { value: "entrada", label: "Entrada" },
  { value: "prato", label: "Prato" },
  { value: "acompanhamento", label: "Acompanhamento" },
  { value: "bebida", label: "Bebida" },
  { value: "sobremesa", label: "Sobremesa" },
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
                onUrlChange={(url) => setForm({ ...form, image_url: url })}
                altText={form.image_alt || ""}
                onAltChange={(alt) => setForm({ ...form, image_alt: alt })}
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
              <div>
                <label className={labelClass}>Link do Vídeo em Libras</label>
                <input className={inputClass} value={form.libras_video_url || ""} onChange={(e) => setForm({ ...form, libras_video_url: e.target.value })} placeholder="YouTube ou Vimeo" />
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
          <div className="space-y-2">
            {(items || []).map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
                {item.image_url && (
                  <img src={item.image_url} alt={item.image_alt || item.name} className="w-14 h-14 rounded-md object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground truncate">{item.name}</h3>
                    {!item.is_available && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Indisponível</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {categories.find(c => c.value === item.category)?.label} · R$ {Number(item.price).toFixed(2).replace(".", ",")}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(item)} className="p-2 rounded-md hover:bg-secondary transition-colors" aria-label={`Editar ${item.name}`}>
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMutation.mutate(item.id)} className="p-2 rounded-md hover:bg-destructive/10 text-destructive transition-colors" aria-label={`Excluir ${item.name}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
