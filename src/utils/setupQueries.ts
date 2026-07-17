import { trpc } from "./trpc";

export const SETUP_QUERY_STALE_TIME_MS = 30_000;

export const businessForUserQueryOptions = () =>
  trpc.business.getForUser.queryOptions(undefined, {
    staleTime: SETUP_QUERY_STALE_TIME_MS,
  });

export const menusForBusinessQueryOptions = (businessId: string) =>
  trpc.menu.getAllForBusiness.queryOptions(
    { businessId },
    {
      enabled: !!businessId,
      staleTime: SETUP_QUERY_STALE_TIME_MS,
    },
  );
