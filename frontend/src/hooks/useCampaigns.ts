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
  lifecycleEvents: CampaignLifecycleEvent[];
};

export type CampaignLifecycleEvent = {
  type: string;
  label: string;
  description: string;
  occurredAt: string | null;
  done: boolean;
  actorWallet: string | null;
  explorerAddress: string | null;
  referenceValue: string | null;
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
    lifecycleEvents: [
      {
        type: "CAMPAIGN_CREATED",
        label: "Campaign created",
        description: "The farmer created the campaign and the on-chain lifecycle started.",
        occurredAt: "2026-01-15T00:00:00",
        done: true,
        actorWallet: "AskarWallet111",
        explorerAddress: "",
        referenceValue: "",
      },
      {
        type: "PROOF_UPLOADED",
        label: "Proof uploaded",
        description: "Proof-of-asset document was attached and its hash was linked to the campaign.",
        occurredAt: "2026-01-10T12:00:00",
        done: true,
        actorWallet: "AskarWallet111",
        explorerAddress: "",
        referenceValue: "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
      },
      {
        type: "PROOF_VERIFIED",
        label: "Oracle verified proof",
        description: "The oracle or verifier confirmed that the uploaded proof matches the real-world asset.",
        occurredAt: "2026-01-12T15:30:00",
        done: true,
        actorWallet: "OracleWallet111222333",
        explorerAddress: "OracleWallet111222333",
        referenceValue: "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
      },
      {
        type: "FUNDED_25",
        label: "25% funded",
        description: "The campaign passed the first investor traction milestone.",
        occurredAt: "2026-01-18T10:00:00",
        done: true,
        actorWallet: null,
        explorerAddress: "",
        referenceValue: "25%",
      },
      {
        type: "FUNDED_50",
        label: "50% funded",
        description: "The campaign reached the midpoint of its funding target.",
        occurredAt: "2026-01-21T11:30:00",
        done: true,
        actorWallet: null,
        explorerAddress: "",
        referenceValue: "50%",
      },
      {
        type: "FUNDED_100",
        label: "100% funded",
        description: "The campaign fully sold its tokenized funding allocation.",
        occurredAt: null,
        done: false,
        actorWallet: null,
        explorerAddress: "",
        referenceValue: "100%",
      },
      {
        type: "HARVEST_CONFIRMED",
        label: "Harvest confirmed",
        description: "The harvest result was confirmed and the campaign moved toward payout.",
        occurredAt: null,
        done: false,
        actorWallet: null,
        explorerAddress: "",
        referenceValue: "ACTIVE",
      },
      {
        type: "PAYOUT_DISTRIBUTED",
        label: "Payout distributed",
        description: "Revenue distribution for token holders was finalized.",
        occurredAt: null,
        done: false,
        actorWallet: null,
        explorerAddress: "",
        referenceValue: "",
      },
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
