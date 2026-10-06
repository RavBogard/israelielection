import { partiesData, pollsData } from "@/lib/data";
import { httpUrl, mediumDate } from "@/lib/format";
import { pollLabel } from "@/lib/polls";
import type { Lang } from "@/lib/i18n";
// Server only: loads the Hebrew overlays pollLabel reads for the Hebrew source lines.
import "@/lib/i18n/overlays";

/** English data text inside a Hebrew line. */
const En = ({ children }: { children: string }) => <span lang="en" dir="ltr">{children}</span>;

/** Poll source lines, generated from data/polls.json. */
export function PollSources({ lang = "en" }: { lang?: Lang }) {
  if (lang === "he") return <PollSourcesHe />;
  return (
    <>
      {pollsData.polls.map((p) => (
        <li key={p.id}>
          <b>{pollLabel(p)}</b> poll{p.fieldwork ? `, fieldwork ${p.fieldwork}` : ""}, published {mediumDate(p.published)}
          {p.n ? ` (n=${p.n.toLocaleString("en-US")}${p.margin ? `, margin ${p.margin}` : ""})` : ""}
          {p.via ? `, via ${p.via}` : ""}
          {httpUrl(p.url) && (
            <>
              :{" "}
              <a href={httpUrl(p.url)!} target="_blank" rel="noopener">
                {p.url!.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </>
          )}
          .{p.note ? ` ${p.note}` : ""}
        </li>
      ))}
    </>
  );
}

/** The same lines for the Hebrew pages: the outlet first, the firm after it; the data's own notes stay English. */
function PollSourcesHe() {
  return (
    <>
      {pollsData.polls.map((p) => (
        <li key={p.id}>
          <b>{pollLabel(p, "he")}</b>
          {p.fieldwork && <>, עבודת שטח: <En>{p.fieldwork}</En></>}, פורסם ב-{mediumDate(p.published, "he")}
          {p.n ? <> ({p.n.toLocaleString("en-US")} משיבים{p.margin && <>, טעות הדגימה <bdi dir="ltr">{p.margin}</bdi></>})</> : null}
          {p.via && <>, דרך <En>{p.via}</En></>}
          {httpUrl(p.url) && (
            <>
              :{" "}
              <a href={httpUrl(p.url)!} target="_blank" rel="noopener" dir="ltr">
                {p.url!.replace(/^https?:\/\/(www\.)?/, "")}
              </a>
            </>
          )}
          .{p.note && <> <En>{p.note}</En></>}
        </li>
      ))}
    </>
  );
}

/** Profile provenance lines shared by every page that shows party profiles. */
export function ProfileSources({ lang = "en" }: { lang?: Lang }) {
  if (lang === "he")
    return (
      <>
        <li>
          <b>דפי המפלגות</b> (היסטוריה, בוחרים, עמדות, מועמדים, התחייבויות, הסכמי עודפים וציטוטים): מאגרי מחקר שעודכנו ב-{mediumDate(partiesData.updated, "he")}, לפי
          המקורות שמצוינים ליד כל פריט (המכון הישראלי לדמוקרטיה, טיימס אוף ישראל, ג&apos;רוזלם פוסט, ynet, JTA, ערוץ 7, אל-ג&apos;זירה, מעריב ועוד). ציטוט מובא בלשון המקור
          כשנמצאה; ציטוט שתורגם מסומן (תרגום), ולכל ציטוט מקור.
        </li>
        <li>
          <b>קורות החיים של ראשי המפלגות:</b> <En>{partiesData.bioSource}</En>
        </li>
      </>
    );
  return (
    <>
      <li>
        <b>Party profiles</b> (history, voters, positions, list names, pledges, surplus partners, quotes): research registers compiled{" "}
        {mediumDate(partiesData.updated)}, from the sources named next to each item (Israel Democracy Institute, Times of Israel,
        Jerusalem Post, Ynet, JTA, INN, Al Jazeera, Maariv and others). Quotes are translated from Hebrew where needed, and each names its source.
      </li>
      <li>
        <b>Leader bios:</b> {partiesData.bioSource}
      </li>
    </>
  );
}
