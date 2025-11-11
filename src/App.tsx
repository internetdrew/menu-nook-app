import { Outlet } from "react-router";
import { trpc } from "../utils/trpc";
import { useQuery } from "@tanstack/react-query";

function App() {
  const { data, isLoading } = useQuery(
    trpc.greeting.queryOptions({ intro: "Welcome to" }),
  );

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <Outlet />
    </div>
  );
}

export default App;
