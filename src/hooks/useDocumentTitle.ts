import { useEffect } from "react";

/**
 * Define o título do documento (o que o leitor de tela anuncia ao carregar
 * a página, e o que aparece na aba do navegador). Restaura o título anterior
 * ao desmontar, para não vazar título de uma tela pra outra em navegações rápidas.
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
