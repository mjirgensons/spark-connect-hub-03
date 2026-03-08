import { useState, useRef, useEffect } from "react";

const LANGUAGES = [
  { code: "EN", label: "English", bcp47: "en-US" },
  { code: "FR", label: "Français", bcp47: "fr-FR" },
  { code: "DE", label: "Deutsch", bcp47: "de-DE" },
  { code: "ES", label: "Español", bcp47: "es-ES" },
  { code: "IT", label: "Italiano", bcp47: "it-IT" },
  { code: "PT", label: "Português", bcp47: "pt-BR" },
  { code: "LV", label: "Latviešu", bcp47: "lv-LV" },
  { code: "RU", label: "Русский", bcp47: "ru-RU" },
  { code: "ZH", label: "中文", bcp47: "zh-CN" },
  { code: "JA", label: "日本語", bcp47: "ja-JP" },
  { code: "KO", label: "한국어", bcp47: "ko-KR" },
  { code: "AR", label: "العربية", bcp47: "ar-SA" },
  { code: "HI", label: "हिन्दी", bcp47: "hi-IN" },
  { code: "TR", label: "Türkçe", bcp47: "tr-TR" },
  { code: "PL", label: "Polski", bcp47: "pl-PL" },
  { code: "NL", label: "Nederlands", bcp47: "nl-NL" },
  { code: "SV", label: "Svenska", bcp47: "sv-SE" },
  { code: "UK", label: "Українська", bcp47: "uk-UA" },
] as const;

export type VoiceLangCode = (typeof LANGUAGES)[number]["code"];

const STORAGE_KEY = "fitmatch_voice_lang";

export function getBcp47(code: string): string {
  return LANGUAGES.find((l) => l.code === code)?.bcp47 ?? "en-US";
}

export function useVoiceLang() {
  const [lang, setLang] = useState<string>(() => {
    if (typeof window === "undefined") return "EN";
    return localStorage.getItem(STORAGE_KEY) || "EN";
  });

  const select = (code: string) => {
    setLang(code);
    localStorage.setItem(STORAGE_KEY, code);
  };

  return { lang, bcp47: getBcp47(lang), select };
}

interface Props {
  value: string;
  onChange: (code: string) => void;
}

export default function VoiceLangSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0 flex items-center">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="text-xs font-mono text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1 leading-none"
        aria-label="Select voice language"
      >
        {value}
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-1 w-40 max-h-48 overflow-y-auto bg-background border-2 border-foreground z-50 shadow-md"
          style={{ borderRadius: 0 }}
        >
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => {
                onChange(l.code);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-sans hover:bg-accent hover:text-accent-foreground transition-colors flex items-center justify-between ${
                value === l.code ? "bg-muted font-semibold" : ""
              }`}
            >
              <span>{l.label}</span>
              <span className="text-muted-foreground font-mono">{l.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
