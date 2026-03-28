"use client";

import { CampaignCard } from "@/components/CampaignCard";
import { useCampaigns } from "@/hooks/useCampaigns";

export default function HomePage() {
  const { campaigns, loading } = useCampaigns();

  return (
    <div className="space-y-8">
      <section className="panel overflow-hidden p-8 md:p-12">
        <p className="mb-3 text-sm uppercase tracking-[0.35em] text-bark">Solana Harvest Marketplace</p>
        <h1 className="max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          Инвестиции в будущий урожай Казахстана через токены.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-soil/75">
          Фермеры получают оборотный капитал, инвесторы покупают долю урожая и получают прибыль после продажи.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="panel p-6">Загрузка кампаний...</div>
        ) : (
          campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)
        )}
      </section>
    </div>
  );
}
