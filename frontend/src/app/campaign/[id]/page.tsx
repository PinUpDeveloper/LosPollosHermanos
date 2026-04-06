"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { BuyTokenModal } from "@/components/BuyTokenModal";
import { FarmerPassportCard } from "@/components/FarmerPassportCard";
import { ProofOfAsset } from "@/components/ProofOfAsset";
import { ProofTimeline } from "@/components/ProofTimeline";
import { SolanaVerificationPanel } from "@/components/SolanaVerificationPanel";
import { StatusTimeline } from "@/components/StatusTimeline";
import { useCampaigns } from "@/hooks/useCampaigns";
import { api } from "@/lib/api";
import { buildBuyTokensIx, getOrCreateATA } from "@/lib/agrotoken";
import { localizeContent } from "@/lib/contentLocalization";
import { useI18n } from "@/lib/i18n";

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ?? "Agro111111111111111111111111111111111111111",
);

export default function CampaignDetailsPage() {
  const params = useParams<{ id: string }>();
  const { campaigns, refresh } = useCampaigns();
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const {
    language,
    formatDate,
    formatMicroUsdc,
    translateCrop,
    translateRegion,
    translateStatus,
    translateTrustLabel,
    translateRiskLabel,
  } = useI18n();

  const [open, setOpen] = useState(false);
  const [txSig, setTxSig] = useState("");
  const [rescoreLoading, setRescoreLoading] = useState(false);
  const [rescoreFeedback, setRescoreFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const campaign = campaigns.find((item) => String(item.id) === params.id) ?? campaigns[0];

  const text = useMemo(
    () =>
      ({
        en: {
          notFound: "Campaign not found.",
          summary: "Campaign summary",
          harvestDate: "Harvest date",
          crop: "Crop",
          trustScore: "Trust score",
          riskScore: "AI risk score",
          whyTrust: "Why this campaign looks reliable",
          sold: "Sold",
          remaining: "Remaining",
          invest: "Invest",
          price: "Price per token",
          buy: "Buy tokens",
          connect: "Connect wallet",
          closed: "This campaign is not accepting new investments.",
          soldOut: "All tokens have been sold.",
          confirmed: "Transaction confirmed",
          walletRequired: "Connect Phantom to continue.",
          missingAddresses: "This campaign is missing required on-chain addresses.",
          availability: "Availability",
          progress: "Funding progress",
          recalculate: "Recalculate AI score",
          recalculating: "Recalculating...",
          recalculateHint: "Run AI re-scoring for this campaign and refresh the trust data.",
          recalculateSuccess: "AI score recalculation has started.",
          recalculateError: "Failed to recalculate AI score.",
          aiBlock: "AI",
        },
        ru: {
          notFound: "Кампания не найдена.",
          summary: "Сводка кампании",
          harvestDate: "Дата урожая",
          crop: "Культура",
          trustScore: "Индекс доверия",
          riskScore: "Оценка AI-риска",
          whyTrust: "Что подтверждает надёжность кампании",
          sold: "Продано",
          remaining: "Осталось",
          invest: "Инвестировать",
          price: "Цена за токен",
          buy: "Купить токены",
          connect: "Подключить кошелёк",
          closed: "Кампания больше не принимает новые инвестиции.",
          soldOut: "Все токены уже распроданы.",
          confirmed: "Транзакция подтверждена",
          walletRequired: "Подключите Phantom, чтобы продолжить.",
          missingAddresses: "У кампании не хватает обязательных on-chain адресов.",
          availability: "Доступный объём",
          progress: "Прогресс финансирования",
          recalculate: "Пересчитать AI score",
          recalculating: "Пересчёт...",
          recalculateHint: "Запустить повторную AI-оценку кампании и обновить trust-данные.",
          recalculateSuccess: "Пересчёт AI score запущен.",
          recalculateError: "Не удалось пересчитать AI score.",
          aiBlock: "AI",
        },
        kk: {
          notFound: "Кампания табылмады.",
          summary: "Кампания шолуы",
          harvestDate: "Егін күні",
          crop: "Дақыл",
          trustScore: "Сенім индексі",
          riskScore: "AI тәуекел бағасы",
          whyTrust: "Кампанияның сенімді екенін не растайды",
          sold: "Сатылды",
          remaining: "Қалды",
          invest: "Инвестициялау",
          price: "Бір токен бағасы",
          buy: "Токен сатып алу",
          connect: "Әмиянды қосу",
          closed: "Бұл кампания жаңа инвестиция қабылдамайды.",
          soldOut: "Барлық токен сатылып кетті.",
          confirmed: "Транзакция расталды",
          walletRequired: "Жалғастыру үшін Phantom қосыңыз.",
          missingAddresses: "Бұл кампанияда қажетті on-chain мекенжайлар жоқ.",
          availability: "Қолжетімді көлем",
          progress: "Қаржыландыру барысы",
          recalculate: "AI score қайта есептеу",
          recalculating: "Қайта есептелуде...",
          recalculateHint: "Кампанияны AI арқылы қайта бағалап, trust деректерін жаңарту.",
          recalculateSuccess: "AI score қайта есептеуі басталды.",
          recalculateError: "AI score қайта есептеу сәтсіз аяқталды.",
          aiBlock: "AI",
        },
      })[language],
    [language],
  );

  async function handleBuy(amount: number) {
    if (!campaign || !publicKey) {
      throw new Error(text.walletRequired);
    }
    if (!campaign.onChainAddress || !campaign.tokenMintAddress || !campaign.vaultAddress) {
      throw new Error(text.missingAddresses);
    }

    const campaignPda = new PublicKey(campaign.onChainAddress);
    const tokenMint = new PublicKey(campaign.tokenMintAddress);
    const vault = new PublicKey(campaign.vaultAddress);
    const usdcMint = new PublicKey(
      process.env.NEXT_PUBLIC_USDC_MINT ?? "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU",
    );

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

  async function handleRescore() {
    if (!campaign) return;

    setRescoreLoading(true);
    setRescoreFeedback(null);

    try {
      await api.post(`/campaigns/${campaign.id}/rescore`);
      await refresh();
      setRescoreFeedback({
        type: "success",
        message: text.recalculateSuccess,
      });
    } catch {
      setRescoreFeedback({
        type: "error",
        message: text.recalculateError,
      });
    } finally {
      setRescoreLoading(false);
    }
  }

  if (!campaign) {
    return <div className="panel p-6 text-sm text-soil/62">{text.notFound}</div>;
  }

  const remaining = campaign.totalSupply - campaign.tokensSold;
  const progress = Math.round((campaign.tokensSold / campaign.totalSupply) * 100);
  const isOpen = campaign.status === "ACTIVE" && remaining > 0;

  const trustTone =
    (campaign.trustScore ?? 0) >= 80
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : (campaign.trustScore ?? 0) >= 60
        ? "border-[#d8c4a2] bg-[#f3eadc] text-[#6c5430]"
        : "border-[#e7c4ba] bg-[#f6e4dd] text-[#854935]";

  const riskTone =
    campaign.riskScore === null
      ? "border-bark/12 bg-white/70 text-soil"
      : campaign.riskScore <= 33
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : campaign.riskScore <= 66
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-rose-200 bg-rose-50 text-rose-800";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.8fr)_380px]">
      <section className="space-y-6">
        <div className="panel overflow-hidden">
          <div className="border-b border-white/10 bg-gradient-to-br from-[#243126] via-[#1f2a23] to-[#37453a] px-8 py-8 text-[#f5efe4]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/74">
                {localizeContent(translateRegion(campaign.region), language)}
              </span>
              <span className="rounded-full border border-[#d9be92]/28 bg-[#d9be92]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2d8b0]">
                {translateStatus(campaign.status)}
              </span>
            </div>

            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.045em] text-white md:text-[2.9rem]">
              {localizeContent(campaign.title, language)}
            </h1>
            <p className="mt-4 max-w-3xl text-[15px] leading-7 text-white/72">
              {localizeContent(campaign.description, language)}
            </p>

            <div className="mt-7 grid gap-3 md:grid-cols-3">
              <HeroMetric label={text.harvestDate} value={formatDate(campaign.harvestDate)} tone="dark" />
              <HeroMetric label={text.crop} value={translateCrop(campaign.cropType)} tone="dark" />
              <HeroMetric
                label={text.progress}
                value={`${progress}%`}
                note={`${campaign.tokensSold}/${campaign.totalSupply}`}
                tone="warm"
              />
            </div>
          </div>

          <div className="px-8 py-7">
            <StatusTimeline current={campaign.status} />

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard
                label={text.trustScore}
                value={campaign.trustScore !== null ? `${campaign.trustScore}/100` : "—"}
                note={campaign.trustScore !== null ? translateTrustLabel(campaign.trustLabel) : undefined}
                tone={trustTone}
              />
              <InfoCard
                label={text.riskScore}
                value={campaign.riskScore !== null ? `${campaign.riskScore}/100` : "—"}
                note={
                  campaign.riskScore !== null
                    ? localizeContent(
                        campaign.riskExplanation ?? translateRiskLabel(campaign.riskScore),
                        language,
                      )
                    : undefined
                }
                tone={riskTone}
              />
              <InfoCard label={text.sold} value={`${campaign.tokensSold}/${campaign.totalSupply}`} note={`${progress}%`} />
              <InfoCard label={text.remaining} value={`${remaining}`} note={text.availability} />
            </div>

            {campaign.trustReasons.length > 0 && (
              <div className="mt-6 rounded-[1.35rem] border border-bark/10 bg-[#f7f2e9] p-5">
                <p className="text-xs uppercase tracking-[0.24em] text-soil/48">{text.whyTrust}</p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {campaign.trustReasons.map((reason) => (
                    <div
                      key={reason}
                      className="rounded-[1rem] border border-white/70 bg-white/92 px-4 py-4 text-sm leading-6 text-soil/74 shadow-[0_10px_24px_rgba(31,42,35,0.05)]"
                    >
                      {localizeContent(reason, language)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {campaign.farmerPassport && <FarmerPassportCard passport={campaign.farmerPassport} />}
        <ProofTimeline campaign={campaign} />
        <ProofOfAsset campaign={campaign} />
        <SolanaVerificationPanel campaign={campaign} />
      </section>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="panel overflow-hidden">
          <div className="bg-gradient-to-br from-[#b38a54] via-[#a07a49] to-[#8a653b] px-7 py-6 text-[#fff8ed]">
            <p className="text-xs uppercase tracking-[0.24em] text-white/74">{text.invest}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">
              {formatMicroUsdc(campaign.pricePerToken)}
            </h2>
            <p className="mt-2 text-sm text-white/74">{text.price}</p>
          </div>

          <div className="space-y-5 px-7 py-6">
            <div>
              <div className="flex items-center justify-between text-sm text-soil/66">
                <span>{text.sold}</span>
                <span>{text.remaining}</span>
              </div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#e9dfcf]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-leaf via-[#6d845f] to-wheat"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm font-medium text-soil">
                <span>
                  {campaign.tokensSold}/{campaign.totalSupply}
                </span>
                <span>{progress}%</span>
              </div>
            </div>

            {isOpen ? (
              <button
                onClick={() => setOpen(true)}
                disabled={!publicKey}
                className="w-full rounded-full bg-soil px-4 py-3 text-sm font-semibold text-[#f7f1e6] transition hover:bg-[#18211b] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {publicKey ? text.buy : text.connect}
              </button>
            ) : (
              <div className="rounded-[1rem] border border-bark/10 bg-mist px-4 py-3 text-sm leading-6 text-soil/66">
                {campaign.status !== "ACTIVE" ? text.closed : text.soldOut}
              </div>
            )}

            {txSig && (
              <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">{text.confirmed}</p>
                <p className="mt-2 break-all font-mono text-xs text-emerald-700/90">{txSig}</p>
              </div>
            )}
          </div>
        </div>

        <div className="panel p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-soil/45">{text.summary}</p>
          <div className="mt-4 grid gap-3">
            <SummaryRow label={text.harvestDate} value={formatDate(campaign.harvestDate)} />
            <SummaryRow label={text.crop} value={translateCrop(campaign.cropType)} />
            <SummaryRow label={text.trustScore} value={`${campaign.trustScore ?? "—"}/100`} />
            <SummaryRow label={text.riskScore} value={`${campaign.riskScore ?? "—"}/100`} />
          </div>

          <div className="mt-5 rounded-[1rem] border border-bark/8 bg-[#f7f2e9] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-soil/45">{text.aiBlock}</p>
            <p className="mt-2 text-sm leading-6 text-soil/68">{text.recalculateHint}</p>
            <button
              onClick={handleRescore}
              disabled={rescoreLoading}
              className="mt-4 w-full rounded-full border border-soil/12 bg-white px-4 py-3 text-sm font-semibold text-soil transition hover:bg-soil hover:text-[#f7f1e6] disabled:cursor-not-allowed disabled:opacity-55"
            >
              {rescoreLoading ? text.recalculating : text.recalculate}
            </button>

            {rescoreFeedback && (
              <div
                className={`mt-3 rounded-[0.9rem] px-3 py-2 text-sm ${
                  rescoreFeedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-rose-50 text-rose-800"
                }`}
              >
                {rescoreFeedback.message}
              </div>
            )}
          </div>
        </div>
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

function HeroMetric({
  label,
  value,
  note,
  tone = "dark",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: "dark" | "warm";
}) {
  return (
    <div
      className={`rounded-[1.1rem] border px-4 py-4 ${
        tone === "warm"
          ? "border-[#d8bb8e]/22 bg-[#d8bb8e]/10 text-white"
          : "border-white/10 bg-white/6 text-white"
      }`}
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/62">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
      {note && <p className="mt-1 text-sm text-white/70">{note}</p>}
    </div>
  );
}

function InfoCard({
  label,
  value,
  note,
  tone = "border-bark/10 bg-white/80 text-soil",
}: {
  label: string;
  value: string;
  note?: string;
  tone?: string;
}) {
  return (
    <div className={`rounded-[1rem] border p-5 ${tone}`}>
      <p className="text-xs uppercase tracking-[0.22em] opacity-65">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
      {note && <p className="mt-2 text-sm leading-6 opacity-82">{note}</p>}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-bark/8 bg-mist px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-soil/45">{label}</p>
      <p className="mt-2 text-sm font-medium text-soil">{value}</p>
    </div>
  );
}
