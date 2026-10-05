/**
 * Model settings for the scheduled jobs (polls refresh, daily briefing).
 * The key lives in Vercel and GitHub Actions secrets as GEMINI_API_KEY.
 * Model ID verified against ai.google.dev/gemini-api/docs/models on 2026-10-04:
 * "gemini-3.8-flash" is the stable Gemini 3.8 Flash (no -preview suffix).
 */
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
export const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta";

export function geminiKey(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY is not set");
  return k;
}
