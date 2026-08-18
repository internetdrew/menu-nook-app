import { trpc } from "./trpc";

export const SETUP_QUERY_STALE_TIME_MS = 30_000;

export const storeForUserQueryOptions = () =>
  trpc.store.getForUser.queryOptions(undefined, {
    staleTime: SETUP_QUERY_STALE_TIME_MS,
  });
