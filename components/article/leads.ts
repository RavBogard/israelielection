import type { ComponentType } from "react";
import VotingRightsGuide from "@/components/VotingRightsGuide";
import SettlementsVote from "@/components/maps/SettlementsVote";
import BallotLead from "./BallotLead";
import FormationLead from "./FormationLead";
import WhatIf from "./WhatIf";

/**
 * The chart each reference page opens with, set right under its title (graphic first, Daniel,
 * 2026-10-06). The chart moves: it is drawn at the top and left out of the body. Issue pages open
 * with the Knesset split by answer instead (PositionsLead). Section indexes preview these charts.
 */
export const LEAD_CHARTS: Record<string, string> = {
  "/communities/druze": "druze.vote",
  "/communities/ethiopian-israelis": "ethiopian-israelis.population",
  "/communities/haredim": "haredim.towns",
  "/communities/masorti": "masorti.six-towns",
  "/communities/palestinian-citizens": "palestinian-citizens.turnout",
  "/communities/religious-zionists": "religious-zionists.poll2026",
  "/communities/russian-speakers": "russian-speakers.yb-towns",
  "/communities/secular": "secular.largest-list",
  "/communities/settlers": "settlers.vote-trend",
  "/american-lens": "american-lens.vote-considerations",
};

/**
 * A page that opens with an interactive or a drawing rather than a data chart. It wins over
 * LEAD_CHARTS (whose chart then stays in the body, where the copy puts it; the Communities index
 * still previews it). `hides` names MDX blocks the lead replaces, so they are not drawn twice.
 */
export const LEAD_FIGURES: Record<string, { Figure: ComponentType; hides?: string[] }> = {
  "/how-it-works/forming-a-government": { Figure: FormationLead },
  "/how-it-works/seats": { Figure: WhatIf, hides: ["WhatIf"] },
  "/how-it-works/voting": { Figure: BallotLead },
  "/how-it-works/who-votes": { Figure: VotingRightsGuide },
  "/communities/settlers": { Figure: SettlementsVote },
};
