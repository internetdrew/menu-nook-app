import App from "@/App";
import { MenuProvider } from "@/contexts/ActiveMenuContext";

export default function HomeRoute() {
  return (
    <MenuProvider>
      <App />
    </MenuProvider>
  );
}
