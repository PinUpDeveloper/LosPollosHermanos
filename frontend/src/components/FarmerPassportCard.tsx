"use client";

import { FarmerPassport } from "@/hooks/useCampaigns";

type FarmerPassportCardProps = {
  passport: FarmerPassport;
  title?: string;
};

function shortWallet(wallet: string) {
  if (wallet.length <= 12) {
    return wallet;
  }
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export function FarmerPassportCard({ passport, title = "Farmer Passport" }: FarmerPassportCardProps) {
  const badgeTone =
    passport.reliabilityBadge === "GOLD"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : passport.reliabilityBadge === "SILVER"
        ? "bg-slate-100 text-slate-700 border-slate-200"
        : "bg-orange-50 text-orange-700 border-orange-200";

  const badgeLabel =
    passport.reliabilityBadge === "GOLD"
      ? "Gold"
      : passport.reliabilityBadge === "SILVER"
        ? "Silver"
        : "Bronze";

  return (
    <section className="rounded-[2rem] border border-bark/10 bg-white p-6 shadow-[0_20px_60px_rgba(30,41,59,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-soil/45">{title}</p>
          <h3 className="mt-2 font-display text-2xl text-bark">{shortWallet(passport.farmerWallet)}</h3>
          <p className="mt-1 text-sm text-soil/60">Reputation snapshot built from the farmer&apos;s platform history</p>
        </div>
        <span className={`rounded-full border px-4 py-2 text-sm font-semibold ${badgeTone}`}>
          {badgeLabel} Reliability
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl bg-mist p-4">
          <p className="text-xs uppercase tracking-wider text-soil/45">Campaigns</p>
          <p className="mt-2 text-2xl font-semibold text-bark">{passport.totalCampaigns}</p>
        </div>
        <div className="rounded-3xl bg-mist p-4">
          <p className="text-xs uppercase tracking-wider text-soil/45">Successful</p>
          <p className="mt-2 text-2xl font-semibold text-bark">{passport.successfulCampaigns}</p>
        </div>
        <div className="rounded-3xl bg-mist p-4">
          <p className="text-xs uppercase tracking-wider text-soil/45">Verified Proof</p>
          <p className="mt-2 text-2xl font-semibold text-bark">{passport.verifiedProofShare}%</p>
        </div>
        <div className="rounded-3xl bg-mist p-4">
          <p className="text-xs uppercase tracking-wider text-soil/45">Avg Trust</p>
          <p className="mt-2 text-2xl font-semibold text-bark">{passport.averageTrustScore}/100</p>
        </div>
      </div>

      <div className="mt-4 rounded-3xl bg-mist/60 p-4">
        <p className="text-xs uppercase tracking-wider text-soil/45">Harvest Confirmation Pace</p>
        <p className="mt-2 text-lg text-bark">
          {passport.averageHarvestConfirmationDays !== null
            ? `${passport.averageHarvestConfirmationDays} days on average`
            : "Not enough confirmed harvest history yet"}
        </p>
      </div>

      {passport.highlights.length > 0 && (
        <div className="mt-4 grid gap-2">
          {passport.highlights.map((highlight) => (
            <div key={highlight} className="rounded-2xl border border-bark/8 bg-white px-4 py-3 text-sm text-soil/75">
              {highlight}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
