import Link from "next/link";
import { Campaign } from "@/hooks/useCampaigns";
import { useI18n } from "@/lib/i18n";
import { localizeContent } from "@/lib/contentLocalization";

function RiskBadge({ score }: { score: number | null }) {
  const { translateRiskLabel } = useI18n();
  if (score === null) return null;

  const tone =
    score <= 33
      ? "bg-emerald-100 text-emerald-800"
      : score <= 66
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";

  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${tone}`}>
      {translateRiskLabel(score)} {score}
    </span>
  );
}

function TrustBadge({ score, label }: { score: number | null; label: string | null }) {
  const { translateTrustLabel } = useI18n();
  if (score === null) return null;

  const tone =
    score >= 80
      ? "bg-[#e6efe4] text-[#2b4930]"
      : score >= 60
        ? "bg-[#efe7d9] text-[#6a5330]"
        : "bg-[#f3dfd8] text-[#7c4936]";

  return (
    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${tone}`}>
      {translateTrustLabel(label)} {score}
    </span>
  );
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { language, t, translateCrop, translateRegion, formatMicroUsdc } = useI18n();
  const progress = Math.round((campaign.tokensSold / campaign.totalSupply) * 100);

  return (
    <Link
      href={`/campaign/${campaign.id}`}
      className="panel block p-6 transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(31,42,35,0.12)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-soil/42">
            {translateRegion(campaign.region)}
          </p>
          <h3 className="mt-3 text-[1.55rem] font-semibold leading-tight tracking-[-0.045em] text-soil">
            {localizeContent(campaign.title, language)}
          </h3>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <TrustBadge score={campaign.trustScore} label={campaign.trustLabel} />
          <RiskBadge score={campaign.riskScore} />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-soil/68">
        {localizeContent(campaign.description, language)}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-bark/10 bg-[#f7f1e7] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-soil/72">
          {translateCrop(campaign.cropType)}
        </span>
        {campaign.trustReasons.slice(0, 2).map((reason) => (
          <span
            key={reason}
            className="rounded-full border border-bark/8 bg-white/72 px-3 py-1 text-[11px] text-soil/56"
          >
            {localizeContent(reason, language)}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-soil/58">
        <span>{t("card.progress")}</span>
        <span className="font-medium text-soil">{progress}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-bark/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-leaf via-[#688167] to-wheat"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 border-t border-bark/10 pt-4 text-sm text-soil/70">
        <span>
          {campaign.tokensSold}/{campaign.totalSupply} {t("card.tokens")}
        </span>
        <span className="font-semibold tracking-[-0.02em] text-soil">
          {formatMicroUsdc(campaign.pricePerToken)}
        </span>
      </div>
    </Link>
  );
}
