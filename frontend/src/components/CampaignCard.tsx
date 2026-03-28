import Link from "next/link";
import { Campaign } from "@/hooks/useCampaigns";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = Math.round((campaign.tokensSold / campaign.totalSupply) * 100);

  return (
    <Link href={`/campaign/${campaign.id}`} className="panel block p-6 transition hover:-translate-y-1">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-bark">{campaign.region}</p>
          <h3 className="font-display text-2xl">{campaign.title}</h3>
        </div>
        <span className="rounded-full bg-wheat/20 px-3 py-1 text-sm">{campaign.cropType}</span>
      </div>
      <p className="mb-4 text-sm text-soil/75">{campaign.description}</p>
      <div className="mb-2 flex justify-between text-sm">
        <span>Прогресс</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 rounded-full bg-bark/10">
        <div className="h-2 rounded-full bg-leaf" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 flex justify-between text-sm">
        <span>{campaign.tokensSold}/{campaign.totalSupply} токенов</span>
        <span>{(campaign.pricePerToken / 1_000_000).toLocaleString("ru-RU")} USDC</span>
      </div>
    </Link>
  );
}

