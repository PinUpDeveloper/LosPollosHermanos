"use client";

import { useState } from "react";
import { Campaign } from "@/hooks/useCampaigns";
import { useI18n } from "@/lib/i18n";

const EXPLORER_BASE = "https://explorer.solana.com/address/";
const CLUSTER = "?cluster=devnet";

function CopyButton({ value, title }: { value: string; title: string }) {
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
      title={title}
      className="shrink-0 rounded-lg p-1.5 text-soil/40 transition hover:bg-bark/10 hover:text-soil"
    >
      {copied ? (
        <svg className="h-4 w-4 text-leaf" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}

function ExplorerLink({ address, title }: { address: string; title: string }) {
  return (
    <a
      href={`${EXPLORER_BASE}${address}${CLUSTER}`}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="shrink-0 rounded-lg p-1.5 text-soil/40 transition hover:bg-bark/10 hover:text-soil"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </a>
  );
}

export function SolanaVerificationPanel({ campaign }: { campaign: Campaign }) {
  const { language, translateStatus, formatNumber } = useI18n();

  const text =
    language === "ru"
      ? {
          title: "Проверка в Solana",
          subtitle:
            "Все значения ниже хранятся on-chain и могут быть независимо проверены через Solana Explorer.",
          campaignPda: "Адрес кампании (PDA)",
          tokenMint: "Адрес выпуска токена",
          vault: "Хранилище USDC",
          status: "Статус",
          totalSupply: "Общий объём",
          tokensSold: "Продано токенов",
          proofHash: "Хеш подтверждения актива",
          copy: "Скопировать",
          open: "Открыть в Solana Explorer",
          tokens: "токенов",
        }
      : language === "kk"
        ? {
            title: "Solana тексеруі",
            subtitle:
              "Төмендегі барлық мәндер on-chain сақталады және оларды Solana Explorer арқылы тәуелсіз тексеруге болады.",
            campaignPda: "Кампания адресі (PDA)",
            tokenMint: "Токен шығару адресі",
            vault: "USDC қоймасы",
            status: "Күйі",
            totalSupply: "Жалпы көлем",
            tokensSold: "Сатылған токендер",
            proofHash: "Активті растау hash-і",
            copy: "Көшіру",
            open: "Solana Explorer-де ашу",
            tokens: "токен",
          }
        : {
            title: "Solana verification",
            subtitle:
              "All values below are stored on-chain and can be independently verified in Solana Explorer.",
            campaignPda: "Campaign address (PDA)",
            tokenMint: "Token mint address",
            vault: "USDC vault",
            status: "Status",
            totalSupply: "Total supply",
            tokensSold: "Tokens sold",
            proofHash: "Proof hash",
            copy: "Copy",
            open: "Open in Solana Explorer",
            tokens: "tokens",
          };

  return (
    <div className="panel p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-soil text-white shadow-[0_10px_20px_rgba(31,42,35,0.16)]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.102 1.101" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-[-0.02em] text-soil">{text.title}</h3>
          <p className="mt-1 text-sm text-soil/58">{text.subtitle}</p>
        </div>
      </div>

      <div className="mt-5">
        <VerificationRow
          label={text.campaignPda}
          value={campaign.onChainAddress}
          action={
            campaign.onChainAddress ? (
              <>
                <CopyButton value={campaign.onChainAddress} title={text.copy} />
                <ExplorerLink address={campaign.onChainAddress} title={text.open} />
              </>
            ) : null
          }
          mono
        />
        <VerificationRow
          label={text.tokenMint}
          value={campaign.tokenMintAddress}
          action={
            campaign.tokenMintAddress ? (
              <>
                <CopyButton value={campaign.tokenMintAddress} title={text.copy} />
                <ExplorerLink address={campaign.tokenMintAddress} title={text.open} />
              </>
            ) : null
          }
          mono
        />
        <VerificationRow
          label={text.vault}
          value={campaign.vaultAddress}
          action={
            campaign.vaultAddress ? (
              <>
                <CopyButton value={campaign.vaultAddress} title={text.copy} />
                <ExplorerLink address={campaign.vaultAddress} title={text.open} />
              </>
            ) : null
          }
          mono
        />
        <VerificationRow label={text.status} value={translateStatus(campaign.status)} />
        <VerificationRow label={text.totalSupply} value={`${formatNumber(campaign.totalSupply)} ${text.tokens}`} />
        <VerificationRow
          label={text.tokensSold}
          value={`${formatNumber(campaign.tokensSold)} / ${formatNumber(campaign.totalSupply)}`}
        />
        <VerificationRow
          label={text.proofHash}
          value={campaign.proofHash}
          action={campaign.proofHash ? <CopyButton value={campaign.proofHash} title={text.copy} /> : null}
          mono
        />
      </div>
    </div>
  );
}

function VerificationRow({
  label,
  value,
  action,
  mono,
}: {
  label: string;
  value: string;
  action?: React.ReactNode;
  mono?: boolean;
}) {
  if (!value) return null;

  return (
    <div className="flex items-start justify-between gap-3 border-b border-bark/8 py-3.5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-[0.22em] text-soil/45">{label}</p>
        <p className={`mt-1.5 break-all text-sm text-soil ${mono ? "font-mono" : ""}`}>{value}</p>
      </div>
      {action && <div className="flex shrink-0 gap-0.5 pt-4">{action}</div>}
    </div>
  );
}
