import { Webhook } from "svix";
import { configuredSubscriptions } from "./subscriptions";
import { sharedLimit, requestLimit } from "./rate-limit";
export async function subscriptionRoute(
  request: Request,
  action = "subscribe",
) {
  const headers = {
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  };
  if (process.env.SUBSCRIPTIONS_ENABLED !== "true")
    return Response.json({ error: "not_found" }, { status: 404, headers });
  let service: ReturnType<typeof configuredSubscriptions> = null;
  try {
    if (
      ![
        "subscribe",
        "confirm",
        "preferences",
        "unsubscribe",
        "webhook",
      ].includes(action)
    )
      return Response.json({ error: "not_found" }, { status: 404, headers });
    const limit =
      action === "webhook"
        ? await sharedLimit("subscriptions:webhook", 180, 60)
        : await requestLimit(
            request,
            "subscriptions:" + action,
            action === "subscribe" ? 30 : 180,
            action === "subscribe" ? 3 : 30,
            action === "subscribe" ? 3600 : 60,
            process.env.SUBSCRIPTION_TOKEN_SECRET ?? "",
          );
    if (!limit.allowed)
      return Response.json(
        { error: "rate_limited" },
        {
          status: 429,
          headers: { ...headers, "Retry-After": String(limit.retryAfter) },
        },
      );
    const text = await request.text();
    if (text.length > 8192)
      return Response.json(
        { error: "payload_too_large" },
        { status: 413, headers },
      );
    let data: Record<string, unknown>;
    if (action === "webhook") {
      const secret = process.env.RESEND_WEBHOOK_SECRET;
      if (!secret) throw new Error("unconfigured");
      try {
        new Webhook(secret).verify(text, {
          "svix-id": request.headers.get("svix-id") ?? "",
          "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
          "svix-signature": request.headers.get("svix-signature") ?? "",
        });
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        return Response.json(
          { error: "unauthorized" },
          { status: 401, headers },
        );
      }
    } else {
      // Browser-origin checks prevent blind cross-site form posts; bearer tokens are still independently scoped.
      const origin = request.headers.get("origin");
      if (
        action !== "unsubscribe" &&
        origin &&
        origin !== process.env.SUBSCRIPTION_SITE_ORIGIN?.replace(/\/$/, "")
      )
        return Response.json(
          { error: "origin_not_allowed" },
          { status: 403, headers },
        );
      if (action === "unsubscribe" && text === "List-Unsubscribe=One-Click")
        data = { token: new URL(request.url).searchParams.get("token") };
      else {
        try {
          data = JSON.parse(text);
        } catch {
          return Response.json(
            { error: "invalid_request" },
            { status: 400, headers },
          );
        }
      }
    }
    if (!data || typeof data !== "object" || Array.isArray(data))
      return Response.json(
        { error: "invalid_request" },
        { status: 400, headers },
      );
    service = configuredSubscriptions();
    if (!service)
      return Response.json(
        { error: "subscriptions_unavailable" },
        { status: 503, headers },
      );
    if (action === "subscribe")
      return Response.json(
        await service.subscribe(
          data.email,
          data.locale,
          data.topics,
          data.consent,
          undefined,
          { follows: data.follows, delivery: data.delivery },
        ),
        { status: 202, headers },
      );
    if (action === "webhook") {
      const event = data.data as { email_id?: unknown } | undefined;
      if (typeof data.type !== "string" || typeof event?.email_id !== "string")
        return Response.json(
          { error: "invalid_request" },
          { status: 400, headers },
        );
      return Response.json(
        await service.webhook(
          request.headers.get("svix-id")!,
          data.type,
          event.email_id,
        ),
        { headers },
      );
    }
    if (typeof data.token !== "string")
      return Response.json(
        { error: "invalid_token" },
        { status: 400, headers },
      );
    const result =
      action === "confirm"
        ? await service.confirm(data.token)
        : action === "unsubscribe"
          ? await service.unsubscribe(data.token)
          : await service.preferences(
              data.token,
              data.locale !== undefined ||
                data.topics !== undefined ||
                data.follows !== undefined ||
                data.delivery !== undefined
                ? {
                    locale: data.locale,
                    topics: data.topics,
                    follows: data.follows,
                    delivery: data.delivery,
                  }
                : undefined,
            );
    return Response.json(result, { headers });
  } catch (error) {
    const invalid = error instanceof Error && /^invalid_/.test(error.message);
    return Response.json(
      { error: invalid ? error.message : "subscriptions_unavailable" },
      { status: invalid ? 400 : 503, headers },
    );
  } finally {
    try {
      await service?.close();
    } catch {
      /* No connection details or private recipient state in responses. */
    }
  }
}
export async function runSubscriptionWorker() {
  const deadline = Date.now() + 45000;
  let service: ReturnType<typeof configuredSubscriptions> = null;
  try {
    service = configuredSubscriptions();
    if (!service) return { status: "unconfigured" };
    return {
      status: "processed",
      outbox: await service.processOutbox(),
      delivery: await service.deliver(new Date().toISOString(), 5, deadline),
    };
  } catch {
    return { status: "unavailable" };
  } finally {
    try {
      await service?.close();
    } catch {
      /* Cleanup cannot expose recipients or invalidate completed delivery receipts. */
    }
  }
}
