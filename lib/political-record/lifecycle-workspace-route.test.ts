import {afterEach,expect,it,vi} from "vitest";
const mocks=vi.hoisted(()=>({workspace:vi.fn(),lifecycle:vi.fn()}));
vi.mock("./workspace-server",()=>({getWorkspaceRegistry:mocks.workspace}));
vi.mock("../election-lifecycle/server",()=>({getElectionLifecycle:mocks.lifecycle}));
import {GET} from "../../app/api/election-lifecycle/route";
afterEach(()=>vi.clearAllMocks());
it("identifies a confirmed edition switch separately from same-edition source outage",async()=>{
 mocks.workspace.mockResolvedValue({state:"available",registry:{currentElectionId:"il-knesset-27"}});mocks.lifecycle.mockResolvedValue(null);const switched=await GET(new Request("https://example.org/api/election-lifecycle?view=seats"));expect(switched.status).toBe(503);expect(await switched.json()).toMatchObject({currentElectionId:"il-knesset-27",workspaceState:"available",reason:"current_workspace_unavailable"});
 mocks.workspace.mockResolvedValue({state:"available",registry:{currentElectionId:"il-knesset-26"}});expect(await (await GET(new Request("https://example.org/api/election-lifecycle"))).json()).toMatchObject({reason:"source_unavailable",currentElectionId:"il-knesset-26"});
});
it("does not invent an election during a cold registry outage and preserves explicit pin selection",async()=>{
 mocks.workspace.mockResolvedValue({state:"unavailable",registry:null});mocks.lifecycle.mockResolvedValue(null);expect(await (await GET(new Request("https://example.org/api/election-lifecycle"))).json()).toMatchObject({currentElectionId:null,workspaceState:"unavailable"});
 await GET(new Request("https://example.org/api/election-lifecycle?revision=saved&election=il-knesset-26"));expect(mocks.lifecycle).toHaveBeenLastCalledWith({revision:"saved",electionId:"il-knesset-26"});
});
