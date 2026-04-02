"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useCampaigns, Campaign } from "@/hooks/useCampaigns";
import { usePortfolio, Investment } from "@/hooks/usePortfolio";
import { StatusTimeline } from "@/components/StatusTimeline";

export default function InvestorDashboardPage() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58();
  const { campaigns } = useCampaigns();
  const { investments, loading } = usePortfolio(wallet);

  // Group investments by campaign and compute totals
  const grouped = investments.reduce<Record<number, { tokens: number; usdc: number; txs: Investment[] }>>(
    (acc, inv) => {
      if (!acc[inv.campaignId]) {
        acc[inv.campaignId] = { tokens: 0, usdc: 0, txs: [] };
      }
      acc[inv.campaignId].tokens += inv.tokensAmount;
      acc[inv.campaignId].usdc += inv.usdcPaid;
      acc[inv.campaignId].txs.push(inv);
      return acc;
    },
    {}
  );

  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));
  const totalInvested = investments.reduce((sum, inv) => sum + inv.usdcPaid, 0);
  const totalTokens = investments.reduce((sum, inv) => sum + inv.tokensAmount, 0);

  function getCampaign(id: number): Campaign | undefined {
    return campaignMap.get(id);
  }

  return (
    <div className="space-y-6">
      <section className="panel p-8">
        <h1 className="font-display text-3xl">Портфель инвестора</h1>
        {!publicKey ? (
          <p className="mt-3 text-soil/70">Подключите Phantom кошелёк чтобы увидеть портфель.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-soil/60">Всего инвестировано</p>
              <p className="mt-1 font-display text-2xl">
                {(totalInvested / 1_000_000).toLocaleString("ru-RU")} USDC
              </p>
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-soil/60">Токенов куплено</p>
              <p className="mt-1 font-display text-2xl">{totalTokens}</p>
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-soil/60">Кампаний</p>
              <p className="mt-1 font-display text-2xl">{Object.keys(grouped).length}</p>
            </div>
          </div>
        )}
      </section>

      {loading && <div className="panel p-6">Загрузка портфеля...</div>}

      {publicKey && investments.length === 0 && !loading && (
        <div className="panel p-6 text-sm text-soil/60">
          У вас пока нет инвестиций. Перейдите на главную, чтобы купить токены.
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        {Object.entries(grouped).map(([campaignIdStr, data]) => {
          const campaignId = Number(campaignIdStr);
          const campaign = getCampaign(campaignId);
          const sharePercent = campaign
            ? ((data.tokens / campaign.totalSupply) * 100).toFixed(1)
            : "?";

          return (
            <div key={campaignId} className="panel p-6">
              <p className="text-sm uppercase tracking-[0.2em] text-bark">
                {campaign?.cropType ?? "—"}
              </p>
              <h2 className="mt-2 font-display text-2xl">
                {campaign?.title ?? `Кампания #${campaignId}`}
              </h2>

              {campaign && (
                <div className="mt-3">
                  <StatusTimeline current={campaign.status} />
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-mist p-3">
                  <p className="text-soil/60">Мои токены</p>
                  <p className="mt-1 font-medium">{data.tokens}</p>
                </div>
                <div className="rounded-xl bg-mist p-3">
                  <p className="text-soil/60">Инвестировано</p>
                  <p className="mt-1 font-medium">
                    {(data.usdc / 1_000_000).toLocaleString("ru-RU")} USDC
                  </p>
                </div>
                <div className="rounded-xl bg-mist p-3">
                  <p className="text-soil/60">Доля</p>
                  <p className="mt-1 font-medium">{sharePercent}%</p>
                </div>
                <div className="rounded-xl bg-mist p-3">
                  <p className="text-soil/60">Транзакций</p>
                  <p className="mt-1 font-medium">{data.txs.length}</p>
                </div>
              </div>

              {data.txs.length > 0 && (
                <div className="mt-3 space-y-1">
                  {data.txs.map((tx) => (
                    <p key={tx.id} className="break-all text-xs font-mono text-soil/40">
                      tx: {tx.txSignature}
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
