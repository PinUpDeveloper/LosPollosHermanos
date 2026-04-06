"use client";

import { CampaignCard } from "@/components/CampaignCard";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useI18n } from "@/lib/i18n";

export default function HomePage() {
  const { campaigns, loading } = useCampaigns();
  const { t, formatNumber } = useI18n();

  return (
    <div className="space-y-8 md:space-y-10">
      <section className="panel px-6 py-8 md:px-10 md:py-10">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_0.92fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-bark/10 bg-white/68 px-3 py-2">
              <span className="h-2 w-2 rounded-full bg-leaf" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-leaf/72">
                {t("home.eyebrow")}
              </p>
            </div>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-soil md:text-[4.2rem]">
              {t("home.title")}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-soil/70 md:text-lg">
              {t("home.subtitle")}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <MetricCard label={t("home.metric.live")} value={formatNumber(campaigns.length || 1)} />
            <MetricCard label={t("home.metric.secured")} value="100%" />
            <MetricCard label={t("home.metric.settlements")} value="24/7" />
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="panel p-6 text-sm text-soil/65">{t("home.loading")}</div>
        ) : campaigns.length > 0 ? (
          campaigns.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)
        ) : (
          <div className="panel p-6 text-sm text-soil/65">{t("home.empty")}</div>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-bark/10 bg-white/68 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-soil/42">{label}</p>
      <p className="mt-3 text-[2rem] font-semibold tracking-[-0.04em] text-soil">{value}</p>
    </div>
  );
}
