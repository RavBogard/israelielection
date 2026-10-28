import type { ElectionLifecycleSnapshot } from "@/lib/election-lifecycle/types";
import { nextSteps } from "@/lib/government-next";
import type { Lang } from "@/lib/i18n";
import { locale } from "@/lib/i18n";
import { NEXT_STEPS } from "@/lib/i18n/government-next";

/** The dated "What happens next" strip. Done and next come from the lifecycle snapshot, not the clock. */
export default function NextSteps({ snapshot, lang, reliable = true }: { snapshot: Pick<ElectionLifecycleSnapshot, "seatContext" | "politics">; lang: Lang; reliable?: boolean }) {
  const t = NEXT_STEPS[lang];
  const fmt = (iso: string) => new Intl.DateTimeFormat(locale(lang), { timeZone: "UTC", weekday: "short", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${iso}T00:00:00Z`));
  const day = (iso: string) => new Intl.DateTimeFormat(locale(lang), { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(`${iso}T00:00:00Z`));
  return (
    <section className="gl-next" aria-labelledby="gl-next-h" data-testid="next-steps">
      <h2 id="gl-next-h">{t.heading}</h2>
      <ol>
        {nextSteps(snapshot, reliable).map((s) => {
          const when =
            s.id === "envelopes" && s.date ? t.through(fmt(s.date))
            : s.id === "results" && !s.date ? t.earlyNov
            : s.id === "results" && s.date ? day(s.date)
            : s.id === "consultations" && s.date ? t.by(day(s.date))
            : s.id === "mandate" && s.date ? t.ends(day(s.date))
            : null;
          const tag = s.state === "done" ? t.done : s.basis === "expected" ? t.expected : s.state === "next" ? t.next : null;
          return (
            <li key={s.id} data-step={s.id} data-state={s.state}>
              <span className="gl-next-tag">{tag ?? (s.basis === "fixed" ? t.byLaw : "")}</span>
              <h3>{t.titles[s.id]}</h3>
              {when && <p className="gl-next-when"><strong>{when}</strong></p>}
              <p>{t.rules[s.id]}</p>
              <p className="gl-next-src">{t.sources[s.id]}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
