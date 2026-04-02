"use client";

import { Campaign } from "@/hooks/useCampaigns";

type Step = {
  label: string;
  date: string | null;
  done: boolean;
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_ORDER = ["ACTIVE", "FUNDED", "HARVEST_SOLD", "DISTRIBUTED"];

function statusReached(current: string, target: string): boolean {
  const ci = STATUS_ORDER.indexOf(current);
  const ti = STATUS_ORDER.indexOf(target);
  if (ci === -1 || ti === -1) return false;
  return ci >= ti;
}

function buildSteps(campaign: Campaign): Step[] {
  const steps: Step[] = [];

  // 1. Campaign created
  steps.push({
    label: "Кампания создана",
    date: campaign.createdAt,
    done: true,
  });

  // 2. Proof uploaded
  steps.push({
    label: "Proof-of-Asset загружен",
    date: campaign.proofUploadedAt,
    done: !!campaign.proofUploadedAt,
  });

  // 3. Oracle verified
  steps.push({
    label: "Oracle верифицировал",
    date: campaign.proofVerifiedAt,
    done: campaign.proofStatus === "VERIFIED",
  });

  // 4. Fully funded
  const funded = statusReached(campaign.status, "FUNDED");
  steps.push({
    label: "Полностью профинансировано",
    date: null,
    done: funded,
  });

  // 5. Harvest sold
  const harvestSold = statusReached(campaign.status, "HARVEST_SOLD");
  steps.push({
    label: "Урожай продан",
    date: null,
    done: harvestSold,
  });

  // 6. Distributed
  const distributed = statusReached(campaign.status, "DISTRIBUTED");
  steps.push({
    label: "Выплаты распределены",
    date: null,
    done: distributed,
  });

  return steps;
}

export function ProofTimeline({ campaign }: { campaign: Campaign }) {
  const steps = buildSteps(campaign);

  return (
    <div className="rounded-3xl border border-bark/15 bg-white p-6">
      <h3 className="font-display text-xl">Lifecycle кампании</h3>
      <p className="mt-1 text-sm text-soil/55">
        Полный путь актива от создания до выплаты инвесторам.
      </p>

      <div className="mt-5 ml-1">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;

          return (
            <div key={i} className="flex gap-4">
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
                    step.done
                      ? "border-leaf bg-leaf text-white"
                      : "border-bark/25 bg-white text-bark/30"
                  }`}
                >
                  {step.done ? (
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
                    className={`w-0.5 flex-1 ${
                      step.done ? "bg-leaf/40" : "bg-bark/12"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
                <p
                  className={`text-sm font-medium ${
                    step.done ? "text-soil" : "text-soil/40"
                  }`}
                >
                  {step.label}
                </p>
                {step.date && (
                  <p className="mt-0.5 text-xs text-soil/45">
                    {formatDate(step.date)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
