import {it,expect} from "vitest";
import {readPartyMapSelection,partyMapSelectionHref} from "./party-map-state";
it("restores deep links and legacy hashes without trusting unknown party IDs",()=>{
 const ids=["likud","shas","bw"];expect(readPartyMapSelection(new URLSearchParams("party=shas"),"",ids)).toBe("shas");expect(readPartyMapSelection(new URLSearchParams(),"#bw",ids)).toBe("bw");expect(readPartyMapSelection(new URLSearchParams("party=bad"),"#likud",ids)).toBeNull();expect(readPartyMapSelection(new URLSearchParams(),"#%broken",ids)).toBeNull();
});
it("selection and close preserve unrelated URL state, canonicalize legacy links and roundtrip browser-history states",()=>{
 const ids=["likud","shas"];const first=partyMapSelectionHref(new URLSearchParams("view=all"),"#sources","likud",ids);const second=partyMapSelectionHref(new URLSearchParams(first.split("?")[1].split("#")[0]),"#sources","shas",ids);expect(first).toBe("/parties?view=all&party=likud#sources");expect(readPartyMapSelection(new URLSearchParams(second.split("?")[1].split("#")[0]),"#sources",ids)).toBe("shas");expect(partyMapSelectionHref(new URLSearchParams("party=likud&view=all"),"#likud",null,ids)).toBe("/parties?view=all");expect(readPartyMapSelection(new URLSearchParams(first.split("?")[1].split("#")[0]),"#sources",ids)).toBe("likud");
});
