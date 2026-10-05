import channel from "../data/correction-channel.json";
import { expect, it } from "vitest";
import { correctionEmail, correctionHref, reportPage, reportAddress, reportText } from "./corrections";
it("preserves current tool assumptions and rejects unsafe prefilled addresses", () => {
  expect(reportPage("/compare?p=likud,shas#draft")).toBe("https://www.israelielection.org/compare?p=likud,shas#draft");
  expect(reportPage("javascript:alert(1)")).toBe("https://www.israelielection.org");
  expect(reportPage("https://elsewhere.test/page")).toBe("https://www.israelielection.org");
  expect(correctionHref("/polls")).toContain("url=https%3A");
});
it("prepares an honest report and enables email only for a valid configured address", () => {
  const report = { page: "/polls", claim: "A number", proposed: "A corrected number", evidence: "https://source.test" };
  expect(reportText(report)).toContain("claim has not yet been reviewed");
  expect(correctionEmail(null, report)).toBeNull();
  expect(correctionEmail("x@example.org?bcc=other", report)).toBeNull();
  expect(correctionEmail("reviewer@example.org", report)).toContain("mailto:reviewer@example.org?subject=");
});
it("uses the expressly approved public recipient and preserves the reader's contextual correction in an unsent draft", () => {
  expect(channel.email).toBe("daniel@centralreform.org");
  const link = correctionEmail(channel.email, { page: "/coalition-builder?with=likud,shas&support=utj&poll=avg#arrangement-result", claim: "The claim & number", proposed: "A proposed correction", evidence: "https://example.org/?a=1&b=2" });
  expect(link).not.toBeNull();
  const draft = new URL(link!);
  expect(draft.pathname).toBe("daniel@centralreform.org");
  expect(draft.searchParams.get("subject")).toBe("Correction: Israel Votes 2026");
  expect(draft.searchParams.get("body")).toContain("with=likud,shas&support=utj&poll=avg#arrangement-result");
  expect(draft.searchParams.get("body")).toContain("The claim & number");
  expect(draft.searchParams.get("body")).toContain("claim has not yet been reviewed");
  expect([...draft.searchParams.keys()]).toEqual(["subject", "body"]);
});

it("refreshes contextual page address on same-route history changes while preserving appropriate manual edits",()=>{
 const first=reportPage("/compare?p=likud,shas#draft"),second=reportPage("/polls?with=likud&synthetic=3.3#sensitivity");const edited={from:first,page:"https://www.israelielection.org/compare?p=likud,yashar#courts"};
 expect(reportAddress(first,null)).toBe(first);expect(reportAddress(first,edited)).toBe(edited.page);expect(reportAddress(second,edited)).toBe(second);expect(reportAddress(first,edited)).toBe(edited.page);
 expect(reportText({page:reportAddress(second,edited),claim:"A claim",proposed:"A fix",evidence:"A source"})).toContain("synthetic=3.3#sensitivity");expect(reportAddress("javascript:bad",edited)).toBe("https://www.israelielection.org");
});
