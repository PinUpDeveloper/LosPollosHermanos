"use client";

import { Campaign, CampaignLifecycleEvent } from "@/hooks/useCampaigns";

function formatDate(iso: string | null): string {
  if (!iso) return "Pending";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateValue(value: string | null) {
  if (!value) return null;
  if (value.length <= 20) return value;
  return `${value.slice(0, 10)}...${value.slice(-6)}`;
}

function explorerUrl(address: string) {
  return `https://explorer.solana.com/address/${address}?cluster=devnet`;
}

export function ProofTimeline({ campaign }: { campaign: Campaign }) {
  const events = campaign.lifecycleEvents ?? [];

  return (
    <div className="rounded-3xl border border-bark/15 bg-white p-6">
      <h3 className="font-display text-xl">Live Proof Stream</h3>
      <p className="mt-1 text-sm text-soil/55">
        Live audit trail kampanii ot sozdaniya i proof verification do funding milestones i payout.
      </p>

      <div className="mt-5 ml-1">
        {events.map((event: CampaignLifecycleEvent, i) => {
          const isLast = i === events.length - 1;
          const reference = truncateValue(event.referenceValue);
          const actor = truncateValue(event.actorWallet);
          const canOpenExplorer = !!event.explorerAddress && event.explorerAddress.length > 20;

          return (
            <div key={`${event.type}-${i}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                    event.done
                      ? "border-leaf bg-leaf text-white"
                      : "border-bark/25 bg-white text-bark/30"
                  }`}
                >
                  {event.done ? (
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
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
                  <div
                    className={`w-0.5 flex-1 ${event.done ? "bg-leaf/40" : "bg-bark/12"}`}
                  />
                )}
              </div>

              <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                <p className={`text-sm font-medium ${event.done ? "text-soil" : "text-soil/40"}`}>
                  {event.label}
                </p>
                <p className="mt-0.5 text-xs text-soil/45">{formatDate(event.occurredAt)}</p>
                <p className="mt-1 text-sm text-soil/65">{event.description}</p>
                {(actor || reference || canOpenExplorer) && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {actor && (
                      <span className="rounded-full bg-mist px-3 py-1 text-soil/70">
                        actor: {actor}
                      </span>
                    )}
                    {reference && (
                      <span className="rounded-full bg-mist px-3 py-1 text-soil/70">
                        ref: {reference}
                      </span>
                    )}
                    {canOpenExplorer && (
                      <a
                        href={explorerUrl(event.explorerAddress!)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full bg-leaf/10 px-3 py-1 text-leaf hover:bg-leaf/15"
                      >
                        Open in Explorer
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
