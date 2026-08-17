import { redirect } from "react-router";
import { getLoaderUser } from "@/utils/loaderAuth";

export const protectedLoader = async () => {
  const user = await getLoaderUser();

  if (!user) {
    throw redirect("/login");
  }

  return null;
};
