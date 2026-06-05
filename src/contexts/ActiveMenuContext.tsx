import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { trpc } from "@/utils/trpc";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth";
import type { BusinessRecord, MenuRecord } from "@/types/menu";

interface MenuContextValue {
  business: BusinessRecord | null;
  menus: MenuRecord[];
  activeMenu: MenuRecord | null;
  activeMenuId: string | null;
  setActiveMenu: (r: MenuRecord) => void;
  loading: boolean;
}

const MenuContext = createContext<MenuContextValue | undefined>(undefined);
const ACTIVE_MENU_STORAGE_KEY = "activeMenuId";

const getStoredActiveMenuId = () => {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(ACTIVE_MENU_STORAGE_KEY);
};

export const MenuProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const { data: business, isLoading: businessLoading } = useQuery(
    trpc.business.getForUser.queryOptions(undefined, {
      enabled: !!user && !authLoading,
    }),
  );
  const [activeMenuId, setActiveMenuId] = useState<string | null>(
    getStoredActiveMenuId,
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
  const [activeMenu, setActiveMenuState] = useState<MenuRecord | null>(null);
  const [activeMenuResolved, setActiveMenuResolved] = useState(false);

  useEffect(() => {
    if (authLoading || businessLoading || isLoading) {
      setActiveMenuResolved(false);
      return;
    }

    if (!user) {
      setActiveMenuState(null);
      setActiveMenuResolved(true);
      setActiveMenuId(null);
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
      activeMenuId ?? getStoredActiveMenuId();

    const found =
      data.find((m) => savedId !== null && String(m.id) === savedId) ?? data[0];

    setActiveMenuState(found);
    setActiveMenuResolved(true);
    setActiveMenuId(String(found.id));
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_MENU_STORAGE_KEY, String(found.id));
    }
  }, [activeMenuId, authLoading, business, businessLoading, data, isLoading, user]);

  const setActiveMenu = useCallback((m: MenuRecord) => {
    setActiveMenuState(m);
    setActiveMenuResolved(true);
    setActiveMenuId(String(m.id));
    localStorage.setItem(ACTIVE_MENU_STORAGE_KEY, String(m.id));
  }, []);

  const loading =
    authLoading ||
    (!!user && businessLoading) ||
    (!!user && !!business && isLoading) ||
    !activeMenuResolved;

  const value: MenuContextValue = {
    business: business ?? null,
    menus: data ?? [],
    activeMenu,
    activeMenuId,
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
