import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./auth";
import type { StorePreviewData, StoreRecord } from "@/types/store";
import { storeForUserQueryOptions } from "@/utils/setupQueries";
import { trpc } from "@/utils/trpc";

interface StoreContextValue {
  store: StoreRecord | null;
  storePreview: StorePreviewData | null;
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
  const { data: storePreview, isLoading: storePreviewLoading } = useQuery(
    trpc.store.getPreview.queryOptions(
      { storeId: store?.id ?? "" },
      { enabled: !!store?.id },
    ),
  );

  const loading =
    authLoading || (!!user && storeLoading) || (!!store && storePreviewLoading);

  const value: StoreContextValue = {
    store: store ?? null,
    storePreview: storePreview ?? null,
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
