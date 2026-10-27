import { ballotLists, type BallotList } from "./ballot";
import { parties } from "./data";
import { partyText } from "./i18n/overlays";
import { LANGS, type Lang } from "./i18n";
export type BallotLabel = {
  name: { text: string; lang: Lang };
  leader: { text: string; lang: Lang } | null;
  aliases: string[];
};
export function ballotLabels(
  lang: Lang,
  sourceParties = parties,
): Record<string, BallotLabel> {
  return Object.fromEntries(
    ballotLists.map((list: BallotList) => {
      const party = sourceParties.find((p) => p.id === list.profile);
      const name =
        lang === "en"
          ? { text: list.name, lang }
          : party
            ? partyText(party, "name", lang)
            : { text: list.hebrew, lang: "he" as const };
      const leader =
        list.leader === party?.leader && party
          ? partyText(party, "leader", lang)
          : list.leader
            ? { text: list.leader, lang: "en" as const }
            : null;
      return [
        list.id,
        {
          name,
          leader,
          aliases: party
            ? LANGS.flatMap((l) => [
                partyText(party, "name", l).text,
                partyText(party, "short", l).text,
                partyText(party, "leader", l).text,
              ])
            : [],
        },
      ];
    }),
  );
}
