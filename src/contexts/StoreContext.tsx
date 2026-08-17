import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth";
import type { StoreRecord } from "@/types/store";
import { storeForUserQueryOptions } from "@/utils/setupQueries";

interface StoreContextValue {
  store: StoreRecord | null;
  storeId: string | null;
  loading: boolean;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export const StoreProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const { user, isLoading: authLoading } = useAuth();
  const { data: store, isLoading: storeLoading } = useQuery({
    ...storeForUserQueryOptions(),
    enabled: !!user && !authLoading,
  });

  const loading = authLoading || (!!user && storeLoading);

  const value: StoreContextValue = {
    store: store ?? null,
    storeId: store?.id ?? null,
    loading,
  };

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
};

export function useStoreContext() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStoreContext must be used within StoreProvider");
  return ctx;
}
