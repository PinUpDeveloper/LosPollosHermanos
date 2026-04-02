"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

export type Campaign = {
  id: number;
  onChainAddress: string;
  farmerWallet: string;
  title: string;
  description: string;
  cropType: string;
  region: string;
  totalSupply: number;
  tokensSold: number;
  pricePerToken: number;
  status: string;
  proofDocumentUrl: string;
  proofHash: string;
  tokenMintAddress: string;
  vaultAddress: string;
  createdAt: string;
  harvestDate: string;
};

const fallbackCampaigns: Campaign[] = [
  {
    id: 1,
    onChainAddress: "",
    farmerWallet: "AskarWallet111",
    title: "Пшеница Акмолинская 2026",
    description: "Финансирование сезонного урожая с прозрачным распределением прибыли.",
    cropType: "Пшеница",
    region: "Акмолинская область",
    totalSupply: 1000,
    tokensSold: 620,
    pricePerToken: 80000000,
    status: "ACTIVE",
    proofDocumentUrl: "#",
    proofHash: "demo-proof-hash",
    tokenMintAddress: "",
    vaultAddress: "",
    createdAt: "2026-01-15T00:00:00",
    harvestDate: "2026-09-15T00:00:00",
  },
];

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    api
      .get<Campaign[]>("/campaigns")
      .then((response) => setCampaigns(response.data))
      .catch(() => setCampaigns(fallbackCampaigns))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { campaigns, loading, refresh };
}
