"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { BuyTokenModal } from "@/components/BuyTokenModal";
import { StatusTimeline } from "@/components/StatusTimeline";
import { useCampaigns } from "@/hooks/useCampaigns";
import { api } from "@/lib/api";

export default function CampaignDetailsPage() {
  const params = useParams<{ id: string }>();
  const { campaigns } = useCampaigns();
  const [open, setOpen] = useState(false);
  const campaign = campaigns.find((item) => String(item.id) === params.id) ?? campaigns[0];

  async function handleBuy(amount: number) {
    if (!campaign) {
      return;
    }

    await api.post(`/campaigns/${campaign.id}/buy`, {
      investorWallet: "demo-wallet",
      tokensAmount: amount
    });
  }

  if (!campaign) {
    return <div className="panel p-6">Кампания не найдена.</div>;
  }

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
            <p className="text-sm text-soil/60">Документ</p>
            <p className="mt-2 break-all text-sm">{campaign.proofHash}</p>
          </div>
          <div className="rounded-3xl bg-mist p-5">
            <p className="text-sm text-soil/60">Дата урожая</p>
            <p className="mt-2 text-lg">{new Date(campaign.harvestDate).toLocaleDateString("ru-RU")}</p>
          </div>
        </div>
      </section>

      <aside className="panel p-8">
        <h2 className="font-display text-2xl">Инвестировать</h2>
        <p className="mt-3 text-sm text-soil/70">
          Цена за токен: {(campaign.pricePerToken / 1_000_000).toLocaleString("ru-RU")} USDC
        </p>
        <button onClick={() => setOpen(true)} className="mt-6 w-full rounded-2xl bg-leaf px-4 py-3 text-white">
          Купить токены
        </button>
      </aside>

      <BuyTokenModal open={open} onClose={() => setOpen(false)} onSubmit={handleBuy} />
    </div>
  );
}

