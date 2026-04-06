"use client";

import { FarmerPassport } from "@/hooks/useCampaigns";
import { localizeContent } from "@/lib/contentLocalization";
import { useI18n } from "@/lib/i18n";

type Props = {
  passport: FarmerPassport;
  title?: string;
};

function shortWallet(wallet: string) {
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

export function FarmerPassportCard({ passport, title }: Props) {
  const { language, formatNumber } = useI18n();

  const text =
    language === "ru"
      ? {
          title: title ?? "Паспорт фермера",
          subtitle:
            "Краткая репутационная сводка на основе истории на платформе и подтверждённых кампаний.",
          campaigns: "Кампаний",
          successful: "Успешных",
          verifiedProof: "Проверенных proof-данных",
          avgTrust: "Средний индекс доверия",
          harvestPace: "Скорость подтверждения урожая",
          empty: "Недостаточно подтверждённой истории по урожаю.",
          days: (count: number) => `В среднем ${formatNumber(count)} дней`,
          gold: "Золото",
          silver: "Серебро",
          bronze: "Бронза",
          reliability: "надёжность",
        }
      : language === "kk"
        ? {
            title: title ?? "Фермер паспорты",
            subtitle:
              "Платформадағы тарих пен расталған кампанияларға негізделген бедел көрінісі.",
            campaigns: "Кампания",
            successful: "Сәтті",
            verifiedProof: "Тексерілген proof-деректер",
            avgTrust: "Орташа сенім индексі",
            harvestPace: "Өнімді растау жылдамдығы",
            empty: "Расталған өнім тарихы жеткіліксіз.",
            days: (count: number) => `Орташа ${formatNumber(count)} күн`,
            gold: "Алтын",
            silver: "Күміс",
            bronze: "Қола",
            reliability: "сенімділік",
          }
        : {
            title: title ?? "Farmer passport",
            subtitle: "A reputation snapshot based on platform history and verified campaign activity.",
            campaigns: "Campaigns",
            successful: "Successful",
            verifiedProof: "Verified proof data",
            avgTrust: "Average trust score",
            harvestPace: "Harvest confirmation pace",
            empty: "Not enough confirmed harvest history yet.",
            days: (count: number) => `${formatNumber(count)} days on average`,
            gold: "Gold",
            silver: "Silver",
            bronze: "Bronze",
            reliability: "reliability",
          };

  const badgeTone =
    passport.reliabilityBadge === "GOLD"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : passport.reliabilityBadge === "SILVER"
        ? "border-slate-200 bg-slate-100 text-slate-700"
        : "border-orange-200 bg-orange-50 text-orange-700";

  const badgeLabel =
    passport.reliabilityBadge === "GOLD"
      ? text.gold
      : passport.reliabilityBadge === "SILVER"
        ? text.silver
        : text.bronze;

  return (
    <section className="panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-soil/45">{text.title}</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-soil">
            {shortWallet(passport.farmerWallet)}
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-soil/62">{text.subtitle}</p>
        </div>
        <span className={`rounded-full border px-4 py-2 text-sm font-semibold ${badgeTone}`}>
          {badgeLabel} {text.reliability}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={text.campaigns} value={formatNumber(passport.totalCampaigns)} />
        <StatCard label={text.successful} value={formatNumber(passport.successfulCampaigns)} />
        <StatCard label={text.verifiedProof} value={`${formatNumber(passport.verifiedProofShare)}%`} />
        <StatCard label={text.avgTrust} value={`${formatNumber(passport.averageTrustScore)}/100`} />
      </div>

      <div className="mt-4 rounded-[1.15rem] border border-bark/8 bg-[#f7f2e9] p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-soil/45">{text.harvestPace}</p>
        <p className="mt-2 text-lg text-soil">
          {passport.averageHarvestConfirmationDays !== null
            ? text.days(passport.averageHarvestConfirmationDays)
            : text.empty}
        </p>
      </div>

      {passport.highlights.length > 0 && (
        <div className="mt-4 grid gap-2.5">
          {passport.highlights.map((highlight) => (
            <div
              key={highlight}
              className="rounded-[1rem] border border-bark/8 bg-white/92 px-4 py-3 text-sm leading-6 text-soil/75 shadow-[0_10px_20px_rgba(31,42,35,0.04)]"
            >
              {localizeContent(highlight, language)}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-bark/8 bg-mist p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-soil/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-soil">{value}</p>
    </div>
  );
}
