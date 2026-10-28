"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { ListShares } from "@/lib/list-status";

const Shares = createContext<ListShares | null>(null);

/** The server page reads the live count once and hands every list's vote share to the client tools beneath it. */
export function ListSharesProvider({ shares, children }: { shares: ListShares | null; children: ReactNode }) {
  return <Shares.Provider value={shares}>{children}</Shares.Provider>;
}
export const useListShares = () => useContext(Shares);
