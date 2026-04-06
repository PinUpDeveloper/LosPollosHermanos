"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { StatusTimeline } from "@/components/StatusTimeline";
import { useCampaigns, Campaign } from "@/hooks/useCampaigns";
import { usePortfolio, Investment } from "@/hooks/usePortfolio";
import { useI18n } from "@/lib/i18n";

export default function InvestorDashboardPage() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58();
  const { campaigns } = useCampaigns();
  const { investments, loading } = usePortfolio(wallet);
  const { language, formatNumber, formatMicroUsdc, translateCrop } = useI18n();

  const text =
    language === "ru"
      ? {
          title: "Портфель инвестора",
          hint: "Подключите Phantom, чтобы увидеть свой портфель и структуру вложений.",
          total: "Всего инвестировано",
          tokens: "Куплено токенов",
          campaigns: "Кампаний в портфеле",
          loading: "Загрузка портфеля...",
          empty: "У вас пока нет инвестиций. Начните с маркетплейса.",
          myTokens: "Мои токены",
          invested: "Инвестировано",
          share: "Доля в кампании",
          transactions: "Транзакций",
          fallbackCampaign: (id: number) => `Кампания #${id}`,
        }
      : language === "kk"
        ? {
            title: "Инвестор портфелі",
            hint: "Портфель мен инвестиция құрылымын көру үшін Phantom қосыңыз.",
            total: "Жалпы инвестиция",
            tokens: "Сатып алынған токендер",
            campaigns: "Портфельдегі кампаниялар",
            loading: "Портфель жүктелуде...",
            empty: "Әзірге инвестиция жоқ. Маркетплейстен бастаңыз.",
            myTokens: "Менің токендерім",
            invested: "Инвестицияланған",
            share: "Кампаниядағы үлес",
            transactions: "Транзакциялар",
            fallbackCampaign: (id: number) => `Кампания #${id}`,
          }
        : {
            title: "Investor portfolio",
            hint: "Connect Phantom to review your portfolio and campaign exposure.",
            total: "Total invested",
            tokens: "Tokens bought",
            campaigns: "Campaigns held",
            loading: "Loading portfolio...",
            empty: "You have no investments yet. Start from the marketplace.",
            myTokens: "My tokens",
            invested: "Invested",
            share: "Campaign share",
            transactions: "Transactions",
            fallbackCampaign: (id: number) => `Campaign #${id}`,
          };

  const grouped = investments.reduce<Record<number, { tokens: number; usdc: number; txs: Investment[] }>>(
    (acc, investment) => {
      if (!acc[investment.campaignId]) {
        acc[investment.campaignId] = { tokens: 0, usdc: 0, txs: [] };
      }
      acc[investment.campaignId].tokens += investment.tokensAmount;
      acc[investment.campaignId].usdc += investment.usdcPaid;
      acc[investment.campaignId].txs.push(investment);
      return acc;
    },
    {},
  );

  const campaignMap = new Map(campaigns.map((campaign) => [campaign.id, campaign]));
  const totalInvested = investments.reduce((sum, investment) => sum + investment.usdcPaid, 0);
  const totalTokens = investments.reduce((sum, investment) => sum + investment.tokensAmount, 0);

  function getCampaign(id: number): Campaign | undefined {
    return campaignMap.get(id);
  }

  return (
    <div className="space-y-6">
      <section className="panel p-8">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-soil">{text.title}</h1>
        {!publicKey ? (
          <p className="mt-3 max-w-2xl text-soil/68">{text.hint}</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <MetricCard label={text.total} value={formatMicroUsdc(totalInvested)} />
            <MetricCard label={text.tokens} value={formatNumber(totalTokens)} />
            <MetricCard label={text.campaigns} value={formatNumber(Object.keys(grouped).length)} />
          </div>
        )}
      </section>

      {loading && <div className="panel p-6 text-sm text-soil/65">{text.loading}</div>}

      {publicKey && investments.length === 0 && !loading && (
        <div className="panel p-6 text-sm text-soil/65">{text.empty}</div>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {Object.entries(grouped).map(([campaignIdStr, data]) => {
          const campaignId = Number(campaignIdStr);
          const campaign = getCampaign(campaignId);
          const sharePercent = campaign ? ((data.tokens / campaign.totalSupply) * 100).toFixed(1) : "?";

          return (
            <div key={campaignId} className="panel p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-soil/42">
                {campaign ? translateCrop(campaign.cropType) : "—"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-soil">
                {campaign?.title ?? text.fallbackCampaign(campaignId)}
              </h2>

              {campaign && (
                <div className="mt-4">
                  <StatusTimeline current={campaign.status} />
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <MetricTile label={text.myTokens} value={formatNumber(data.tokens)} />
                <MetricTile label={text.invested} value={formatMicroUsdc(data.usdc)} />
                <MetricTile label={text.share} value={`${sharePercent}%`} />
                <MetricTile label={text.transactions} value={formatNumber(data.txs.length)} />
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-bark/10 bg-white/66 p-5">
      <p className="text-sm text-soil/58">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-soil">{value}</p>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] bg-mist p-3">
      <p className="text-soil/58">{label}</p>
      <p className="mt-1 font-medium text-soil">{value}</p>
    </div>
  );
}
