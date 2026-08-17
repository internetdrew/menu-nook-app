import { NotFound } from "@/pages/NotFoundPage";

export function Component() {
  return (
    <NotFound
      title="Page Not Found"
      message="The page you're looking for does not exist."
      href="/"
      hrefText="Go back to Home"
    />
  );
}
