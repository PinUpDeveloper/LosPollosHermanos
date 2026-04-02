"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export type Investment = {
  id: number;
  campaignId: number;
  investorWallet: string;
  tokensAmount: number;
  usdcPaid: number;
  txSignature: string;
  createdAt: string;
};

export function usePortfolio(wallet: string | undefined) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    if (!wallet) {
      setInvestments([]);
      return;
    }
    setLoading(true);
    api
      .get<Investment[]>(`/investments/${wallet}`)
      .then((res) => setInvestments(res.data))
      .catch(() => setInvestments([]))
      .finally(() => setLoading(false));
  }, [wallet]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { investments, loading, refresh };
}
