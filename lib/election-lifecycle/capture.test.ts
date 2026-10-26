import { expect, it } from "vitest";
import { validatePrimaryCapture } from "./capture";
it("requires verified primary hosts and exact captured URL provenance, rejecting test captures", () => {
  const sourceUrl = "https://cdn-votes26.bechirot.gov.il/nationalresults";
  const capture = JSON.stringify({
    sourceUrl,
    html: "<h1>Official source capture</h1>",
  });
  expect(validatePrimaryCapture(capture, sourceUrl).isCEC).toBe(true);
  expect(() => validatePrimaryCapture(capture, "https://example.org/")).toThrow(
    "publisher_not_verified",
  );
  expect(() =>
    validatePrimaryCapture(capture, sourceUrl + "?different=true"),
  ).toThrow("capture_url_mismatch");
  expect(() =>
    validatePrimaryCapture(
      "<article>unsupported provenance</article>",
      sourceUrl,
    ),
  ).toThrow("capture_exact_url_required");
  expect(() =>
    validatePrimaryCapture(
      JSON.stringify({ sourceUrl, html: "<p>סביבת בדיקות</p>" }),
      sourceUrl,
    ),
  ).toThrow("capture_invalid_or_test");
});
