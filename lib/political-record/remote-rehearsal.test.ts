import { expect, it } from "vitest";
import {
  rehearsalRemoteRequest,
  rehearsalRemoteReceipt,
} from "./remote-rehearsal";
import { verifyQStash } from "../live-forecast/auth";
const origin = "https://israelielection-political-platform-preview.vercel.app";
const input = {
  url: origin + "/api/election-lifecycle/worker",
  subject: origin + "/api/election-lifecycle/worker",
  previewOrigin: origin,
  environment: "preview",
  mode: "platform_collect",
  key: "fake-fixture-key",
  bypass: "fake-preview-bypass",
};
it("signs only the exact owned preview subject and raw bounded body", () => {
  const now = Date.now(),
    request = rehearsalRemoteRequest(input, now);
  expect(
    verifyQStash(
      request.headers["Upstash-Signature"],
      request.body,
      input.subject,
      [input.key],
      now,
    ),
  ).toBe(true);
  expect(
    verifyQStash(
      request.headers["Upstash-Signature"],
      request.body,
      input.subject + "/wrong",
      [input.key],
      now,
    ),
  ).toBe(false);
  expect(request.body).toBe('{"mode":"platform_collect"}');
  expect(request.headers["x-vercel-protection-bypass"]).toBe(input.bypass);
});
it("allows only the operator-confirmed exact branch alias in addition to named preview aliases", () => {
  const branch =
    "https://israelielection-git-codex-political-d7a050-ravbogards-projects.vercel.app";
  const exact = {
    ...input,
    previewOrigin: branch,
    url: branch + "/api/election-lifecycle/worker",
    subject: branch + "/api/election-lifecycle/worker",
  };
  expect(rehearsalRemoteRequest(exact).destination).toBe(exact.url);
  const other = branch.replace("d7a050", "d7a051");
  expect(() =>
    rehearsalRemoteRequest({
      ...exact,
      previewOrigin: other,
      url: other + "/api/election-lifecycle/worker",
      subject: other + "/api/election-lifecycle/worker",
    }),
  ).toThrow("owned_preview_exact_subject_required");
});
it("rejects production, alternate hosts/subjects, URL secrets and email modes before emitting headers", () => {
  for (const patch of [
    { environment: "production" },
    { mode: "platform_deliver" },
    { url: "https://attacker.test/api/election-lifecycle/worker" },
    { subject: input.subject + "?secret=x" },
    { previewOrigin: "https://www.israelielection.org" },
    { url: input.url + "?secret=x", subject: input.subject + "?secret=x" },
  ])
    expect(() => rehearsalRemoteRequest({ ...input, ...patch })).toThrow();
});
it("receipt allowlist excludes generated claims, tokens, provider text and URL-bearing error values", () => {
  const receipt = rehearsalRemoteReceipt(200, {
    status: "review",
    more: true,
    content: "unpublished claim",
    token: "secret",
    errorCode: "https://provider.test/private",
    revisions: 2,
  });
  expect(receipt).toEqual({
    httpStatus: 200,
    status: "review",
    more: true,
    revisions: 2,
  });
});
it("requires audited primary-only recovery and signs its exact body", () => {
  const recovery = {
    jobId: `producer:primary:${"a".repeat(64)}:en`,
    operator: "Daniel",
    reason:
      "Typed CBS date and unit validator repaired; recover same blocked job",
  };
  const request = rehearsalRemoteRequest({
    ...input,
    mode: "platform_publish",
    recovery,
  });
  expect(JSON.parse(request.body)).toEqual({
    mode: "platform_publish",
    recovery,
  });
  expect(
    verifyQStash(
      request.headers["Upstash-Signature"],
      request.body,
      input.subject,
      [input.key],
    ),
  ).toBe(true);
  expect(() => rehearsalRemoteRequest({ ...input, recovery })).toThrow(
    "producer_recovery_audit_required",
  );
  expect(() =>
    rehearsalRemoteRequest({
      ...input,
      mode: "platform_publish",
      recovery: { ...recovery, reason: "" },
    }),
  ).toThrow();
});
