"use client";

import { useCampaigns } from "@/hooks/useCampaigns";

export default function InvestorDashboardPage() {
  const { campaigns } = useCampaigns();

  return (
    <div className="space-y-6">
      <section className="panel p-8">
        <h1 className="font-display text-3xl">Портфель инвестора</h1>
        <p className="mt-3 text-soil/70">Текущие позиции, история покупок и ожидаемые распределения.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="panel p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-bark">{campaign.cropType}</p>
            <h2 className="mt-2 font-display text-2xl">{campaign.title}</h2>
            <p className="mt-2 text-sm text-soil/65">Ожидаемая доходность: 20-25%</p>
          </div>
        ))}
      </section>
    </div>
  );
}
