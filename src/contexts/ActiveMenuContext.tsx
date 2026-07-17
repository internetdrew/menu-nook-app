import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth";
import type { BusinessRecord, MenuRecord } from "@/types/menu";
import {
  businessForUserQueryOptions,
  menusForBusinessQueryOptions,
} from "@/utils/setupQueries";

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
const EMPTY_MENUS: MenuRecord[] = [];

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
  const { data: business, isLoading: businessLoading } = useQuery({
    ...businessForUserQueryOptions(),
    enabled: !!user && !authLoading,
  });
  const [activeMenuId, setActiveMenuId] = useState<string | null>(
    getStoredActiveMenuId,
  );
  const [activeMenuOverride, setActiveMenuOverride] =
    useState<MenuRecord | null>(null);

  const { data, isLoading } = useQuery({
    ...menusForBusinessQueryOptions(business?.id ?? ""),
    enabled: !!user && !authLoading && !businessLoading && !!business,
  });

  const menus = data ?? EMPTY_MENUS;
  const activeMenu = useMemo(() => {
    if (!business || menus.length === 0) {
      return null;
    }

    if (
      activeMenuOverride &&
      activeMenuId !== null &&
      String(activeMenuOverride.id) === activeMenuId &&
      menus.some((menu) => String(menu.id) === activeMenuId)
    ) {
      return activeMenuOverride;
    }

    return (
      menus.find(
        (menu) => activeMenuId !== null && String(menu.id) === activeMenuId,
      ) ?? menus[0]
    );
  }, [activeMenuId, activeMenuOverride, business, menus]);

  useEffect(() => {
    if (!user) {
      setActiveMenuOverride(null);
      setActiveMenuId(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem(ACTIVE_MENU_STORAGE_KEY);
      }
      return;
    }

    if (!business || menus.length === 0) {
      setActiveMenuOverride(null);
      return;
    }

    if (!activeMenu) return;

    const nextActiveMenuId = String(activeMenu.id);
    setActiveMenuId(nextActiveMenuId);
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_MENU_STORAGE_KEY, nextActiveMenuId);
    }
  }, [activeMenu, business, menus.length, user]);

  const setActiveMenu = useCallback((m: MenuRecord) => {
    setActiveMenuOverride(m);
    setActiveMenuId(String(m.id));
    localStorage.setItem(ACTIVE_MENU_STORAGE_KEY, String(m.id));
  }, []);

  const loading =
    authLoading ||
    (!!user && businessLoading) ||
    (!!user && !!business && isLoading);

  const value: MenuContextValue = {
    business: business ?? null,
    menus,
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
