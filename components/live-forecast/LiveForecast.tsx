import { lifecycleForRender } from "@/lib/seat-context-server";
import { FORMATION } from "@/lib/i18n/formation-live";
import scenarioData from "@/data/coalition-scenarios.json";
import { parties, pledgeRules } from "@/lib/data";
import { arrangementWarnings, type RoleOverrides } from "@/lib/coalition-arrangement";
import { editionPath, locale, type Lang } from "@/lib/i18n";
import { partyText, pledgeText, scenarioText } from "@/lib/i18n/overlays";
import { LIVE_FORECAST } from "@/lib/i18n/live-forecast";
import { getLiveForecast, liveForecastEnabled } from "@/lib/live-forecast/server";
import { partyColor } from "@/lib/party-colors";
import ForecastClient, { ForecastDisplay } from "./ForecastClient";
import type { ForecastProps } from "./presentation";
import "./live-forecast.css";

/** Localized presentation data is prepared on the server; source datasets stay here. */
export function forecastPresentation(lang: Lang): Pick<ForecastProps, "text" | "names" | "scenarios"> {
  const text = LIVE_FORECAST[lang];
  const names = Object.fromEntries(parties.map((party) => {
    const name = partyText(party, "name", lang);
    return [party.id, { name: name.text, lang: name.lang, color: partyColor(party.id) }];
  }));
  const list = new Intl.ListFormat(locale(lang), { style: "long", type: "conjunction" });
  const scenarios = scenarioData.scenarios.map((scenario) => {
    const roles: RoleOverrides = Object.fromEntries([...scenario.support.map((id) => [id, "support"]), ...scenario.abstain.map((id) => [id, "abstain"])]);
    const warnings = arrangementWarnings(new Set(scenario.cabinet), roles, parties, pledgeRules, {
      message: (rule) => pledgeText(rule, lang), name: (party) => names[party.id].name, and: (parts) => list.format(parts),
    }).map((warning) => ({ text: warning.message, lang: warning.lang ?? "en" as Lang, source: warning.source }));
    const query = new URLSearchParams({ poll: "forecast", scenario: scenario.id, with: scenario.cabinet.join(",") });
    if (scenario.support.length) query.set("support", scenario.support.join(","));
    if (scenario.abstain.length) query.set("abstain", scenario.abstain.join(","));
    const title = scenarioText(scenario, "title", lang);
    return { id: scenario.id, title: title.text, titleLang: title.lang, href: `${editionPath("/coalition-builder", lang)}?${query}`, roles: ([ [text.cabinet, scenario.cabinet], [text.support, scenario.support], [text.abstain, scenario.abstain] ] as [string, string[]][]).filter(([, ids]) => ids.length).map(([label, ids]) => ({ label, names: list.format(ids.map((id) => names[id]?.name ?? id)) })), warnings, sourceUrl: scenario.url };
  });
  return { text, names, scenarios };
}

/** Resolve beside each page's count fetch, keeping its returned tree synchronous for HTML renderers. */
export default async function renderLiveForecast({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  if (!liveForecastEnabled()) return null;
  const [initial,lifecycle]=await Promise.all([getLiveForecast(),lifecycleForRender()]);
  if(lifecycle?.archive.electionForecast==="complete"||lifecycle?.seatContext.seatStatus==="official")return <details><summary>{FORMATION[lang].archive}</summary><ForecastDisplay initial={initial} lang={lang} compact={compact} {...forecastPresentation(lang)}/></details>;
  return <ForecastClient initial={initial} lang={lang} compact={compact} {...forecastPresentation(lang)} />;
}
