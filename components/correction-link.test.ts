import { it, expect, vi } from "vitest";
import "@/lib/i18n/overlays";
vi.mock("next/navigation", () => ({
  usePathname: () => "/he/coalition-builder",
}));
vi.mock("@/lib/i18n/lang", () => ({ useLang: () => "he" }));
import CorrectionLink from "./CorrectionLink";
it("captures contextual path/query/hash on a Vercel preview without allowing arbitrary hosts", () => {
  vi.stubGlobal("window", {
    location: {
      href: "https://example-preview.vercel.app/he/coalition-builder?with=likud&support=utj#arrangement",
      pathname: "/he/coalition-builder",
      search: "?with=likud&support=utj",
      hash: "#arrangement",
    },
  });
  try {
    const link = CorrectionLink({}),
      target = { href: "" };
    link.props.onClick({ currentTarget: target });
    const url = new URL(target.href, "https://www.israelielection.org");
    expect(url.pathname).toBe("/he/corrections");
    expect(url.searchParams.get("url")).toBe(
      "https://www.israelielection.org/he/coalition-builder?with=likud&support=utj#arrangement",
    );
  } finally {
    vi.unstubAllGlobals();
  }
});
