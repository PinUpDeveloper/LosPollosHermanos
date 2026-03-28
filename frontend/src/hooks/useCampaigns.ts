"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export type Campaign = {
  id: number;
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
  harvestDate: string;
  farmerWallet: string;
};

const fallbackCampaigns: Campaign[] = [
  {
    id: 1,
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
    harvestDate: "2026-09-15T00:00:00",
    farmerWallet: "AskarWallet111"
  }
];

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Campaign[]>("/campaigns")
      .then((response) => setCampaigns(response.data))
      .catch(() => setCampaigns(fallbackCampaigns))
      .finally(() => setLoading(false));
  }, []);

  return { campaigns, loading };
}

