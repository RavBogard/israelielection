import { probeLifecycleSources } from "../../lib/election-lifecycle/probe";
console.log(
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      results: await probeLifecycleSources(),
    },
    null,
    2,
  ),
);
