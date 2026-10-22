import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { rescopeSession } from "./session-cache";

test("sign-in does not wait for a hanging active market request or reuse old profile data", { timeout: 2000 }, async () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const meKey = ["/api/auth/me"];
  qc.setQueryData(["/api/profiles", 1], { name: "Previous session" });
  let calls = 0, signal: AbortSignal | undefined;
  const observer = new QueryObserver(qc, {
    queryKey: ["/api/market/overview"],
    queryFn: ({ signal: currentSignal }) => { calls++; signal = currentSignal; return new Promise<never>(() => {}); },
  });
  const unsubscribe = observer.subscribe(() => {});
  const user = { id: 2, email: "hr@skilytics.demo", name: "Demo Employer", role: "hr" as const, organization: "Demo" };
  try {
    await rescopeSession(qc, meKey, user);
    assert.equal(signal?.aborted, true);
    assert.equal(calls, 1);
    assert.deepEqual(qc.getQueryData(meKey), user);
    assert.equal(qc.getQueryData(["/api/profiles", 1]), undefined);
    assert.equal(qc.getQueryCache().find({ queryKey: ["/api/market/overview"] }), undefined);
  } finally { unsubscribe(); qc.clear(); }
});
