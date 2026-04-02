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

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="panel p-8">
        <p className="text-sm uppercase tracking-[0.2em] text-bark">{campaign.region}</p>
        <h1 className="mt-2 font-display text-4xl">{campaign.title}</h1>
        <p className="mt-4 text-soil/75">{campaign.description}</p>

        <div className="mt-8">
          <StatusTimeline current={campaign.status} />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
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
        </div>

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
