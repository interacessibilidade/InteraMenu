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
    "header.title": "Cardápio Digital Acessível",
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
    "libras": "Libras",
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
    "accessibility.close": "Fechar acessibilidade",
    "waiter.call": "Chamar Garçom",
    "waiter.calling": "Chamando...",
    "language": "Idioma",
  },
  en: {
    "header.title": "Accessible Digital Menu",
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
    "libras": "Sign Language",
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
    "accessibility.close": "Close accessibility",
    "waiter.call": "Call Waiter",
    "waiter.calling": "Calling...",
    "language": "Language",
  },
  es: {
    "header.title": "Menú Digital Accesible",
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
    "libras": "Lengua de señas",
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
    "accessibility.close": "Cerrar accesibilidad",
    "waiter.call": "Llamar Camarero",
    "waiter.calling": "Llamando...",
    "language": "Idioma",
  },
  fr: {
    "header.title": "Menu Numérique Accessible",
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
    "libras": "Langue des signes",
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
    "accessibility.close": "Fermer accessibilité",
    "waiter.call": "Appeler Serveur",
    "waiter.calling": "Appel en cours...",
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
