import { GEMINI_ENDPOINT, GEMINI_MODEL, geminiKey } from "./ai";

/**
 * One structured-output call to Gemini. Uses generationConfig.responseJsonSchema (JSON Schema);
 * falls back to the older responseSchema field if the API rejects the first form.
 */
export async function generateJson<T>(prompt: string, schema: object, opts: { temperature?: number } = {}): Promise<T> {
  const url = `${GEMINI_ENDPOINT}/models/${GEMINI_MODEL}:generateContent`;
  const call = (schemaField: "responseJsonSchema" | "responseSchema") =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey() },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", [schemaField]: schema, temperature: opts.temperature ?? 0.2 },
      }),
      signal: AbortSignal.timeout(120_000),
    });
  let res = await call("responseJsonSchema");
  if (res.status === 400) res = await call("responseSchema");
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 500)}`);
  const body = await res.json();
  const text: string | undefined = body?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
  if (!text) throw new Error(`Gemini returned no text: ${JSON.stringify(body).slice(0, 500)}`);
  return JSON.parse(text) as T;
}
