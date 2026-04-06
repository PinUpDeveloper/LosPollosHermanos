"use client";

import { Campaign } from "@/hooks/useCampaigns";
import { useI18n } from "@/lib/i18n";

function truncateWallet(wallet: string | null) {
  if (!wallet) return "—";
  if (wallet.length <= 12) return wallet;
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export function ProofOfAsset({ campaign }: { campaign: Campaign }) {
  const { language } = useI18n();
  const status = campaign.proofStatus || "PENDING";

  const text =
    language === "ru"
      ? {
          title: "Подтверждение актива",
          subtitle:
            "Этот блок связывает реальный сельскохозяйственный актив с его токенизированным представлением в Solana.",
          hash: "SHA-256 хеш документа",
          hashHint: "Хеш хранится on-chain в аккаунте кампании.",
          missing: "Не загружен",
          document: "Подтверждающий документ",
          open: "Открыть документ",
          uploaded: "Загружен",
          verification: "Проверка",
          verified: "Проверен",
          verifier: "Проверяющий адрес",
          verifierHint: "Кошелёк, с которого была подтверждена проверка документа.",
          workflow: "Как проходит проверка",
          step1: "Фермер загружает документ, а его SHA-256 хеш записывается on-chain.",
          step2: "Результат проверки подтверждается подписанной транзакцией.",
          step3: "Инвесторы могут самостоятельно сравнить хеш файла с on-chain значением.",
          statusMap: {
            UPLOADED: "Загружен",
            VERIFIED: "Проверен",
            REJECTED: "Отклонён",
            PENDING: "Ожидает загрузки",
          },
        }
      : language === "kk"
        ? {
            title: "Активті растау",
            subtitle:
              "Бұл бөлім нақты ауыл шаруашылығы активін оның Solana желісіндегі токенделген нұсқасымен байланыстырады.",
            hash: "Құжаттың SHA-256 hash-і",
            hashHint: "Hash on-chain кампания аккаунтында сақталады.",
            missing: "Жүктелмеген",
            document: "Растайтын құжат",
            open: "Құжатты ашу",
            uploaded: "Жүктелді",
            verification: "Тексеру",
            verified: "Тексерілді",
            verifier: "Тексеруші адрес",
            verifierHint: "Құжат тексеруі расталған әмиян.",
            workflow: "Тексеру қалай өтеді",
            step1: "Фермер құжатты жүктейді, ал оның SHA-256 hash-і on-chain жазылады.",
            step2: "Тексеру нәтижесі қол қойылған транзакциямен расталады.",
            step3: "Инвесторлар файл hash-ін on-chain мәнімен өздері салыстыра алады.",
            statusMap: {
              UPLOADED: "Жүктелді",
              VERIFIED: "Тексерілді",
              REJECTED: "Қабылданбады",
              PENDING: "Жүктеуді күтіп тұр",
            },
          }
        : {
            title: "Proof of asset",
            subtitle:
              "This section links the real agricultural asset to its tokenized representation on Solana.",
            hash: "SHA-256 document hash",
            hashHint: "The hash is stored on-chain inside the campaign account.",
            missing: "Not uploaded",
            document: "Verification document",
            open: "Open document",
            uploaded: "Uploaded",
            verification: "Verification",
            verified: "Verified",
            verifier: "Verifier wallet",
            verifierHint: "Wallet that confirmed the proof review result.",
            workflow: "How verification works",
            step1: "The farmer uploads a supporting document and its SHA-256 hash is written on-chain.",
            step2: "The verification result is confirmed with a signed transaction.",
            step3: "Investors can compare the source file hash with the on-chain value.",
            statusMap: {
              UPLOADED: "Uploaded",
              VERIFIED: "Verified",
              REJECTED: "Rejected",
              PENDING: "Waiting for upload",
            },
          };

  const tone =
    status === "VERIFIED"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "REJECTED"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-[#dbc8ac] bg-[#f7efe3] text-[#6f5732]";

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    return new Intl.DateTimeFormat(
      language === "ru" ? "ru-RU" : language === "kk" ? "kk-KZ" : "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(new Date(value));
  };

  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold tracking-[-0.02em] text-soil">{text.title}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-soil/60">{text.subtitle}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${tone}`}>
          {text.statusMap[status as keyof typeof text.statusMap] ?? text.statusMap.PENDING}
        </span>
      </div>

      <div className="mt-5 space-y-4">
        <Card label={text.hash} hint={text.hashHint}>
          <p className="mt-1.5 break-all font-mono text-sm text-soil">
            {campaign.proofHash || text.missing}
          </p>
        </Card>

        {campaign.proofDocumentUrl && campaign.proofDocumentUrl !== "#" && (
          <Card label={text.document}>
            <a
              href={campaign.proofDocumentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium text-leaf transition hover:text-soil hover:underline"
            >
              {text.open}
            </a>
          </Card>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Card label={text.uploaded}>
            <p className="mt-1.5 text-sm text-soil">{formatDate(campaign.proofUploadedAt)}</p>
          </Card>
          <Card label={status === "VERIFIED" ? text.verified : text.verification}>
            <p className="mt-1.5 text-sm text-soil">{formatDate(campaign.proofVerifiedAt)}</p>
          </Card>
        </div>

        {campaign.proofVerifierWallet && (
          <Card label={text.verifier} hint={text.verifierHint}>
            <p className="mt-1.5 font-mono text-sm text-soil">
              {truncateWallet(campaign.proofVerifierWallet)}
            </p>
          </Card>
        )}
      </div>

      <div className="mt-5 rounded-[1.1rem] border border-bark/10 bg-[#f7f2e9] p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-soil/45">{text.workflow}</p>
        <ol className="mt-3 space-y-2 text-sm leading-6 text-soil/72">
          <li>1. {text.step1}</li>
          <li>2. {text.step2}</li>
          <li>3. {text.step3}</li>
        </ol>
      </div>
    </div>
  );
}

function Card({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1rem] border border-bark/8 bg-mist p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-soil/45">{label}</p>
      {children}
      {hint && <p className="mt-1 text-xs text-soil/45">{hint}</p>}
    </div>
  );
}
