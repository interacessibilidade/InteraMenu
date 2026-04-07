import { useLanguage, type Language } from "@/hooks/useLanguage";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages: { value: Language; label: string; flag: string }[] = [
  { value: "pt", label: "Português", flag: "🇧🇷" },
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "fr", label: "Français", flag: "🇫🇷" },
];

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div role="group" aria-label="Opções de idioma do cardápio">
      <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
        <SelectTrigger className="w-auto min-w-[140px] h-9 text-sm gap-2" aria-label="Opções de idioma do cardápio">
          <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {languages.map((l) => (
            <SelectItem key={l.value} value={l.value} tabIndex={0}>
              <span className="flex items-center gap-2">
                <span aria-hidden="true">{l.flag}</span>
                <span>{l.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
