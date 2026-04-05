"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { BuyTokenModal } from "@/components/BuyTokenModal";
import { StatusTimeline } from "@/components/StatusTimeline";
import { ProofOfAsset } from "@/components/ProofOfAsset";
import { SolanaVerificationPanel } from "@/components/SolanaVerificationPanel";
import { ProofTimeline } from "@/components/ProofTimeline";
import { FarmerPassportCard } from "@/components/FarmerPassportCard";
import { useCampaigns } from "@/hooks/useCampaigns";
import { api } from "@/lib/api";
import { buildBuyTokensIx, getOrCreateATA } from "@/lib/agrotoken";

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "Agro111111111111111111111111111111111111111"
);

export default function CampaignDetailsPage() {
  const params = useParams<{ id: string }>();
  const { campaigns, refresh } = useCampaigns();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [open, setOpen] = useState(false);
  const [txSig, setTxSig] = useState("");
  const campaign = campaigns.find((c) => String(c.id) === params.id) ?? campaigns[0];

  async function handleBuy(amount: number) {
    if (!campaign || !publicKey) {
      throw new Error("Подключите кошелёк Phantom");
    }
    if (!campaign.onChainAddress || !campaign.tokenMintAddress || !campaign.vaultAddress) {
      throw new Error("У кампании нет on-chain адресов");
    }

    const campaignPda = new PublicKey(campaign.onChainAddress);
    const tokenMint = new PublicKey(campaign.tokenMintAddress);
    const vault = new PublicKey(campaign.vaultAddress);
    const usdcMint = new PublicKey(
      process.env.NEXT_PUBLIC_USDC_MINT ?? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
    );

    // Get or create investor ATAs
    const usdcAta = await getOrCreateATA(connection, publicKey, usdcMint, publicKey);
    const tokenAta = await getOrCreateATA(connection, publicKey, tokenMint, publicKey);

    const tx = new Transaction();
    if (usdcAta.instruction) tx.add(usdcAta.instruction);
    if (tokenAta.instruction) tx.add(tokenAta.instruction);

    const buyIx = await buildBuyTokensIx({
      investor: publicKey,
      campaignPda,
      investorUsdcAccount: usdcAta.address,
      investorTokenAccount: tokenAta.address,
      vault,
      tokenMint,
      programId: PROGRAM_ID,
      amount,
    });
    tx.add(buyIx);

    const signature = await sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, "confirmed");
    setTxSig(signature);

    // Record investment in backend
    const usdcPaid = amount * campaign.pricePerToken;
    await api.post(`/investments/campaigns/${campaign.id}`, {
      investorWallet: publicKey.toBase58(),
      tokensAmount: amount,
      usdcPaid,
      txSignature: signature,
    });
    await api.post(`/campaigns/${campaign.id}/record-purchase`, {
      investorWallet: publicKey.toBase58(),
      tokensAmount: amount,
    });

    refresh();
  }

  if (!campaign) {
    return <div className="panel p-6">Кампания не найдена.</div>;
  }

  const remaining = campaign.totalSupply - campaign.tokensSold;
  const trustTone =
    (campaign.trustScore ?? 0) >= 80
      ? "bg-emerald-50 text-emerald-700"
      : (campaign.trustScore ?? 0) >= 60
        ? "bg-sky-50 text-sky-700"
        : "bg-orange-50 text-orange-700";
  const trustLabel =
    campaign.trustLabel === "HIGH_TRUST"
      ? "High Trust"
      : campaign.trustLabel === "MEDIUM_TRUST"
        ? "Medium Trust"
        : "Watch Carefully";

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="panel p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-bark">{campaign.region}</p>
        <h1 className="mt-2 font-display text-4xl">{campaign.title}</h1>
        <p className="mt-4 text-soil/75">{campaign.description}</p>

        <div className="mt-8">
          <StatusTimeline current={campaign.status} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-mist p-5">
            <p className="text-sm text-soil/60">Дата урожая</p>
            <p className="mt-2 text-lg">
              {new Date(campaign.harvestDate).toLocaleDateString("ru-RU")}
            </p>
          </div>
          <div className="rounded-3xl bg-mist p-5">
            <p className="text-sm text-soil/60">Культура</p>
            <p className="mt-2 text-lg">{campaign.cropType}</p>
          </div>
          {campaign.trustScore !== null && (
            <div className={`rounded-3xl p-5 ${trustTone}`}>
              <p className="text-sm text-soil/60">Trust Score</p>
              <p className="mt-2 text-3xl font-bold">{campaign.trustScore}/100</p>
              <p className="mt-2 text-sm font-medium">{trustLabel}</p>
            </div>
          )}
          {campaign.riskScore !== null && (
            <div
              className={`rounded-3xl p-5 ${
                campaign.riskScore <= 33
                  ? "bg-green-50"
                  : campaign.riskScore <= 66
                    ? "bg-yellow-50"
                    : "bg-red-50"
              }`}
            >
              <p className="text-sm text-soil/60">AI Risk Score</p>
              <p
                className={`mt-2 text-3xl font-bold ${
                  campaign.riskScore <= 33
                    ? "text-green-600"
                    : campaign.riskScore <= 66
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
              >
                {campaign.riskScore}/100
              </p>
              {campaign.riskExplanation && (
                <p className="mt-2 text-sm text-soil/70">{campaign.riskExplanation}</p>
              )}
            </div>
          )}
        </div>

        {campaign.trustReasons.length > 0 && (
          <div className="mt-4 rounded-3xl border border-bark/10 bg-mist/50 p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-soil/50">
              Why investors can trust this campaign
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {campaign.trustReasons.map((reason) => (
                <div key={reason} className="rounded-2xl bg-white px-4 py-3 text-sm text-soil/75">
                  {reason}
                </div>
              ))}
            </div>
          </div>
        )}

        {campaign.farmerPassport && (
          <div className="mt-6">
            <FarmerPassportCard passport={campaign.farmerPassport} />
          </div>
        )}

        {/* Campaign Lifecycle Timeline */}
        <div className="mt-8">
          <ProofTimeline campaign={campaign} />
        </div>

        {/* Proof-of-Asset Layer */}
        <div className="mt-8">
          <ProofOfAsset campaign={campaign} />
        </div>

        {/* Solana Verification Panel */}
        <div className="mt-8">
          <SolanaVerificationPanel campaign={campaign} />
        </div>

        <div className="mt-6 flex justify-between text-sm">
          <span>
            Продано: {campaign.tokensSold}/{campaign.totalSupply} токенов
          </span>
          <span>Осталось: {remaining}</span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-bark/10">
          <div
            className="h-2 rounded-full bg-leaf"
            style={{ width: `${Math.round((campaign.tokensSold / campaign.totalSupply) * 100)}%` }}
          />
        </div>
      </section>

      <aside className="panel space-y-4 p-8">
        <h2 className="font-display text-2xl">Инвестировать</h2>
        <p className="text-sm text-soil/70">
          Цена за токен: {(campaign.pricePerToken / 1_000_000).toLocaleString("ru-RU")} USDC
        </p>

        {campaign.status === "ACTIVE" && remaining > 0 ? (
          <button
            onClick={() => setOpen(true)}
            disabled={!publicKey}
            className="w-full rounded-2xl bg-leaf px-4 py-3 text-white disabled:opacity-50"
          >
            {publicKey ? "Купить токены" : "Подключите кошелёк"}
          </button>
        ) : (
          <p className="text-sm text-soil/60">
            {campaign.status !== "ACTIVE" ? "Кампания не принимает инвестиции" : "Все токены проданы"}
          </p>
        )}

        {txSig && (
          <div className="rounded-2xl bg-leaf/10 p-4">
            <p className="text-sm font-medium text-leaf">Транзакция подтверждена</p>
            <p className="mt-1 break-all text-xs font-mono">{txSig}</p>
          </div>
        )}
      </aside>

      <BuyTokenModal
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={handleBuy}
        pricePerToken={campaign.pricePerToken}
        remainingSupply={remaining}
      />
    </div>
  );
}
