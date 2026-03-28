"use client";

import { FormEvent, useState } from "react";
import { useCampaigns } from "@/hooks/useCampaigns";
import { api } from "@/lib/api";

export default function FarmerDashboardPage() {
  const { campaigns } = useCampaigns();
  const [title, setTitle] = useState("");

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await api.post("/campaigns", {
      farmerWallet: "farmer-demo-wallet",
      title,
      description: "Новый аграрный сезон",
      cropType: "Пшеница",
      region: "Костанайская область",
      totalSupply: 1000,
      pricePerToken: 80000000,
      proofDocumentUrl: "https://example.com/proof.pdf",
      proofHash: "hash",
      harvestDate: "2026-10-01T00:00:00"
    });
    setTitle("");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
      <form onSubmit={handleCreate} className="panel p-8">
        <h1 className="font-display text-3xl">Кабинет фермера</h1>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Название кампании"
          className="mt-6 w-full rounded-2xl border border-bark/20 px-4 py-3"
        />
        <button type="submit" className="mt-4 rounded-2xl bg-leaf px-4 py-3 text-white">
          Создать кампанию
        </button>
      </form>

      <section className="space-y-4">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl">{campaign.title}</h2>
                <p className="text-sm text-soil/65">{campaign.region}</p>
              </div>
              <div className="flex gap-3">
                <button className="rounded-2xl border px-4 py-2">Подтвердить сбор</button>
                <button className="rounded-2xl bg-wheat px-4 py-2 text-soil">Распределить</button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

