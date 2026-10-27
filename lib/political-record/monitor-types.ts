export type MonitorState =
  | "healthy_new"
  | "healthy_no_new"
  | "unconfigured"
  | "unavailable"
  | "stale"
  | "disputed"
  | "unknown"
  | "validation_gated"
  | "settled";
export type MonitorCheck = {
  id: string;
  scope: "reachability" | "render" | "source" | "platform";
  state: MonitorState;
  checkedAt: string;
  reasonCode: string;
  attempts: number;
  subjects: string[];
  location?: { country: string; city: string };
  httpStatus?: number | null;
  tlsAuthorized?: boolean | null;
  measurementIds?: string[];
};
export type MonitorReport = {
  schemaVersion: 1;
  runId: string;
  checkedAt: string;
  checks: MonitorCheck[];
  recovery: {
    policy: "bounded_read_only_retry";
    maxAttempts: 3;
    destructiveActions: false;
    messagesSent: false;
  };
};
export function safeCheck(check: MonitorCheck): MonitorCheck {
  if (
    !/^[a-zA-Z0-9:_./-]{1,180}$/.test(check.id) ||
    !Number.isFinite(Date.parse(check.checkedAt)) ||
    !["reachability", "render", "source", "platform"].includes(check.scope) ||
    ![
      "healthy_new",
      "healthy_no_new",
      "unconfigured",
      "unavailable",
      "stale",
      "disputed",
      "unknown",
      "validation_gated",
      "settled",
    ].includes(check.state) ||
    !/^[_a-z0-9]{1,100}$/.test(check.reasonCode) ||
    !Number.isInteger(check.attempts) ||
    check.attempts < 0 ||
    check.attempts > 3 ||
    !Array.isArray(check.subjects) ||
    check.subjects.length > 100 ||
    check.subjects.some((id) => !/^[a-zA-Z0-9:_./-]{1,180}$/.test(id))
  )
    throw new Error("monitor_check_invalid");
  return {
    id: check.id,
    scope: check.scope,
    state: check.state,
    checkedAt: new Date(check.checkedAt).toISOString(),
    reasonCode: check.reasonCode,
    attempts: check.attempts,
    subjects: [...check.subjects],
    ...(check.location &&
    /^[A-Z]{2}$/.test(check.location.country) &&
    /^[\p{L}\p{N} .,'’()-]{1,100}$/u.test(check.location.city)
      ? {
          location: {
            country: check.location.country,
            city: check.location.city,
          },
        }
      : {}),
    ...(Number.isInteger(check.httpStatus) &&
    check.httpStatus! >= 100 &&
    check.httpStatus! <= 599
      ? { httpStatus: check.httpStatus }
      : {}),
    ...(typeof check.tlsAuthorized === "boolean"
      ? { tlsAuthorized: check.tlsAuthorized }
      : {}),
    ...(check.measurementIds
      ? {
          measurementIds: check.measurementIds
            .filter((id) => /^[a-zA-Z0-9]{8,80}$/.test(id))
            .slice(0, 4),
        }
      : {}),
  };
}
export async function boundedReadRetry<T>(
  read: () => Promise<T>,
  acceptable: (value: T) => boolean,
  wait: (ms: number) => Promise<void> = (ms) =>
    new Promise((resolve) => setTimeout(resolve, ms)),
) {
  let value: T | undefined;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      value = await read();
      if (acceptable(value))
        return { value, attempts: attempt, recovered: attempt > 1 };
    } catch {
      /* Categorize unavailable without raw error details. */
    }
    if (attempt < 3) await wait(attempt === 1 ? 750 : 1500);
  }
  return { value, attempts: 3, recovered: false };
}
