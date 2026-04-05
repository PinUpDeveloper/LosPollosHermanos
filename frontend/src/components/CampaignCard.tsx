import Link from "next/link";
import { Campaign } from "@/hooks/useCampaigns";

function RiskBadge({ score }: { score: number | null }) {
  if (score === null) return null;
  const level = score <= 33 ? "Low" : score <= 66 ? "Medium" : "High";
  const color =
    score <= 33
      ? "bg-green-100 text-green-700"
      : score <= 66
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-700";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {level} {score}
    </span>
  );
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const progress = Math.round((campaign.tokensSold / campaign.totalSupply) * 100);

  return (
    <Link href={`/campaign/${campaign.id}`} className="panel block p-6 transition hover:-translate-y-1">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-bark">{campaign.region}</p>
          <h3 className="font-display text-2xl">{campaign.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge score={campaign.riskScore} />
          <span className="rounded-full bg-wheat/20 px-3 py-1 text-sm">{campaign.cropType}</span>
        </div>
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

