"use client";

import { useState } from "react";
import { Campaign } from "@/hooks/useCampaigns";

const EXPLORER_BASE = "https://explorer.solana.com/address/";
const CLUSTER = "?cluster=devnet";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  FUNDED: "Funded",
  HARVEST_SOLD: "Harvest Sold",
  DISTRIBUTED: "Distributed",
  CANCELLED: "Cancelled",
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      onClick={handleCopy}
      title="Скопировать"
      className="shrink-0 rounded-lg p-1.5 text-soil/40 transition hover:bg-bark/10 hover:text-soil"
    >
      {copied ? (
        <svg className="h-4 w-4 text-leaf" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function ExplorerLink({ address }: { address: string }) {
  return (
    <a
      href={`${EXPLORER_BASE}${address}${CLUSTER}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Открыть в Solana Explorer"
      className="shrink-0 rounded-lg p-1.5 text-soil/40 transition hover:bg-bark/10 hover:text-soil"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

type RowProps = {
  label: string;
  value: string;
  isAddress?: boolean;
  mono?: boolean;
};

function VerificationRow({ label, value, isAddress, mono }: RowProps) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-3 border-b border-bark/8 py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-soil/45">{label}</p>
        <p className={`mt-1 break-all text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
      {isAddress && (
        <div className="flex shrink-0 gap-0.5 pt-4">
          <CopyButton value={value} />
          <ExplorerLink address={value} />
        </div>
      )}
      {!isAddress && mono && (
        <div className="flex shrink-0 gap-0.5 pt-4">
          <CopyButton value={value} />
        </div>
      )}
    </div>
  );
}

export function SolanaVerificationPanel({ campaign }: { campaign: Campaign }) {
  return (
    <div className="rounded-3xl border border-bark/15 bg-white p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195]">
          <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
          </svg>
        </div>
        <h3 className="font-display text-xl">Solana Verification</h3>
      </div>

      <p className="mt-2 text-sm text-soil/55">
        Все данные ниже хранятся on-chain и могут быть независимо проверены через Solana Explorer.
      </p>

      <div className="mt-4">
        <VerificationRow
          label="Campaign PDA"
          value={campaign.onChainAddress}
          isAddress
          mono
        />
        <VerificationRow
          label="Token Mint"
          value={campaign.tokenMintAddress}
          isAddress
          mono
        />
        <VerificationRow
          label="USDC Vault"
          value={campaign.vaultAddress}
          isAddress
          mono
        />
        <VerificationRow
          label="Status"
          value={STATUS_LABELS[campaign.status] ?? campaign.status}
        />
        <VerificationRow
          label="Total Supply"
          value={`${campaign.totalSupply.toLocaleString("ru-RU")} токенов`}
        />
        <VerificationRow
          label="Tokens Sold"
          value={`${campaign.tokensSold.toLocaleString("ru-RU")} / ${campaign.totalSupply.toLocaleString("ru-RU")}`}
        />
        <VerificationRow
          label="Proof Hash (on-chain)"
          value={campaign.proofHash}
          mono
        />
      </div>
    </div>
  );
}
