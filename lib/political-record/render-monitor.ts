import type { MonitorCheck } from "./monitor-types";
const LOCALES = ["en", "he", "ar", "fa", "de", "fr", "zh"];
/** Parse only status/locale/timing; never retain browser errors, HTML, headers or bearer artifacts. */
export function renderedChecks(input: unknown, now: string): MonitorCheck[] {
  const found = new Map<string, { status: string; attempts: number }>();
  const visit = (value: unknown) => {
    if (!value || typeof value !== "object") return;
    const row = value as Record<string, unknown>;
    if (typeof row.title === "string" && Array.isArray(row.tests)) {
      const locale = row.title.match(
        /^render (en|he|ar|fa|de|fr|zh) homepage and stored-state tools$/,
      )?.[1];
      if (locale) {
        const tests = row.tests as { results?: { status?: unknown }[] }[],
          results = tests.flatMap((test) => test.results ?? []);
        const last = results.at(-1);
        found.set(locale, {
          status: typeof last?.status === "string" ? last.status : "unknown",
          attempts: Math.min(3, results.length),
        });
      }
    }
    for (const key of ["suites", "specs"]) {
      if (Array.isArray(row[key]))
        for (const child of row[key] as unknown[]) visit(child);
    }
  };
  visit(input);
  return LOCALES.map((locale) => {
    const result = found.get(locale);
    return {
      id: `render:${locale}`,
      scope: "render",
      state:
        result?.status === "passed"
          ? "healthy_no_new"
          : result &&
              ["failed", "timedOut", "interrupted"].includes(result.status)
            ? "unavailable"
            : "unknown",
      checkedAt: now,
      reasonCode:
        result?.status === "passed"
          ? "render_smoke_pass"
          : result
            ? "render_smoke_failed"
            : "render_result_missing",
      attempts: result?.attempts ?? 0,
      subjects: [`locale:${locale}`],
    };
  });
}
