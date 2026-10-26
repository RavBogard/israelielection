import { afterEach, expect, it, vi } from "vitest";
import { fetchPrimaryDetailed } from "./acquisition";
afterEach(() => vi.unstubAllGlobals());
it("follows bounded ordinary HTTPS canonical redirects only within the verified host set", async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      new Response(null, {
        status: 301,
        headers: { location: "https://www.primary.example/article/" },
      }),
    )
    .mockResolvedValueOnce(new Response("<article>actual body</article>"));
  vi.stubGlobal("fetch", fetch);
  const response = await fetchPrimaryDetailed(
    "https://primary.example/article",
    ["primary.example", "www.primary.example"],
  );
  expect(response.url).toBe("https://www.primary.example/article/");
  expect(response.redirects).toHaveLength(1);
  expect(fetch).toHaveBeenCalledTimes(2);
});
it("distinguishes challenge redirects, maintenance, unverified hosts and empty200 responses without bypass", async () => {
  const cases = [
    {
      response: new Response("JS check", { status: 307 }),
      code: "redirect_without_location",
    },
    {
      response: new Response(null, {
        status: 303,
        headers: { location: "/maintenance-page-geo" },
      }),
      code: "source_maintenance_or_challenge",
    },
    {
      response: new Response(null, {
        status: 302,
        headers: { location: "https://unverified.example/" },
      }),
      code: "source_not_allowed",
    },
    { response: new Response(""), code: "source_empty" },
  ];
  for (const example of cases) {
    const fetch = vi.fn().mockResolvedValue(example.response);
    vi.stubGlobal("fetch", fetch);
    await expect(
      fetchPrimaryDetailed("https://primary.example/", ["primary.example"]),
    ).rejects.toMatchObject({ code: example.code });
    expect(fetch).toHaveBeenCalledOnce();
  }
});
