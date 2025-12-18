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

type Menu = inferRouterOutputs<AppRouter>["menu"]["getAllForBusiness"][number];

interface MenuContextValue {
  menus: Menu[];
  activeMenu: Menu | null;
  setActiveMenu: (r: Menu) => void;
  loading: boolean;
}

const MenuContext = createContext<MenuContextValue | undefined>(undefined);

export const MenuProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { data: business, isLoading: businessLoading } = useQuery(
    trpc.business.getForUser.queryOptions(),
  );

  const { data, isLoading } = useQuery(
    trpc.menu.getAllForBusiness.queryOptions(
      {
        businessId: business?.id ?? "",
      },
      {
        enabled: !businessLoading && !!business,
      },
    ),
  );
  const [activeMenu, setActiveMenuState] = useState<Menu | null>(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const savedId =
      typeof window !== "undefined"
        ? localStorage.getItem("activeMenuId")
        : null;

    const savedIdNum = savedId ? Number(savedId) : null;
    const found =
      data.find((m) => savedIdNum !== null && m.id === savedIdNum) ?? data[0];
    setActiveMenuState(found);
  }, [data]);

  const setActiveMenu = useCallback((m: Menu) => {
    setActiveMenuState(m);
    localStorage.setItem("activeMenuId", String(m.id));
  }, []);

  const value: MenuContextValue = {
    menus: data ?? [],
    activeMenu,
    setActiveMenu,
    loading: isLoading,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};

export function useMenuContext() {
  const ctx = useContext(MenuContext);
  if (!ctx) throw new Error("useMenuContext must be used within MenuProvider");
  return ctx;
}
