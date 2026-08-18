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

const parseBody = async (request: Request) => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};

const getInputAtIndex = (input: unknown, index: number) => {
  if (Array.isArray(input)) {
    const value = input[index];

    if (value && typeof value === "object" && "json" in value) {
      return (value as { json?: unknown }).json;
    }

    return value;
  }

  if (input && typeof input === "object" && index.toString() in input) {
    const value = (input as Record<string, unknown>)[index];

    if (value && typeof value === "object" && "json" in value) {
      return (value as { json?: unknown }).json;
    }

    return value;
  }

  if (input && typeof input === "object" && "json" in input) {
    return (input as { json?: unknown }).json;
  }

  return input;
};

export function createTrpcQueryHandler(
  resolvers: Record<string, TrpcResolver>,
) {
  const handleRequest = async (request: Request, input: unknown) => {
    const url = new URL(request.url);
    const procedures = url.pathname.replace("/trpc/", "").split(",");

    const results = await Promise.all(
      procedures.map((procedure, index) => {
        const resolver = resolvers[procedure];

        if (!resolver) {
          return { result: { data: null } };
        }

        return resolver(getInputAtIndex(input, index));
      }),
    );

    return HttpResponse.json(procedures.length === 1 ? results[0] : results);
  };

  return http.all("/trpc/*", async ({ request }) => {
    const input =
      request.method === "GET"
        ? parseInput(new URL(request.url))
        : await parseBody(request);

    return handleRequest(request, input);
  });
}
