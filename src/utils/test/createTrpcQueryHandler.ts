import { http, HttpResponse } from "msw";

type TrpcResult = {
  result: {
    data: unknown;
  };
};

type TrpcResolver = (input: unknown) => TrpcResult | Promise<TrpcResult>;

const parseInput = (url: URL) => {
  const input = url.searchParams.get("input");

  if (!input) {
    return undefined;
  }

  try {
    return JSON.parse(input);
  } catch {
    return undefined;
  }
};

export function createTrpcQueryHandler(
  resolvers: Record<string, TrpcResolver>,
) {
  return http.get("/trpc/*", async ({ request }) => {
    const url = new URL(request.url);
    const procedures = url.pathname.replace("/trpc/", "").split(",");
    const input = parseInput(url);

    const results = await Promise.all(
      procedures.map((procedure, index) => {
        const resolver = resolvers[procedure];

        if (!resolver) {
          return { result: { data: null } };
        }

        if (Array.isArray(input)) {
          return resolver(input[index]?.json);
        }

        if (
          input &&
          typeof input === "object" &&
          index.toString() in input
        ) {
          return resolver((input as Record<string, { json?: unknown }>)[index].json);
        }

        return resolver((input as { json?: unknown } | undefined)?.json);
      }),
    );

    return HttpResponse.json(procedures.length === 1 ? results[0] : results);
  });
}
