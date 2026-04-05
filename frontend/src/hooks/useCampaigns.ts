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
  proofStatus: string;
  proofUploadedAt: string | null;
  proofVerifiedAt: string | null;
  proofVerifierWallet: string | null;
  tokenMintAddress: string;
  vaultAddress: string;
  createdAt: string;
  harvestDate: string;
  riskScore: number | null;
  riskExplanation: string | null;
  trustScore: number | null;
  trustLabel: string | null;
  trustReasons: string[];
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
    proofDocumentUrl: "https://agrotoken.kz/proof/wheat-akmola-2026.pdf",
    proofHash: "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
    proofStatus: "VERIFIED",
    proofUploadedAt: "2026-01-10T12:00:00",
    proofVerifiedAt: "2026-01-12T15:30:00",
    proofVerifierWallet: "OracleWallet111222333",
    tokenMintAddress: "",
    vaultAddress: "",
    createdAt: "2026-01-15T00:00:00",
    harvestDate: "2026-09-15T00:00:00",
    riskScore: 35,
    riskExplanation: "Умеренный риск: пшеница — стабильная культура, но Акмолинская область подвержена засухам в летний период.",
    trustScore: 74,
    trustLabel: "MEDIUM_TRUST",
    trustReasons: [
      "Proof-of-asset verified by oracle",
      "AI risk model sees moderate campaign risk",
      "Campaign already shows early investor traction",
    ],
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
