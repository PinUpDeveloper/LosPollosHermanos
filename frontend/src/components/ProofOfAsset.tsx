"use client";

import { Campaign } from "@/hooks/useCampaigns";

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  UPLOADED: { label: "Загружен", bg: "bg-wheat/20", text: "text-wheat" },
  VERIFIED: { label: "Верифицирован", bg: "bg-leaf/15", text: "text-leaf" },
  REJECTED: { label: "Отклонён", bg: "bg-red-100", text: "text-red-700" },
  PENDING: { label: "Ожидает загрузки", bg: "bg-bark/10", text: "text-bark" },
};

function ProofStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${config.bg} ${config.text}`}>
      {status === "VERIFIED" && (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      {status === "REJECTED" && (
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
      {config.label}
    </span>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "---";
  return new Date(iso).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncateWallet(wallet: string | null) {
  if (!wallet) return "---";
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export function ProofOfAsset({ campaign }: { campaign: Campaign }) {
  const status = campaign.proofStatus || "PENDING";
  const isVerified = status === "VERIFIED";

  return (
    <div className="rounded-3xl border border-bark/15 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl">Proof-of-Asset</h3>
        <ProofStatusBadge status={status} />
      </div>

      <p className="mt-2 text-sm text-soil/60">
        Подтверждение связи между реальным сельскохозяйственным активом и токеном на блокчейне Solana.
      </p>

      <div className="mt-5 space-y-4">
        {/* SHA-256 Hash */}
        <div className="rounded-2xl bg-mist p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-soil/50">SHA-256 Hash документа</p>
          <p className="mt-1.5 break-all font-mono text-sm text-soil">
            {campaign.proofHash || "Не загружен"}
          </p>
          <p className="mt-1 text-xs text-soil/40">
            Хеш хранится on-chain в поле proof_hash аккаунта кампании
          </p>
        </div>

        {/* Document link */}
        {campaign.proofDocumentUrl && campaign.proofDocumentUrl !== "#" && (
          <div className="rounded-2xl bg-mist p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-soil/50">Документ подтверждения</p>
            <a
              href={campaign.proofDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-leaf hover:underline"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Открыть документ
            </a>
          </div>
        )}

        {/* Timeline grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-mist p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-soil/50">Загружен</p>
            <p className="mt-1.5 text-sm">{formatDate(campaign.proofUploadedAt)}</p>
          </div>
          <div className="rounded-2xl bg-mist p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-soil/50">
              {isVerified ? "Верифицирован" : "Верификация"}
            </p>
            <p className="mt-1.5 text-sm">{formatDate(campaign.proofVerifiedAt)}</p>
          </div>
        </div>

        {/* Verifier info */}
        {campaign.proofVerifierWallet && (
          <div className="rounded-2xl bg-mist p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-soil/50">Oracle / Верификатор</p>
            <p className="mt-1.5 font-mono text-sm">{truncateWallet(campaign.proofVerifierWallet)}</p>
            <p className="mt-1 text-xs text-soil/40">
              Кошелёк оракула, подтвердившего соответствие документа реальному активу
            </p>
          </div>
        )}
      </div>

      {/* Verification narrative */}
      <div className="mt-5 rounded-2xl border border-bark/10 bg-mist/50 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-soil/50">Как работает верификация</p>
        <ol className="mt-2 space-y-1.5 text-sm text-soil/70">
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf/15 text-xs font-bold text-leaf">1</span>
            Фермер загружает документ (акт о земельном участке, договор страхования, фото посевов) и его SHA-256 хеш записывается on-chain.
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf/15 text-xs font-bold text-leaf">2</span>
            Назначенный оракул проверяет документ и подтверждает его подлинность, подписывая транзакцию верификации.
          </li>
          <li className="flex gap-2">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf/15 text-xs font-bold text-leaf">3</span>
            Инвесторы могут независимо проверить хеш документа, сравнив его с on-chain значением в аккаунте кампании.
          </li>
        </ol>
      </div>
    </div>
  );
}
