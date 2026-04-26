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
  farmerPassport: FarmerPassport | null;
  lifecycleEvents: CampaignLifecycleEvent[];
};

export type FarmerPassport = {
  farmerWallet: string;
  totalCampaigns: number;
  successfulCampaigns: number;
  verifiedProofShare: number;
  averageTrustScore: number;
  averageHarvestConfirmationDays: number | null;
  reliabilityBadge: string;
  highlights: string[];
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
    onChainAddress: "2ui7zC3Dfsxq8uFvDA4XeA6rLKAxoM6iQhZtcuV8NfRa",
    farmerWallet: "AskarWallet11111111111111111111111111111111",
    title: "Akmola Wheat 2026",
    description:
      "Working-capital round for wheat cultivation with transparent payout logic after harvest.",
    cropType: "Wheat",
    region: "Akmola Region",
    totalSupply: 1000,
    tokensSold: 620,
    pricePerToken: 10_000_000,
    status: "ACTIVE",
    proofDocumentUrl: "https://agrotoken.kz/proof/wheat-akmola-2026.pdf",
    proofHash: "a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
    proofStatus: "VERIFIED",
    proofUploadedAt: "2026-01-10T12:00:00",
    proofVerifiedAt: "2026-01-12T15:30:00",
    proofVerifierWallet: "VerifyWallet111222333444555666777888999",
    tokenMintAddress: "JCzxaCFncjYCQeakpv3fNnWPXRfW8Hd3HC9LjoRkE8MD",
    vaultAddress: "7cjt6iSH7zuaJuk5ZGCxnJAeRDuQFtukQ2mgdTNC7ZpW",
    createdAt: "2026-01-15T00:00:00",
    harvestDate: "2026-09-15T00:00:00",
    riskScore: 35,
    riskExplanation: "AI model sees moderate campaign risk",
    trustScore: 74,
    trustLabel: "MEDIUM_TRUST",
    trustReasons: [
      "Proof document uploaded and verified",
      "AI model sees moderate campaign risk",
      "Farmer already has platform history",
    ],
    farmerPassport: {
      farmerWallet: "AskarWallet11111111111111111111111111111111",
      totalCampaigns: 3,
      successfulCampaigns: 1,
      verifiedProofShare: 67,
      averageTrustScore: 71,
      averageHarvestConfirmationDays: 204,
      reliabilityBadge: "SILVER",
      highlights: [
        "1 completed campaign reached payout distribution",
        "67% of campaigns have verified proof data",
        "Average trust score across campaigns: 71/100",
        "Average time to harvest confirmation: 204 days",
      ],
    },
    lifecycleEvents: [
      {
        type: "CAMPAIGN_CREATED",
        label: "Campaign created",
        description: "The campaign was created and its on-chain lifecycle started.",
        occurredAt: "2026-01-15T00:00:00",
        done: true,
        actorWallet: "AskarWallet11111111111111111111111111111111",
        explorerAddress: "2ui7zC3Dfsxq8uFvDA4XeA6rLKAxoM6iQhZtcuV8NfRa",
        referenceValue: "campaign",
      },
      {
        type: "PROOF_UPLOADED",
        label: "Proof uploaded",
        description: "A proof document was attached and its hash was linked to the campaign.",
        occurredAt: "2026-01-10T12:00:00",
        done: true,
        actorWallet: "AskarWallet11111111111111111111111111111111",
        explorerAddress: "2ui7zC3Dfsxq8uFvDA4XeA6rLKAxoM6iQhZtcuV8NfRa",
        referenceValue: "proof hash",
      },
      {
        type: "PROOF_VERIFIED",
        label: "Proof verified",
        description: "The uploaded document was checked and matched the real-world asset.",
        occurredAt: "2026-01-12T15:30:00",
        done: true,
        actorWallet: "VerifyWallet111222333444555666777888999",
        explorerAddress: "2ui7zC3Dfsxq8uFvDA4XeA6rLKAxoM6iQhZtcuV8NfRa",
        referenceValue: "verified",
      },
      {
        type: "FUNDED_25",
        label: "25% funded",
        description: "The campaign passed its first investor milestone.",
        occurredAt: "2026-01-18T10:00:00",
        done: true,
        actorWallet: null,
        explorerAddress: null,
        referenceValue: "25%",
      },
      {
        type: "FUNDED_50",
        label: "50% funded",
        description: "The campaign reached the midpoint of its funding target.",
        occurredAt: "2026-01-21T11:30:00",
        done: true,
        actorWallet: null,
        explorerAddress: null,
        referenceValue: "50%",
      },
      {
        type: "FUNDED_100",
        label: "100% funded",
        description: "The campaign fully sold its tokenized allocation.",
        occurredAt: null,
        done: false,
        actorWallet: null,
        explorerAddress: null,
        referenceValue: "100%",
      },
      {
        type: "HARVEST_CONFIRMED",
        label: "Harvest confirmed",
        description: "The harvest result was confirmed and the campaign moved toward payout.",
        occurredAt: null,
        done: false,
        actorWallet: null,
        explorerAddress: null,
        referenceValue: null,
      },
      {
        type: "PAYOUT_DISTRIBUTED",
        label: "Payout distributed",
        description: "Revenue distribution for token holders was finalized.",
        occurredAt: null,
        done: false,
        actorWallet: null,
        explorerAddress: null,
        referenceValue: null,
      },
    ],
  },
  {
    id: 2,
    onChainAddress: "4Gf6k8mDkZX1n5gQ8V1QkR1oQG4Tq6f8CBxL7Nw2sA9P",
    farmerWallet: "DanaWallet111111111111111111111111111111111",
    title: "Kostanay Barley 2026",
    description:
      "Seasonal barley campaign with proof documents and on-chain revenue distribution.",
    cropType: "Barley",
    region: "Kostanay Region",
    totalSupply: 1400,
    tokensSold: 1400,
    pricePerToken: 9_000_000,
    status: "FUNDED",
    proofDocumentUrl: "https://agrotoken.kz/proof/barley-kostanay-2026.pdf",
    proofHash: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    proofStatus: "UPLOADED",
    proofUploadedAt: "2026-02-05T09:15:00",
    proofVerifiedAt: null,
    proofVerifierWallet: null,
    tokenMintAddress: "5CeQYvDJ8i4vqfEw13x2Ta3A1ro2Y21CjHduTQYpLeFs",
    vaultAddress: "9cbwPiR4Ps8qY1jt6oQm1sQuR4PrN1K7JfS6vNhzV8DL",
    createdAt: "2026-02-03T00:00:00",
    harvestDate: "2026-10-01T00:00:00",
    riskScore: 48,
    riskExplanation: "AI model sees moderate campaign risk",
    trustScore: 56,
    trustLabel: "MEDIUM_TRUST",
    trustReasons: [
      "Proof document uploaded and awaiting review",
      "Funding traction is already visible",
      "Farmer already has platform history",
    ],
    farmerPassport: {
      farmerWallet: "DanaWallet111111111111111111111111111111111",
      totalCampaigns: 2,
      successfulCampaigns: 1,
      verifiedProofShare: 50,
      averageTrustScore: 56,
      averageHarvestConfirmationDays: 0,
      reliabilityBadge: "SILVER",
      highlights: [
        "1 completed campaign reached payout distribution",
        "50% of campaigns have verified proof data",
        "Average trust score across campaigns: 56/100",
        "Average time to harvest confirmation: 0 days",
      ],
    },
    lifecycleEvents: [],
  },
];

export function useCampaigns(farmerWallet?: string) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    const url = farmerWallet ? `/campaigns/farmer/${farmerWallet}` : "/campaigns";
    api
      .get<Campaign[]>(url)
      .then((response) => setCampaigns(response.data))
      .catch(() => setCampaigns(fallbackCampaigns))
      .finally(() => setLoading(false));
  }, [farmerWallet]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { campaigns, loading, refresh };
}
