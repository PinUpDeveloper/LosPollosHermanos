"use client";

import { Campaign, CampaignLifecycleEvent } from "@/hooks/useCampaigns";
import { localizeContent } from "@/lib/contentLocalization";
import { useI18n } from "@/lib/i18n";

function truncateValue(value: string | null) {
  if (!value) return null;
  if (value.length <= 20) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function explorerUrl(address: string) {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

export function ProofTimeline({ campaign }: { campaign: Campaign }) {
  const { language, formatDate } = useI18n();
  const events = campaign.lifecycleEvents ?? [];

  const text =
    language === "ru"
      ? {
          title: "Хронология проверок",
          subtitle:
            "Короткая история кампании: проверка документов, этапы финансирования и готовность к выплатам.",
          actor: "участник",
          reference: "ссылка",
          open: "Открыть в Explorer",
          pending: "Ожидается",
        }
      : language === "kk"
        ? {
            title: "Тексеру хронологиясы",
            subtitle:
              "Кампания тарихы: құжаттарды тексеру, қаржыландыру кезеңдері және төлемге дайындық.",
            actor: "қатысушы",
            reference: "сілтеме",
            open: "Explorer-де ашу",
            pending: "Күтілуде",
          }
        : {
            title: "Verification timeline",
            subtitle:
              "A compact audit trail from campaign launch through proof review, funding milestones, and payout readiness.",
            actor: "actor",
            reference: "reference",
            open: "Open in Explorer",
            pending: "Pending",
          };

  return (
    <div className="panel p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-[-0.02em] text-soil">{text.title}</h3>
          <p className="mt-2 text-sm leading-6 text-soil/58">{text.subtitle}</p>
        </div>
        <span className="rounded-full border border-bark/10 bg-[#f5ede1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-soil/62">
          {events.length}
        </span>
      </div>

      <div className="ml-1 mt-6">
        {events.map((event: CampaignLifecycleEvent, i) => {
          const isLast = i === events.length - 1;
          const reference = truncateValue(event.referenceValue);
          const actor = truncateValue(event.actorWallet);
          const canOpenExplorer = !!event.explorerAddress && event.explorerAddress.length > 20;

          return (
            <div key={`${event.type}-${i}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
                    event.done
                      ? "border-leaf bg-leaf text-white"
                      : "border-bark/20 bg-[#fbf7f1] text-bark/50"
                  }`}
                >
                  {event.done ? (
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{i + 1}</span>
                  )}
                </div>
                {!isLast && (
                  <div className={`w-0.5 flex-1 ${event.done ? "bg-leaf/35" : "bg-bark/12"}`} />
                )}
              </div>

              <div className={isLast ? "" : "pb-6"}>
                <p className={`text-sm font-semibold ${event.done ? "text-soil" : "text-soil/46"}`}>
                  {localizeContent(event.label, language)}
                </p>
                <p className="mt-0.5 text-xs text-soil/45">
                  {event.occurredAt ? formatDate(event.occurredAt) : text.pending}
                </p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-soil/68">
                  {localizeContent(event.description, language)}
                </p>
                {(actor || reference || canOpenExplorer) && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {actor && (
                      <span className="rounded-full bg-mist px-3 py-1 text-soil/70">
                        {text.actor}: {actor}
                      </span>
                    )}
                    {reference && (
                      <span className="rounded-full bg-mist px-3 py-1 text-soil/70">
                        {text.reference}: {reference}
                      </span>
                    )}
                    {canOpenExplorer && (
                      <a
                        href={explorerUrl(event.explorerAddress!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-leaf/10 px-3 py-1 text-leaf transition hover:bg-leaf/15"
                      >
                        {text.open}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
