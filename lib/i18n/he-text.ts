/**
 * The Hebrew interface words, filled on Hebrew pages only. Each dictionary (lib/i18n/chrome.ts and the rest) keeps
 * its English inline and reads its Hebrew from here, so a client bundle reached from an English page carries no
 * Hebrew; lib/i18n/he/register.ts fills it from the Hebrew layout's provider and the server-side overlay loader.
 */
const loaded: Record<string, unknown> = {};

export function setHeText(area: string, text: unknown): void {
  loaded[area] = text;
}

export function heText<T>(area: string): T {
  const text = loaded[area];
  if (!text) throw new Error(`The Hebrew words for "${area}" are not loaded: import lib/i18n/he/register on this page.`);
  return text as T;
}
