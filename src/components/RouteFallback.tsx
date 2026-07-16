import { Spinner } from "./ui/spinner";

export function RouteFallback() {
  return (
    <div className="grid h-dvh w-full place-items-center">
      <Spinner className="size-6 text-pink-600" />
    </div>
  );
}
