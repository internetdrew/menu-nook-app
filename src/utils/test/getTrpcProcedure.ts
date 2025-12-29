export const getTrpcProcedure = (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace("/trpc/", "");
  return path.split(",");
};
