import { createHash } from "node:crypto";
export function revalidatedResponse(
  request: Request,
  body: string,
  headers: HeadersInit = {},
  status = 200,
) {
  const outgoing = new Headers(headers);
  if (status !== 200) return new Response(body, { status, headers: outgoing });
  const etag = `"${createHash("sha256").update(body).digest("hex")}"`;
  outgoing.set("ETag", etag);
  outgoing.set("Cache-Control", "public,max-age=0,must-revalidate");
  const match = request.headers
    .get("if-none-match")
    ?.split(",")
    .map((value) => value.trim().replace(/^W\//, ""));
  return new Response(
    match?.includes(etag) || match?.includes("*") ? null : body,
    {
      status: match?.includes(etag) || match?.includes("*") ? 304 : 200,
      headers: outgoing,
    },
  );
}
export function revalidatedJson(
  request: Request,
  value: unknown,
  headers: HeadersInit = {},
) {
  return revalidatedResponse(request, JSON.stringify(value), {
    "Content-Type": "application/json; charset=utf-8",
    ...headers,
  });
}
