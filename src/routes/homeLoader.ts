import { redirect } from "react-router";
import { queryClient } from "@/utils/trpc";
import { getLoaderUser } from "@/utils/loaderAuth";
import {
  businessForUserQueryOptions,
  menusForBusinessQueryOptions,
} from "@/utils/setupQueries";

export const homeLoader = async () => {
  const user = await getLoaderUser();

  if (!user) {
    throw redirect("/login");
  }

  const business = await queryClient.ensureQueryData(
    businessForUserQueryOptions(),
  );

  if (business) {
    await queryClient.ensureQueryData(menusForBusinessQueryOptions(business.id));
  }

  return null;
};
