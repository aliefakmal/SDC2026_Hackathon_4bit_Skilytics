import type { QueryClient, QueryKey } from "@tanstack/react-query";
import type { AuthUser } from "@workspace/api-client-react";

/** Cancel old-scope requests before publishing the new identity. No network refetch is awaited. */
export async function rescopeSession(qc: QueryClient, meKey: QueryKey, user: AuthUser | null) {
  const otherQueries = { predicate: (q: { queryKey: QueryKey }) => q.queryKey[0] !== meKey[0] };
  await qc.cancelQueries();
  qc.removeQueries(otherQueries);
  qc.setQueryData(meKey, user);
}
