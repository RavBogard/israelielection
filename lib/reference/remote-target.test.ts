import {describe,it,expect} from "vitest";
import {referenceRemoteTarget} from "./remote-target";
describe("immutable deployment transport with configured signing subject",()=>{
 it("keeps the configured canonical subject separate from transport",()=>{const t=referenceRemoteTarget("https://immutable.vercel.app/api/reference/worker","https://configured.vercel.app/api/reference/worker");expect(t.destination.host).toBe("immutable.vercel.app");expect(t.signingSubject.host).toBe("configured.vercel.app");});
 it("defaults to exact transport URL and rejects other paths/query/userinfo",()=>{const t=referenceRemoteTarget("https://preview.vercel.app/api/reference/worker");expect(t.destination.href).toBe(t.signingSubject.href);for(const u of ["http://x/api/reference/worker","https://x/api/other","https://x/api/reference/worker?prompt=x","https://u:p@x/api/reference/worker"])expect(()=>referenceRemoteTarget(u)).toThrow("invalid_worker_destination");});
});
