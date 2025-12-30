import { http, HttpResponse } from "msw";

type TrpcResult = {
  result: {
    data: unknown;
  };
};

export function createTrpcQueryHandler(
  resolvers: Record<string, () => TrpcResult>,
) {
  return http.get("/trpc/*", ({ request }) => {
    const url = new URL(request.url);
    const procedures = url.pathname.replace("/trpc/", "").split(",");

    return HttpResponse.json(
      procedures.map((procedure) => {
        const resolver = resolvers[procedure];
        if (!resolver) {
          throw new Error(`Missing tRPC mock for ${procedure}`);
        }
        return resolver();
      }),
    );
  });
}
