import { http, HttpResponse } from "msw";

type TrpcResult = {
  result: {
    data: unknown;
  };
};

export function createTrpcQueryHandler(
  resolvers: Record<string, () => TrpcResult | Promise<TrpcResult>>,
) {
  return http.get("/trpc/*", async ({ request }) => {
    const url = new URL(request.url);
    const procedures = url.pathname.replace("/trpc/", "").split(",");

    const results = await Promise.all(
      procedures.map((procedure) => {
        const resolver = resolvers[procedure];

        if (!resolver) {
          console.warn(
            `No resolver for tRPC procedure "${procedure}", returning null`,
          );
          return { result: { data: null } };
        }

        return resolver();
      }),
    );

    return HttpResponse.json(procedures.length === 1 ? results[0] : results);
  });
}
