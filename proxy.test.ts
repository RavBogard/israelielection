import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";
import { HE_PATHS } from "./lib/i18n";

const req = (path: string, headers: Record<string, string> = {}) => new NextRequest(new URL(path, "https://www.israelielection.org"), { headers: { "user-agent": "Mozilla/5.0", ...headers } });

describe("proxy", () => {
  it("runs on exactly the English pages with a Hebrew edition", () => {
    expect(config.matcher).toEqual(HE_PATHS.map((p) => p.replace("[id]", ":id")));
  });
  it("redirects a page load from Israel to the Hebrew page, keeping the query", () => {
    const res = proxy(req("/coalition-builder?poll=results", { "x-vercel-ip-country": "IL", "sec-fetch-dest": "document" }));
    expect(res?.status).toBe(307);
    expect(res?.headers.get("location")).toBe("https://www.israelielection.org/he/coalition-builder?poll=results");
    expect(proxy(req("/", { "accept-language": "he-IL" }))?.headers.get("location")).toBe("https://www.israelielection.org/he");
    expect(proxy(req("/parties/likud", { "x-vercel-ip-country": "IL" }))?.headers.get("location")).toBe("https://www.israelielection.org/he/parties/likud");
  });
  it("passes the router's fetches and an English choice through", () => {
    expect(proxy(req("/polls", { "x-vercel-ip-country": "IL", rsc: "1" }))).toBeUndefined();
    expect(proxy(req("/polls", { "x-vercel-ip-country": "IL", "sec-fetch-dest": "empty" }))).toBeUndefined();
    expect(proxy(req("/polls", { "x-vercel-ip-country": "IL", cookie: "lang=en" }))).toBeUndefined();
    expect(proxy(req("/polls", { "x-vercel-ip-country": "US" }))).toBeUndefined();
  });
});
