"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";

interface DashboardHeaderActionsContextValue {
  actions: ReactNode;
  setActions: (actions: ReactNode) => void;
}

const DashboardHeaderActionsContext =
  createContext<DashboardHeaderActionsContextValue | null>(null);

export function DashboardHeaderActionsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [actions, setActions] = useState<ReactNode>(null);

  const value = useMemo(
    () => ({
      actions,
      setActions,
    }),
    [actions],
  );

  return (
    <DashboardHeaderActionsContext.Provider value={value}>
      {children}
    </DashboardHeaderActionsContext.Provider>
  );
}

export function useDashboardHeaderActions() {
  const context = useContext(DashboardHeaderActionsContext);

  if (!context) {
    throw new Error(
      "useDashboardHeaderActions must be used within DashboardHeaderActionsProvider",
    );
  }

  return context;
}