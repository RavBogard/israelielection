import type { ToolLang } from "./index";

// Dictionaries are registered per language, never as mutable request-wide "current language" state.
const loaded: Partial<Record<ToolLang, Record<string, unknown>>> = {};
export function setEditionText(lang: ToolLang, area: string, text: unknown): void {
  (loaded[lang] ??= {})[area] = text;
}
export function editionText<T>(lang: ToolLang, area: string): T {
  const text = loaded[lang]?.[area];
  if (!text) throw new Error(`Load lib/i18n/${lang}/register before reading ${area}.`);
  return text as T;
}
