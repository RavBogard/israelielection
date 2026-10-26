import {describe,it,expect,vi} from "vitest";
import {readFileSync} from "node:fs";
import {sourceBlocks} from "../../scripts/reference/source-blocks.mjs";
import {canonicalSource,sourceRevision} from "./source.mjs";
vi.mock("@/lib/political-record/read-model",()=>({getPoliticalPlatformReadModel:vi.fn()}));
import {editionEvidence} from "./read-model";
import {referenceDocuments} from "./catalog";
import {ELECTIONS} from "@/lib/political-record/registry";
import type {ElectionLifecycleSnapshot} from "@/lib/election-lifecycle/types";
import {selectTranslation,translationContentHash,validateTranslation,type SourceDocument,type TranslationDocument} from "./translations";
const source:SourceDocument={id:"test",path:"/test",file:"",revision:"source1",title:"Test",checked:"2026-10-26",links:[],numbers:[],blocks:[{id:"b1",kind:"text",text:"Netanyahu did not win 61 seats.",names:["Netanyahu"],negated:true}]};
function candidate(text="Netanyahu לא זכה ב-61 מושבים."):TranslationDocument{const d={id:"test",lang:"he",sourceRevision:"source1",status:"published",blocks:[{id:"b1",text}],publishedAt:"2026-10-26T00:00:00Z",review:{sourceRevision:"source1",contentHash:"",model:"separate-review",verdict:"supported",blocks:[{id:"b1",supported:true,complete:true,negationPreserved:true,namesPreserved:true}]}} as TranslationDocument;d.review.contentHash=translationContentHash(d);return d;}
describe("reference evidence and translation publication",()=>{
 it("uses the same revision and block text for CRLF checkouts and LF archives",()=>{const lf="A source.\n\n61 seats.\n",crlf=lf.replaceAll("\n","\r\n");expect(sourceRevision(crlf)).toBe(sourceRevision(lf));expect(canonicalSource(crlf)).toBe(lf);expect(sourceBlocks(crlf,{title:"T",dek:"D"})).toEqual(sourceBlocks(lf,{title:"T",dek:"D"}));});
 it("keeps all22source documents revision-matched to real bytes",()=>{expect(referenceDocuments).toHaveLength(22);for(const d of referenceDocuments){expect(sourceRevision(readFileSync(d.file))).toBe(d.revision);expect(d.blocks.length).toBeGreaterThan(2);}});
 it("does not collide same-year elections or substitute current evidence for another edition",()=>{const next={...ELECTIONS[0],id:"il-knesset-27",termNumber:27,electionDay:"2026-12-01"};const lifecycle={election:ELECTIONS[0].electionDay} as ElectionLifecycleSnapshot;expect(editionEvidence([...ELECTIONS,next],next.id,lifecycle).lifecycle).toBeNull();expect(editionEvidence([...ELECTIONS,next],ELECTIONS[0].id,lifecycle).lifecycle).toBe(lifecycle);expect(editionEvidence(ELECTIONS,"unknown",lifecycle).state).toBe("unknown");});
 it("rejects changed rendered numbers even if untrusted arrays claim the right ones",()=>{const d={...candidate("Netanyahu לא זכה ב-99 מושבים."),numbers:["61"]};expect(()=>validateTranslation(d,source)).toThrow("rendered_invariants_changed");});
 it("rejects omitted names and negation",()=>{expect(()=>validateTranslation(candidate("לא זכה ב-61 מושבים."),source)).toThrow("rendered_name_missing");expect(()=>validateTranslation(candidate("Netanyahu זכה ב-61 מושבים."),source)).toThrow("rendered_negation_missing");});
 it("validates actual relative links, not supplied link arrays",()=>{const linked={...source,blocks:[{...source.blocks[0],text:source.blocks[0].text+" [Guide](/how-it-works/seats)"}]};expect(()=>validateTranslation(candidate(),linked)).toThrow("rendered_invariants_changed");});
 it("requires independent semantic completeness bound to exactly these blocks",()=>{const d=candidate();d.review.blocks[0].complete=false;expect(()=>validateTranslation(d,source)).toThrow("semantic_review_required");const changed=candidate();changed.blocks[0].text+=" טקסט נוסף";expect(()=>validateTranslation(changed,source)).toThrow("semantic_review_required");});
 it("does not fall back to an older published translation after withdrawal or source change",()=>{const d=candidate();expect(selectTranslation(source,"he",[d]).state).toBe("ready");expect(selectTranslation({...source,revision:"source2"},"he",[d]).state).toBe("withdrawn");expect(selectTranslation(source,"he",[d,{...d,status:"withdrawn",publishedAt:"2026-10-27T00:00:00Z"}]).state).toBe("withdrawn");expect(selectTranslation(source,"de",[d]).state).toBe("pending");});
});
