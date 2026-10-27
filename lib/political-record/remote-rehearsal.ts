import { createHash, createHmac, randomUUID } from "node:crypto";
export function rehearsalRemoteRequest(
  input: {
    url: string;
    subject: string;
    previewOrigin: string;
    environment: string;
    mode: string;
    key: string;
    bypass?: string;
  },
  now = Date.now(),
) {
  const destination = new URL(input.url),
    subject = new URL(input.subject),
    origin = new URL(input.previewOrigin);
  const confirmedBranchHost =
    "israelielection-git-codex-political-d7a050-ravbogards-projects.vercel.app";
  if (
    input.environment !== "preview" ||
    origin.protocol !== "https:" ||
    !(
      origin.hostname === confirmedBranchHost ||
      /^israelielection-[a-z0-9-]*preview\.vercel\.app$/.test(origin.hostname)
    ) ||
    origin.username ||
    origin.password ||
    origin.search ||
    origin.hash ||
    origin.port ||
    origin.pathname !== "/" ||
    destination.origin !== origin.origin ||
    destination.pathname !== "/api/election-lifecycle/worker" ||
    destination.username ||
    destination.password ||
    destination.search ||
    destination.hash ||
    subject.href !== destination.href
  )
    throw Error("owned_preview_exact_subject_required");
  if (
    !["platform_collect", "platform_publish"].includes(input.mode) ||
    !input.key
  )
    throw Error("rehearsal_mode_or_key_invalid");
  const body = JSON.stringify({ mode: input.mode }),
    time = Math.floor(now / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: "Upstash",
      sub: subject.href,
      nbf: time - 5,
      exp: time + 90,
      jti: randomUUID(),
      body: createHash("sha256").update(body).digest("base64url"),
    }),
  ).toString("base64url");
  const signature = createHmac("sha256", input.key)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return {
    destination: destination.href,
    body,
    headers: {
      "Content-Type": "application/json",
      "Upstash-Signature": `${header}.${payload}.${signature}`,
      ...(input.bypass ? { "x-vercel-protection-bypass": input.bypass } : {}),
    },
  };
}
export function rehearsalRemoteReceipt(status: number, body: unknown) {
  const value =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  return {
    httpStatus: status,
    ...Object.fromEntries(
      [
        "status",
        "errorCode",
        "error",
        "seriesId",
        "observations",
        "revisions",
        "privateArchive",
        "more",
      ]
        .filter(
          (key) =>
            typeof value[key] === "number" ||
            typeof value[key] === "boolean" ||
            (typeof value[key] === "string" &&
              /^[a-z0-9_]{1,80}$/.test(value[key] as string)),
        )
        .map((key) => [key, value[key]]),
    ),
  };
}
