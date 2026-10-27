import { alternates, localizedAlternates } from "./canonical";
import { editionPath, LANGS, type Lang } from "./i18n";
import { historyText } from "./i18n/history";
import { translatedTool } from "./reference/catalog";
import { partyText } from "./i18n/overlays";
import parties from "../data/parties.json";
import timeline from "../data/timeline.json";
import histories from "../data/party-history.json";
export function historicalMetadata(
  kind: "timeline" | "party-history",
  lang: Lang,
) {
  const path = "/" + kind,
    t = historyText(lang),
    edition = translatedTool(
      "tools:" + kind,
      lang,
      kind === "timeline" ? timeline : histories,
    );
  return {
    title: kind === "timeline" ? t.timelineTitle : t.historyTitle,
    description: kind === "timeline" ? t.timelineIntro : t.historyIntro,
    alternates:
      lang === "en"
        ? alternates(path)
        : localizedAlternates(editionPath(path, lang)!),
    ...(lang !== "en" && edition.state !== "ready"
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}
export function historyPartyLabels(lang: Lang) {
  return Object.fromEntries(
    parties.parties.map((p) => [
      p.id,
      {
        name: partyText(p, "name", lang).text,
        aliases: [
          ...new Set(
            LANGS.flatMap((l) => [
              partyText(p, "name", l).text,
              partyText(p, "short", l).text,
            ]),
          ),
        ],
      },
    ]),
  );
}
