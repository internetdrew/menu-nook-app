import App from "@/App";
import { StoreProvider } from "@/contexts/StoreContext";

export default function HomeRoute() {
  return (
    <StoreProvider>
      <App />
    </StoreProvider>
  );
}
