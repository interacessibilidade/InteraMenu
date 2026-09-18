interface AccessibilityIconProps {
  className?: string;
}

/**
 * Símbolo de acessibilidade: figura humana formada por círculos conectados
 * (cabeça, mãos e pés) dentro de um círculo maior.
 */
export function AccessibilityIcon({ className }: AccessibilityIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Círculo externo */}
      <circle cx="50" cy="53" r="37" stroke="currentColor" strokeWidth="5" />

      {/* Linhas: ombros e pernas */}
      <line x1="50" y1="30" x2="16" y2="54" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="30" x2="84" y2="54" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="55" x2="33" y2="93" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="55" x2="67" y2="93" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />

      {/* Cabeça */}
      <circle cx="50" cy="19" r="11" fill="#4FC3E8" />
      {/* Mãos */}
      <circle cx="16" cy="54" r="8" fill="#4FC3E8" />
      <circle cx="84" cy="54" r="8" fill="#4FC3E8" />
      {/* Pés */}
      <circle cx="33" cy="93" r="8" fill="#4FC3E8" />
      <circle cx="67" cy="93" r="8" fill="#4FC3E8" />
    </svg>
  );
}
