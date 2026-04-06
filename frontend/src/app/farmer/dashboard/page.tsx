"use client";

import { FormEvent, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { FarmerPassportCard } from "@/components/FarmerPassportCard";
import { StatusTimeline } from "@/components/StatusTimeline";
import { useCampaigns, Campaign } from "@/hooks/useCampaigns";
import { api } from "@/lib/api";
import {
  buildConfirmHarvestIx,
  buildCreateCampaignTx,
  buildDistributeIx,
  getOrCreateATA,
} from "@/lib/agrotoken";
import { useI18n } from "@/lib/i18n";

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "Agro111111111111111111111111111111111111111",
);
const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT ?? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
);
const ORACLE = new PublicKey(
  process.env.NEXT_PUBLIC_ORACLE_WALLET ?? "11111111111111111111111111111111",
);

export default function FarmerDashboardPage() {
  const { campaigns, refresh } = useCampaigns();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { language, cropOptions, regionOptions, formatNumber, translateCrop, translateRegion } = useI18n();

  const text = useMemo(
    () =>
      ({
        en: {
          title: "Farmer workspace",
          hint: "Create campaigns, attach proof documents, and move harvest funding through the payout flow.",
          create: "Create campaign",
          creating: "Creating...",
          titleField: "Campaign title",
          descriptionField: "Description",
          totalSupply: "Total tokens",
          price: "Price (USDC)",
          harvestDate: "Harvest date",
          proofTitle: "Proof of asset",
          proofUrl: "Proof document URL",
          proofHash: "SHA-256 document hash",
          proofHint: "Attach a proof document and store its SHA-256 hash on-chain.",
          lastTx: "Latest transaction",
          campaigns: "My campaigns",
          empty: "No campaigns yet.",
          emptyDisconnected: "Connect your wallet to see your campaigns.",
          sold: "Sold",
          confirm: "Confirm harvest",
          distribute: "Distribute payouts",
          signing: "Signing...",
          walletError: "Connect a wallet first.",
          createError: "Failed to create campaign.",
          confirmError: "Failed to confirm harvest.",
          distributeError: "Failed to distribute payouts.",
          promptRevenue: "Enter total harvest revenue in USDC:",
          passport: "Farmer passport",
          defaultDescription: "Tokenized harvest campaign",
        },
        ru: {
          title: "Кабинет фермера",
          hint: "Создавайте кампании, добавляйте подтверждающие документы и проводите цикл до этапа выплат.",
          create: "Создать кампанию",
          creating: "Создание...",
          titleField: "Название кампании",
          descriptionField: "Описание",
          totalSupply: "Всего токенов",
          price: "Цена (USDC)",
          harvestDate: "Дата урожая",
          proofTitle: "Подтверждение актива",
          proofUrl: "Ссылка на документ",
          proofHash: "SHA-256 хеш документа",
          proofHint: "Добавьте подтверждающий документ и сохраните его SHA-256 хеш on-chain.",
          lastTx: "Последняя транзакция",
          campaigns: "Мои кампании",
          empty: "Кампаний пока нет.",
          emptyDisconnected: "Подключите кошелёк, чтобы увидеть свои кампании.",
          sold: "Продано",
          confirm: "Подтвердить урожай",
          distribute: "Распределить выплаты",
          signing: "Подписание...",
          walletError: "Сначала подключите кошелёк.",
          createError: "Не удалось создать кампанию.",
          confirmError: "Не удалось подтвердить урожай.",
          distributeError: "Не удалось распределить выплаты.",
          promptRevenue: "Введите общую выручку от продажи урожая в USDC:",
          passport: "Паспорт фермера",
          defaultDescription: "Токенизированная урожайная кампания",
        },
        kk: {
          title: "Фермер кабинеті",
          hint: "Кампания құрып, proof-құжаттарды қосып, өнім циклін төлем кезеңіне дейін жүргізіңіз.",
          create: "Кампания құру",
          creating: "Құрылуда...",
          titleField: "Кампания атауы",
          descriptionField: "Сипаттама",
          totalSupply: "Жалпы токен саны",
          price: "Баға (USDC)",
          harvestDate: "Егін күні",
          proofTitle: "Активті растау",
          proofUrl: "Құжат сілтемесі",
          proofHash: "Құжаттың SHA-256 hash-і",
          proofHint: "Растайтын құжатты тіркеп, оның SHA-256 hash-ін on-chain сақтаңыз.",
          lastTx: "Соңғы транзакция",
          campaigns: "Менің кампанияларым",
          empty: "Әзірге кампания жоқ.",
          emptyDisconnected: "Өз кампанияларыңызды көру үшін әмиянды қосыңыз.",
          sold: "Сатылды",
          confirm: "Өнімді растау",
          distribute: "Төлемдерді тарату",
          signing: "Қол қойылуда...",
          walletError: "Алдымен әмиянды қосыңыз.",
          createError: "Кампанияны құру мүмкін болмады.",
          confirmError: "Өнімді растау мүмкін болмады.",
          distributeError: "Төлемдерді тарату мүмкін болмады.",
          promptRevenue: "USDC бойынша жалпы табысты енгізіңіз:",
          passport: "Фермер паспорты",
          defaultDescription: "Токенделген егін кампаниясы",
        },
      })[language],
    [language],
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [cropType, setCropType] = useState("Wheat");
  const [region, setRegion] = useState("Akmola Region");
  const [totalSupply, setTotalSupply] = useState("1000");
  const [pricePerToken, setPricePerToken] = useState("10");
  const [proofHash, setProofHash] = useState("");
  const [proofDocumentUrl, setProofDocumentUrl] = useState("");
  const [harvestDate, setHarvestDate] = useState("2026-10-01");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [lastTx, setLastTx] = useState("");

  const farmerCampaigns = campaigns.filter((campaign) => publicKey && campaign.farmerWallet === publicKey.toBase58());
  const farmerPassport = farmerCampaigns[0]?.farmerPassport ?? null;

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!publicKey) {
      setError(text.walletError);
      return;
    }

    const parsedTotalSupply = Number(totalSupply);
    const parsedPricePerToken = Number(pricePerToken);
    if (!Number.isFinite(parsedTotalSupply) || parsedTotalSupply < 1) {
      setError(text.createError);
      return;
    }
    if (!Number.isFinite(parsedPricePerToken) || parsedPricePerToken < 1) {
      setError(text.createError);
      return;
    }

    setBusy("create");
    try {
      const response = await api.post("/campaigns", {
        farmerWallet: publicKey.toBase58(),
        title,
        description: description || text.defaultDescription,
        cropType,
        region,
        totalSupply: parsedTotalSupply,
        pricePerToken: parsedPricePerToken * 1_000_000,
        proofDocumentUrl: proofDocumentUrl || "https://agrotoken.kz/proof",
        proofHash: proofHash || "0".repeat(64),
        harvestDate: `${harvestDate}T00:00:00`,
      });

      const campaignId = response.data.id as number;
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
        description: description || text.defaultDescription,
        totalSupply: parsedTotalSupply,
        pricePerToken: parsedPricePerToken * 1_000_000,
        proofHash: hashBytes,
      });

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");
      setLastTx(signature);

      setTitle("");
      setDescription("");
      setTotalSupply("1000");
      setPricePerToken("10");
      setProofHash("");
      setProofDocumentUrl("");
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : text.createError);
    } finally {
      setBusy("");
    }
  }

  async function handleConfirmHarvest(campaign: Campaign) {
    if (!publicKey) return;
    setError("");
    setBusy(`confirm-${campaign.id}`);
    try {
      const revenue = prompt(text.promptRevenue);
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

      await api.post(`/campaigns/${campaign.id}/confirm`, {
        authorityWallet: publicKey.toBase58(),
        harvestTotalUsdc: harvestUsdc,
      });

      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : text.confirmError);
    } finally {
      setBusy("");
    }
  }

  async function handleDistribute(campaign: Campaign) {
    if (!publicKey) return;
    setError("");
    setBusy(`distribute-${campaign.id}`);
    try {
      const holdersResponse = await api.get<Array<{ investorWallet: string; tokensAmount: number }>>(
        `/campaigns/${campaign.id}/holders`,
      );

      const tokenMint = new PublicKey(campaign.tokenMintAddress);
      const holders = [];

      for (const holder of holdersResponse.data) {
        const holderPk = new PublicKey(holder.investorWallet);
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
      setError(err instanceof Error ? err.message : text.distributeError);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1.7fr]">
      <div className="space-y-6">
        <form onSubmit={handleCreate} className="panel p-8">
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-soil">{text.title}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-soil/65">{text.hint}</p>
            </div>

            <div className="space-y-3">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={text.titleField} required className="field-shell w-full px-4 py-3" />
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={text.descriptionField} className="field-shell w-full px-4 py-3" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select value={cropType} onChange={(e) => setCropType(e.target.value)} className="field-shell px-4 py-3">
                {cropOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="field-shell px-4 py-3">
                {regionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={text.totalSupply}>
                <input
                  type="number"
                  min={1}
                  value={totalSupply}
                  onChange={(e) => setTotalSupply(e.target.value)}
                  onBlur={() => totalSupply !== "" && setTotalSupply(String(Number(totalSupply)))}
                  className="field-shell w-full px-4 py-3"
                />
              </Field>
              <Field label={text.price}>
                <input
                  type="number"
                  min={1}
                  value={pricePerToken}
                  onChange={(e) => setPricePerToken(e.target.value)}
                  onBlur={() => pricePerToken !== "" && setPricePerToken(String(Number(pricePerToken)))}
                  className="field-shell w-full px-4 py-3"
                />
              </Field>
            </div>

            <Field label={text.harvestDate}>
              <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} className="field-shell w-full px-4 py-3" />
            </Field>

            <div className="rounded-[1rem] border border-bark/10 bg-mist p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-soil/45">{text.proofTitle}</p>
              <div className="mt-3 space-y-3">
                <input value={proofDocumentUrl} onChange={(e) => setProofDocumentUrl(e.target.value)} placeholder={text.proofUrl} className="field-shell w-full px-4 py-3 text-sm" />
                <input value={proofHash} onChange={(e) => setProofHash(e.target.value)} placeholder={text.proofHash} className="field-shell w-full px-4 py-3 text-sm font-mono" />
                <p className="text-xs leading-5 text-soil/55">{text.proofHint}</p>
              </div>
            </div>

            <button type="submit" disabled={!publicKey || busy === "create"} className="w-full rounded-full bg-soil px-4 py-3 text-sm font-semibold text-[#f6f1e8] disabled:opacity-50">
              {busy === "create" ? text.creating : text.create}
            </button>
          </div>
        </form>

        {error && <div className="panel bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {lastTx && <div className="panel p-4"><p className="text-sm font-semibold text-soil">{text.lastTx}</p><p className="mt-2 break-all text-xs font-mono text-soil/58">{lastTx}</p></div>}
      </div>

      <section className="space-y-4">
        {farmerPassport && <FarmerPassportCard passport={farmerPassport} title={text.passport} />}
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-soil">{text.campaigns}</h2>

        {farmerCampaigns.length === 0 && <div className="panel p-6 text-sm text-soil/62">{publicKey ? text.empty : text.emptyDisconnected}</div>}

        {farmerCampaigns.map((campaign) => (
          <div key={campaign.id} className="panel p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-2xl font-semibold tracking-[-0.04em] text-soil">{campaign.title}</h3>
                <p className="mt-2 text-sm text-soil/62">
                  {translateRegion(campaign.region)} · {translateCrop(campaign.cropType)}
                </p>
                <p className="mt-2 text-sm text-soil/72">
                  {text.sold}: {formatNumber(campaign.tokensSold)}/{formatNumber(campaign.totalSupply)}
                </p>
              </div>
              <StatusTimeline current={campaign.status} />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {(campaign.status === "FUNDED" || campaign.status === "ACTIVE") && (
                <button onClick={() => handleConfirmHarvest(campaign)} disabled={busy === `confirm-${campaign.id}`} className="rounded-full border border-bark/16 bg-white/75 px-4 py-2 text-sm text-soil disabled:opacity-50">
                  {busy === `confirm-${campaign.id}` ? text.signing : text.confirm}
                </button>
              )}
              {campaign.status === "HARVEST_SOLD" && (
                <button onClick={() => handleDistribute(campaign)} disabled={busy === `distribute-${campaign.id}`} className="rounded-full bg-leaf px-4 py-2 text-sm font-semibold text-[#f6f1e8] disabled:opacity-50">
                  {busy === `distribute-${campaign.id}` ? text.signing : text.distribute}
                </button>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-soil/45">{label}</label>
      {children}
    </div>
  );
}
