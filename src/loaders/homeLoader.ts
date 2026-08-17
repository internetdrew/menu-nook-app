import { queryClient } from "@/utils/trpc";
import { storeForUserQueryOptions } from "@/utils/setupQueries";

export const homeLoader = async () => {
  await queryClient.ensureQueryData(storeForUserQueryOptions());

  return null;
};
