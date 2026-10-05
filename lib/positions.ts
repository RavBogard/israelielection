/** The seven position files by comparison axis. Static imports, so the comparison and the Builder's panel read the same rows. */
import courts from "@/data/positions/courts.json";
import economy from "@/data/positions/economy.json";
import draft from "@/data/positions/haredi-draft.json";
import pstate from "@/data/positions/palestinian-state.json";
import relig from "@/data/positions/religion-state.json";
import war from "@/data/positions/war-hostages.json";
import wb from "@/data/positions/west-bank.json";
import type { IssueFile } from "./cohesion";
import type { AxisKey } from "./compare";

export const ISSUES: Record<AxisKey, IssueFile> = {
  draft: draft as IssueFile,
  courts: courts as IssueFile,
  war: war as IssueFile,
  wb: wb as IssueFile,
  relig: relig as IssueFile,
  econ: economy as IssueFile,
  pstate: pstate as IssueFile,
};
