import type {ProposalDecision} from "@/lib/election-lifecycle/types";
import type {Lang} from "@/lib/i18n";
import {FORMATION} from "@/lib/i18n/formation-live";
import {LIFECYCLE} from "@/lib/i18n/election-lifecycle";
import {proposalLedger} from "@/lib/reference/ledger";
export default function ProposalLedger({seats,decisions,lang}:{seats:Record<string,number>;decisions:ProposalDecision[];lang:Lang}){
 const totals=proposalLedger(seats,decisions),t=FORMATION[lang];
 return <table className="data-table"><caption>{t.confidence}. {t.caution}</caption><thead><tr><th scope="col">{t.party_position}</th><th scope="col">{LIFECYCLE[lang].seats}</th></tr></thead><tbody>{(Object.keys(totals) as (keyof typeof totals)[]).map(role=><tr key={role}><th scope="row">{t[role]}</th><td>{totals[role]}</td></tr>)}</tbody></table>;
}
