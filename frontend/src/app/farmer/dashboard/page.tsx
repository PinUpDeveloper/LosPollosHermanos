"use client";

import { FormEvent, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { useCampaigns, Campaign } from "@/hooks/useCampaigns";
import { api } from "@/lib/api";
import {
  buildCreateCampaignTx,
  buildConfirmHarvestIx,
  buildDistributeIx,
  getOrCreateATA,
} from "@/lib/agrotoken";
import { StatusTimeline } from "@/components/StatusTimeline";

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "Agro111111111111111111111111111111111111111"
);
const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT ?? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);
const ORACLE = new PublicKey(
  process.env.NEXT_PUBLIC_ORACLE_WALLET ?? "11111111111111111111111111111111"
);

export default function FarmerDashboardPage() {
  const { campaigns, refresh } = useCampaigns();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cropType, setCropType] = useState("Пшеница");
  const [region, setRegion] = useState("Акмолинская область");
  const [totalSupply, setTotalSupply] = useState(1000);
  const [pricePerToken, setPricePerToken] = useState(10);
  const [proofHash, setProofHash] = useState("");
  const [harvestDate, setHarvestDate] = useState("2026-10-01");

  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [lastTx, setLastTx] = useState("");

  const farmerCampaigns = campaigns.filter(
    (c) => publicKey && c.farmerWallet === publicKey.toBase58()
  );

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!publicKey) {
      setError("Подключите кошелёк");
      return;
    }

    setBusy("create");
    try {
      // 1. Register campaign in backend (derives PDA addresses)
      const res = await api.post("/campaigns", {
        farmerWallet: publicKey.toBase58(),
        title,
        description: description || "Токенизированный урожай",
        cropType,
        region,
        totalSupply,
        pricePerToken: pricePerToken * 1_000_000, // convert USDC to lamports
        proofDocumentUrl: "https://agrotoken.kz/proof",
        proofHash: proofHash || "0".repeat(64),
        harvestDate: `${harvestDate}T00:00:00`,
      });

      // 2. Build on-chain create_campaign tx
      const campaignId = res.data.id as number;
      const hashBytes = new Uint8Array(32);
      const hexHash = proofHash.replace(/[^0-9a-fA-F]/g, "").slice(0, 64);
      for (let i = 0; i < hexHash.length; i += 2) {
        hashBytes[i / 2] = parseInt(hexHash.substring(i, i + 2), 16);
      }

      const { tx } = await buildCreateCampaignTx({
        farmer: publicKey,
        oracle: ORACLE,
        usdcMint: USDC_MINT,
        programId: PROGRAM_ID,
        campaignId,
        title,
        description: description || "Токенизированный урожай",
        totalSupply,
        pricePerToken: pricePerToken * 1_000_000,
        proofHash: hashBytes,
      });

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");
      setLastTx(signature);

      setTitle("");
      setDescription("");
      setProofHash("");
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка создания кампании");
    } finally {
      setBusy("");
    }
  }

  async function handleConfirmHarvest(campaign: Campaign) {
    if (!publicKey) return;
    setError("");
    setBusy(`confirm-${campaign.id}`);
    try {
      const revenue = prompt("Введите общую выручку от продажи урожая (USDC):");
      if (!revenue) return;
      const harvestUsdc = Math.floor(parseFloat(revenue) * 1_000_000);

      const ix = await buildConfirmHarvestIx({
        authority: publicKey,
        campaignPda: new PublicKey(campaign.onChainAddress),
        programId: PROGRAM_ID,
        harvestTotalUsdc: harvestUsdc,
      });

      const tx = new Transaction().add(ix);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");
      setLastTx(signature);

      // Update backend status
      await api.post(`/campaigns/${campaign.id}/confirm`, {
        authorityWallet: publicKey.toBase58(),
        harvestTotalUsdc: harvestUsdc,
      });

      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка подтверждения сбора");
    } finally {
      setBusy("");
    }
  }

  async function handleDistribute(campaign: Campaign) {
    if (!publicKey) return;
    setError("");
    setBusy(`distribute-${campaign.id}`);
    try {
      // Get holders from backend
      const holdersRes = await api.get<
        Array<{ investorWallet: string; tokensAmount: number }>
      >(`/campaigns/${campaign.id}/holders`);

      const tokenMint = new PublicKey(campaign.tokenMintAddress);
      const holders = [];

      for (const h of holdersRes.data) {
        const holderPk = new PublicKey(h.investorWallet);
        const tokenAta = await getOrCreateATA(connection, publicKey, tokenMint, holderPk);
        const usdcAta = await getOrCreateATA(connection, publicKey, USDC_MINT, holderPk);
        holders.push({
          tokenAccount: tokenAta.address,
          usdcAccount: usdcAta.address,
        });
      }

      const ix = await buildDistributeIx({
        authority: publicKey,
        campaignPda: new PublicKey(campaign.onChainAddress),
        tokenMint,
        vault: new PublicKey(campaign.vaultAddress),
        programId: PROGRAM_ID,
        holders,
      });

      const tx = new Transaction().add(ix);
      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");
      setLastTx(signature);

      await api.post(`/campaigns/${campaign.id}/mark-distributed`);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка распределения");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
      <div className="space-y-6">
        <form onSubmit={handleCreate} className="panel space-y-4 p-8">
          <h1 className="font-display text-3xl">Кабинет фермера</h1>
          {!publicKey && (
            <p className="text-sm text-red-600">Подключите Phantom кошелёк</p>
          )}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Название кампании"
            required
            className="w-full rounded-2xl border border-bark/20 px-4 py-3"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Описание"
            className="w-full rounded-2xl border border-bark/20 px-4 py-3"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="rounded-2xl border border-bark/20 px-4 py-3"
            >
              <option>Пшеница</option>
              <option>Ячмень</option>
              <option>Подсолнечник</option>
              <option>Рапс</option>
            </select>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="rounded-2xl border border-bark/20 px-4 py-3"
            >
              <option>Акмолинская область</option>
              <option>Костанайская область</option>
              <option>Северо-Казахстанская область</option>
              <option>Павлодарская область</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-soil/60">Всего токенов</label>
              <input
                type="number"
                min={1}
                value={totalSupply}
                onChange={(e) => setTotalSupply(Number(e.target.value))}
                className="w-full rounded-2xl border border-bark/20 px-4 py-3"
              />
            </div>
            <div>
              <label className="text-xs text-soil/60">Цена (USDC)</label>
              <input
                type="number"
                min={1}
                value={pricePerToken}
                onChange={(e) => setPricePerToken(Number(e.target.value))}
                className="w-full rounded-2xl border border-bark/20 px-4 py-3"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-soil/60">Дата урожая</label>
            <input
              type="date"
              value={harvestDate}
              onChange={(e) => setHarvestDate(e.target.value)}
              className="w-full rounded-2xl border border-bark/20 px-4 py-3"
            />
          </div>
          <input
            value={proofHash}
            onChange={(e) => setProofHash(e.target.value)}
            placeholder="Proof Hash (hex, необязательно)"
            className="w-full rounded-2xl border border-bark/20 px-4 py-3"
          />
          <button
            type="submit"
            disabled={!publicKey || busy === "create"}
            className="w-full rounded-2xl bg-leaf px-4 py-3 text-white disabled:opacity-50"
          >
            {busy === "create" ? "Создание..." : "Создать кампанию"}
          </button>
        </form>

        {error && (
          <div className="panel bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}
        {lastTx && (
          <div className="panel bg-leaf/10 p-4">
            <p className="text-sm font-medium text-leaf">Последняя транзакция</p>
            <p className="mt-1 break-all text-xs font-mono">{lastTx}</p>
          </div>
        )}
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-2xl">Мои кампании</h2>
        {farmerCampaigns.length === 0 && (
          <p className="text-sm text-soil/60">
            {publicKey ? "Нет кампаний" : "Подключите кошелёк чтобы увидеть свои кампании"}
          </p>
        )}
        {farmerCampaigns.map((campaign) => (
          <div key={campaign.id} className="panel p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-display text-xl">{campaign.title}</h3>
                <p className="text-sm text-soil/65">{campaign.region} — {campaign.cropType}</p>
                <p className="mt-1 text-sm">
                  Продано: {campaign.tokensSold}/{campaign.totalSupply} токенов
                </p>
              </div>
              <StatusTimeline current={campaign.status} />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {(campaign.status === "FUNDED" || campaign.status === "ACTIVE") && (
                <button
                  onClick={() => handleConfirmHarvest(campaign)}
                  disabled={busy === `confirm-${campaign.id}`}
                  className="rounded-2xl border border-bark/30 px-4 py-2 text-sm disabled:opacity-50"
                >
                  {busy === `confirm-${campaign.id}` ? "Подписание..." : "Подтвердить сбор урожая"}
                </button>
              )}
              {campaign.status === "HARVEST_SOLD" && (
                <button
                  onClick={() => handleDistribute(campaign)}
                  disabled={busy === `distribute-${campaign.id}`}
                  className="rounded-2xl bg-wheat px-4 py-2 text-sm text-soil disabled:opacity-50"
                >
                  {busy === `distribute-${campaign.id}` ? "Подписание..." : "Распределить выплаты"}
                </button>
              )}
            </div>

            {campaign.onChainAddress && (
              <p className="mt-3 break-all text-xs font-mono text-soil/40">
                PDA: {campaign.onChainAddress}
              </p>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}
