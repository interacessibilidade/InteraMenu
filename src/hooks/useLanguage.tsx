import { createContext, useContext, useState, useCallback, useMemo, type ReactNode, type Context } from "react";

export type Language = "pt" | "en" | "es" | "fr";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const defaultLanguage: Language = "pt";

const translations: Record<Language, Record<string, string>> = {
  pt: {
    "header.title": "Cardápio Acessível",
    "header.table": "Mesa",
    "category.entrada": "Entradas",
    "category.prato": "Pratos Principais",
    "category.acompanhamento": "Acompanhamentos",
    "category.bebida": "Bebidas",
    "category.sobremesa": "Sobremesas",
    "category.outros": "Outros",
    "filter.all": "Todos",
    "filter.pratos": "Pratos Principais",
    "filter.bebidas": "Bebidas",
    "filter.sobremesas": "Sobremesas",
    "filter.outros": "Outros",
    "empty.title": "Nenhum item disponível no momento.",
    "empty.subtitle": "Acesse /admin/gestao para cadastrar itens.",
    "audio": "Áudio",
    "audio.description": "Escutar descrição do item de cardápio",
    "libras": "Libras",
    "libras.description": "Ver tradução em Libras do item",
    "allergen.gluten": "Glúten",
    "allergen.lactose": "Lactose",
    "allergen.nuts": "Nozes",
    "allergen.soy": "Soja",
    "allergen.eggs": "Ovos",
    "allergen.fish": "Peixe",
    "allergen.shellfish": "Frutos do mar",
    "accessibility.title": "Acessibilidade",
    "accessibility.increase_font": "Aumentar fonte",
    "accessibility.decrease_font": "Diminuir fonte",
    "accessibility.high_contrast": "Alto contraste",
    "accessibility.grayscale": "Escala de cinza",
    "accessibility.dyslexia_font": "Fonte para dislexia",
    "accessibility.reset": "Restaurar padrão",
    "accessibility.open": "Abrir acessibilidade",
    "accessibility.open.description": "Abrir painel de opções de acessibilidade",
    "accessibility.close": "Fechar painel de acessibilidade",
    "waiter.call": "Chamar Garçom",
    "waiter.call.table": "Chamar Garçom — Mesa",
    "waiter.called": "Garçom chamado!",
    "waiter.calling": "Chamando...",
    "waiter.already_called": "Garçom já foi chamado para esta mesa.",
    "language": "Idioma",
  },
  en: {
    "header.title": "Accessible Menu",
    "header.table": "Table",
    "category.entrada": "Starters",
    "category.prato": "Main Courses",
    "category.acompanhamento": "Side Dishes",
    "category.bebida": "Drinks",
    "category.sobremesa": "Desserts",
    "category.outros": "Others",
    "filter.all": "All",
    "filter.pratos": "Main Courses",
    "filter.bebidas": "Drinks",
    "filter.sobremesas": "Desserts",
    "filter.outros": "Others",
    "empty.title": "No items available at the moment.",
    "empty.subtitle": "Go to /admin/gestao to add items.",
    "audio": "Audio",
    "audio.description": "Listen to menu item description",
    "libras": "Sign Language",
    "libras.description": "View sign language translation",
    "allergen.gluten": "Gluten",
    "allergen.lactose": "Lactose",
    "allergen.nuts": "Nuts",
    "allergen.soy": "Soy",
    "allergen.eggs": "Eggs",
    "allergen.fish": "Fish",
    "allergen.shellfish": "Shellfish",
    "accessibility.title": "Accessibility",
    "accessibility.increase_font": "Increase font",
    "accessibility.decrease_font": "Decrease font",
    "accessibility.high_contrast": "High contrast",
    "accessibility.grayscale": "Grayscale",
    "accessibility.dyslexia_font": "Dyslexia font",
    "accessibility.reset": "Reset",
    "accessibility.open": "Open accessibility",
    "accessibility.open.description": "Open accessibility options panel",
    "accessibility.close": "Close accessibility panel",
    "waiter.call": "Call Waiter",
    "waiter.call.table": "Call Waiter — Table",
    "waiter.called": "Waiter called!",
    "waiter.calling": "Calling...",
    "waiter.already_called": "Waiter has already been called for this table.",
    "language": "Language",
  },
  es: {
    "header.title": "Menú Accesible",
    "header.table": "Mesa",
    "category.entrada": "Entradas",
    "category.prato": "Platos Principales",
    "category.acompanhamento": "Acompañamientos",
    "category.bebida": "Bebidas",
    "category.sobremesa": "Postres",
    "category.outros": "Otros",
    "filter.all": "Todos",
    "filter.pratos": "Platos Principales",
    "filter.bebidas": "Bebidas",
    "filter.sobremesas": "Postres",
    "filter.outros": "Otros",
    "empty.title": "No hay artículos disponibles en este momento.",
    "empty.subtitle": "Vaya a /admin/gestao para agregar artículos.",
    "audio": "Audio",
    "audio.description": "Escuchar descripción del artículo del menú",
    "libras": "Lengua de señas",
    "libras.description": "Ver traducción en lengua de señas",
    "allergen.gluten": "Gluten",
    "allergen.lactose": "Lactosa",
    "allergen.nuts": "Frutos secos",
    "allergen.soy": "Soja",
    "allergen.eggs": "Huevos",
    "allergen.fish": "Pescado",
    "allergen.shellfish": "Mariscos",
    "accessibility.title": "Accesibilidad",
    "accessibility.increase_font": "Aumentar fuente",
    "accessibility.decrease_font": "Disminuir fonte",
    "accessibility.high_contrast": "Alto contraste",
    "accessibility.grayscale": "Escala de grises",
    "accessibility.dyslexia_font": "Fuente para dislexia",
    "accessibility.reset": "Restablecer",
    "accessibility.open": "Abrir accesibilidad",
    "accessibility.open.description": "Abrir panel de opciones de accesibilidad",
    "accessibility.close": "Cerrar panel de accesibilidad",
    "waiter.call": "Llamar Camarero",
    "waiter.call.table": "Llamar Camarero — Mesa",
    "waiter.called": "¡Camarero llamado!",
    "waiter.calling": "Llamando...",
    "waiter.already_called": "El camarero ya ha sido llamado para esta mesa.",
    "language": "Idioma",
  },
  fr: {
    "header.title": "Menu Accessible",
    "header.table": "Table",
    "category.entrada": "Entrées",
    "category.prato": "Plats Principaux",
    "category.acompanhamento": "Accompagnements",
    "category.bebida": "Boissons",
    "category.sobremesa": "Desserts",
    "category.outros": "Autres",
    "filter.all": "Tous",
    "filter.pratos": "Plats Principaux",
    "filter.bebidas": "Boissons",
    "filter.sobremesas": "Desserts",
    "filter.outros": "Autres",
    "empty.title": "Aucun article disponible pour le moment.",
    "empty.subtitle": "Allez à /admin/gestao pour ajouter des articles.",
    "audio": "Audio",
    "audio.description": "Écouter la description de l'article du menu",
    "libras": "Langue des signes",
    "libras.description": "Voir la traduction en langue des signes",
    "allergen.gluten": "Gluten",
    "allergen.lactose": "Lactose",
    "allergen.nuts": "Noix",
    "allergen.soy": "Soja",
    "allergen.eggs": "Œufs",
    "allergen.fish": "Poisson",
    "allergen.shellfish": "Fruits de mer",
    "accessibility.title": "Accessibilité",
    "accessibility.increase_font": "Augmenter la police",
    "accessibility.decrease_font": "Diminuer la police",
    "accessibility.high_contrast": "Contraste élevé",
    "accessibility.grayscale": "Niveaux de gris",
    "accessibility.dyslexia_font": "Police dyslexie",
    "accessibility.reset": "Réinitialiser",
    "accessibility.open": "Ouvrir accessibilité",
    "accessibility.open.description": "Ouvrir le panneau d'options d'accessibilité",
    "accessibility.close": "Fermer le panneau d'accessibilité",
    "waiter.call": "Appeler Serveur",
    "waiter.call.table": "Appeler Serveur — Table",
    "waiter.called": "Serveur appelé !",
    "waiter.calling": "Appel en cours...",
    "waiter.already_called": "Le serveur a déjà été appelé pour cette table.",
    "language": "Langue",
  },
};

const langAudioMap: Record<Language, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
};

const defaultLanguageContext: LanguageContextType = {
  language: defaultLanguage,
  setLanguage: () => undefined,
  t: (key: string) => translations[defaultLanguage]?.[key] || key,
};

declare global {
  var __lovableLanguageContext: Context<LanguageContextType> | undefined;
}

const LanguageContext = globalThis.__lovableLanguageContext ?? createContext<LanguageContextType>(defaultLanguageContext);

globalThis.__lovableLanguageContext = LanguageContext;

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(defaultLanguage);

  const t = useCallback(
    (key: string) => translations[language]?.[key] || translations[defaultLanguage]?.[key] || key,
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function getAudioLang(lang: Language) {
  return langAudioMap[lang];
}
