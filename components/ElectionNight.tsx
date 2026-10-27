import data from "@/data/election-night.json";
import { parties } from "@/lib/data";
import { locale, type Lang } from "@/lib/i18n";
import { ELECTION_NIGHT } from "@/lib/i18n/election-night";
import { partyText } from "@/lib/i18n/overlay-text";
import { partyColor } from "@/lib/party-colors";
import "./election-night.css";

type Source = { name: string; url: string };
type Reaction = { speaker: string; list: string; quote?: string; paraphrase?: string; source: Source };

const Src = ({ s, lang }: { s: Source; lang: Lang }) => (
  <a className="en-src" href={s.url} hrefLang="en" lang={lang === "en" ? undefined : "en"}>{s.name}</a>
);

/** The turnout sentence, for the hero and the results page. */
export function turnoutLine(lang: Lang) {
  const t = ELECTION_NIGHT[lang], n = new Intl.NumberFormat(locale(lang));
  return t.turnout(new Intl.NumberFormat(locale(lang), { maximumFractionDigits: 1 }).format(data.turnout.pct), n.format(data.turnout.voters));
}

/** Election night on /results: turnout, what the count will do, the ballot-slip complaints, the leaders' words. Facts in data/election-night.json. */
export default function ElectionNight({ lang }: { lang: Lang }) {
  const t = ELECTION_NIGHT[lang];
  const reactions = data.reactions as Reaction[];
  return (
    <section className="rs-watch en-night" aria-labelledby="night-h">
      <h2 id="night-h" className="sec-h">{t.tonightH}</h2>
      <dl>
        <div>
          <dt>{t.turnoutDt}</dt>
          <dd>{turnoutLine(lang)} <Src s={data.turnout.source} lang={lang} /></dd>
        </div>
        <div>
          <dt>{t.countDt}</dt>
          <dd>{t.countDd} <Src s={data.countSource} lang={lang} /></dd>
        </div>
        <div>
          <dt>{t.complaintsDt}</dt>
          <dd>{t.complaintsDd} <q>{t.committeeQuote}</q> <Src s={data.complaintsSource} lang={lang} /></dd>
        </div>
        <div>
          <dt>{t.reactionsDt}</dt>
          <dd>
            <ul className="en-quotes">
              {reactions.map((r) => {
                const party = parties.find((p) => p.id === r.list), name = party ? partyText(party, "name", lang) : null;
                return (
                  <li key={r.speaker}>
                    <span className="en-who">
                      <span className="sw" style={{ background: partyColor(r.list) }} aria-hidden="true" />
                      <b lang={lang === "en" ? undefined : "en"}>{r.speaker}</b>
                      {name && <span lang={name.lang === lang ? undefined : name.lang}>{name.text}</span>}
                    </span>
                    <span lang={lang === "en" ? undefined : "en"} dir="ltr" className="en-said">
                      {r.quote ? <q>{r.quote}</q> : r.paraphrase} <Src s={r.source} lang={lang} />
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="en-note">{t.reactionsNote}</p>
          </dd>
        </div>
      </dl>
    </section>
  );
}

/** How a government is formed, for /government. */
export function FormationSteps({ lang }: { lang: Lang }) {
  const t = ELECTION_NIGHT[lang];
  return (
    <section className="en-formation" aria-labelledby="formation-h">
      <h2 id="formation-h">{t.formationH}</h2>
      <ol>{t.formation.map((step) => <li key={step}>{step}</li>)}</ol>
      <p className="en-note">{t.formationSource}</p>
    </section>
  );
}
