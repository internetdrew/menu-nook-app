import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { trpc } from "@/utils/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../server";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth";

type Menu = inferRouterOutputs<AppRouter>["menu"]["getAllForBusiness"][number];

interface MenuContextValue {
  menus: Menu[];
  activeMenu: Menu | null;
  setActiveMenu: (r: Menu) => void;
  loading: boolean;
}

const MenuContext = createContext<MenuContextValue | undefined>(undefined);
const ACTIVE_MENU_STORAGE_KEY = "activeMenuId";

export const MenuProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const { data: business, isLoading: businessLoading } = useQuery(
    trpc.business.getForUser.queryOptions(undefined, {
      enabled: !!user && !authLoading,
    }),
  );

  const { data, isLoading } = useQuery(
    trpc.menu.getAllForBusiness.queryOptions(
      {
        businessId: business?.id ?? "",
      },
      {
        enabled: !!user && !authLoading && !businessLoading && !!business,
      },
    ),
  );
  const [activeMenu, setActiveMenuState] = useState<Menu | null>(null);
  const [activeMenuResolved, setActiveMenuResolved] = useState(false);

  useEffect(() => {
    if (authLoading || businessLoading || isLoading) {
      setActiveMenuResolved(false);
      return;
    }

    if (!user) {
      setActiveMenuState(null);
      setActiveMenuResolved(true);
      if (typeof window !== "undefined") {
        localStorage.removeItem(ACTIVE_MENU_STORAGE_KEY);
      }
      return;
    }

    if (!business || !data || data.length === 0) {
      setActiveMenuState(null);
      setActiveMenuResolved(true);
      return;
    }

    const savedId =
      typeof window !== "undefined"
        ? localStorage.getItem(ACTIVE_MENU_STORAGE_KEY)
        : null;

    const found =
      data.find((m) => savedId !== null && String(m.id) === savedId) ?? data[0];

    setActiveMenuState(found);
    setActiveMenuResolved(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_MENU_STORAGE_KEY, String(found.id));
    }
  }, [authLoading, business, businessLoading, data, isLoading, user]);

  const setActiveMenu = useCallback((m: Menu) => {
    setActiveMenuState(m);
    setActiveMenuResolved(true);
    localStorage.setItem(ACTIVE_MENU_STORAGE_KEY, String(m.id));
  }, []);

  const loading =
    authLoading ||
    (!!user && businessLoading) ||
    (!!user && !!business && isLoading) ||
    !activeMenuResolved;

  const value: MenuContextValue = {
    menus: data ?? [],
    activeMenu,
    setActiveMenu,
    loading,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};

export function useMenuContext() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenuContext must be used within MenuProvider");
  return ctx;
}
