"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "en" | "ru" | "kk";

type TranslationKey =
  | "nav.home"
  | "nav.farmer"
  | "nav.investor"
  | "lang.en"
  | "lang.ru"
  | "lang.kk"
  | "wallet.connect"
  | "wallet.disconnect"
  | "wallet.connecting"
  | "wallet.copy"
  | "wallet.copied"
  | "wallet.change"
  | "home.eyebrow"
  | "home.title"
  | "home.subtitle"
  | "home.loading"
  | "home.empty"
  | "home.metric.live"
  | "home.metric.secured"
  | "home.metric.settlements"
  | "card.progress"
  | "card.tokens"
  | "card.trust.high"
  | "card.trust.medium"
  | "card.trust.watch"
  | "card.risk.low"
  | "card.risk.medium"
  | "card.risk.high"
  | "status.active"
  | "status.funded"
  | "status.harvestSold"
  | "status.distributed"
  | "status.cancelled";

const translations: Record<AppLanguage, Record<TranslationKey, string>> = {
  en: {
    "nav.home": "Marketplace",
    "nav.farmer": "Farmer",
    "nav.investor": "Investor",
    "lang.en": "EN",
    "lang.ru": "RU",
    "lang.kk": "KZ",
    "wallet.connect": "Connect wallet",
    "wallet.disconnect": "Disconnect",
    "wallet.connecting": "Connecting...",
    "wallet.copy": "Copy address",
    "wallet.copied": "Copied",
    "wallet.change": "Change wallet",
    "home.eyebrow": "Solana harvest marketplace",
    "home.title": "Tokenized agricultural funding built for transparent working-capital flows.",
    "home.subtitle":
      "Farmers raise capital before harvest, investors buy a transparent share of future revenue, and settlements move through Solana.",
    "home.loading": "Loading campaigns...",
    "home.empty": "No campaigns yet.",
    "home.metric.live": "Live campaigns",
    "home.metric.secured": "Verified proof layer",
    "home.metric.settlements": "On-chain settlements",
    "card.progress": "Progress",
    "card.tokens": "tokens",
    "card.trust.high": "High trust",
    "card.trust.medium": "Medium trust",
    "card.trust.watch": "Needs review",
    "card.risk.low": "Low risk",
    "card.risk.medium": "Medium risk",
    "card.risk.high": "High risk",
    "status.active": "Live funding",
    "status.funded": "Fully funded",
    "status.harvestSold": "Harvest sold",
    "status.distributed": "Payouts sent",
    "status.cancelled": "Cancelled",
  },
  ru: {
    "nav.home": "Маркетплейс",
    "nav.farmer": "Фермеру",
    "nav.investor": "Инвестору",
    "lang.en": "EN",
    "lang.ru": "RU",
    "lang.kk": "KZ",
    "wallet.connect": "Подключить кошелёк",
    "wallet.disconnect": "Отключить",
    "wallet.connecting": "Подключение...",
    "wallet.copy": "Скопировать адрес",
    "wallet.copied": "Скопировано",
    "wallet.change": "Сменить кошелёк",
    "home.eyebrow": "Маркетплейс урожая на Solana",
    "home.title": "Токенизированное агрофинансирование с прозрачной логикой для фермеров и инвесторов.",
    "home.subtitle":
      "Фермеры получают оборотный капитал до сбора урожая, инвесторы покупают понятную долю будущей выручки, а расчёты проходят через Solana.",
    "home.loading": "Загрузка кампаний...",
    "home.empty": "Кампаний пока нет.",
    "home.metric.live": "Активные кампании",
    "home.metric.secured": "Проверенные proof-данные",
    "home.metric.settlements": "Расчёты on-chain",
    "card.progress": "Прогресс",
    "card.tokens": "токенов",
    "card.trust.high": "Высокое доверие",
    "card.trust.medium": "Среднее доверие",
    "card.trust.watch": "Требует проверки",
    "card.risk.low": "Низкий риск",
    "card.risk.medium": "Средний риск",
    "card.risk.high": "Высокий риск",
    "status.active": "Идёт сбор",
    "status.funded": "Собрано",
    "status.harvestSold": "Урожай продан",
    "status.distributed": "Выплаты отправлены",
    "status.cancelled": "Отменено",
  },
  kk: {
    "nav.home": "Маркетплейс",
    "nav.farmer": "Фермерге",
    "nav.investor": "Инвесторға",
    "lang.en": "EN",
    "lang.ru": "RU",
    "lang.kk": "KZ",
    "wallet.connect": "Әмиянды қосу",
    "wallet.disconnect": "Ажырату",
    "wallet.connecting": "Қосылуда...",
    "wallet.copy": "Мекенжайды көшіру",
    "wallet.copied": "Көшірілді",
    "wallet.change": "Әмиянды ауыстыру",
    "home.eyebrow": "Solana желісіндегі егін маркетплейсі",
    "home.title": "Фермер мен инвестор үшін түсінікті токенделген агроқаржыландыру.",
    "home.subtitle":
      "Фермерлер егінге дейін айналым капиталын алады, инвесторлар болашақ табыстың түсінікті үлесін сатып алады, ал есеп айырысу Solana арқылы өтеді.",
    "home.loading": "Кампаниялар жүктелуде...",
    "home.empty": "Әзірге кампания жоқ.",
    "home.metric.live": "Белсенді кампаниялар",
    "home.metric.secured": "Тексерілген proof-деректер",
    "home.metric.settlements": "On-chain есеп айырысу",
    "card.progress": "Прогресс",
    "card.tokens": "токен",
    "card.trust.high": "Сенім жоғары",
    "card.trust.medium": "Сенім орташа",
    "card.trust.watch": "Қосымша тексеру керек",
    "card.risk.low": "Тәуекел төмен",
    "card.risk.medium": "Тәуекел орташа",
    "card.risk.high": "Тәуекел жоғары",
    "status.active": "Қаржы жиналып жатыр",
    "status.funded": "Толық жиналды",
    "status.harvestSold": "Өнім сатылды",
    "status.distributed": "Төлемдер жіберілді",
    "status.cancelled": "Тоқтатылды",
  },
};

const cropLabels = {
  wheat: { en: "Wheat", ru: "Пшеница", kk: "Бидай" },
  barley: { en: "Barley", ru: "Ячмень", kk: "Арпа" },
  sunflower: { en: "Sunflower", ru: "Подсолнечник", kk: "Күнбағыс" },
  rapeseed: { en: "Rapeseed", ru: "Рапс", kk: "Рапс" },
} as const;

const regionLabels = {
  akmola: { en: "Akmola Region", ru: "Акмолинская область", kk: "Ақмола облысы" },
  kostanay: { en: "Kostanay Region", ru: "Костанайская область", kk: "Қостанай облысы" },
  northKazakhstan: {
    en: "North Kazakhstan Region",
    ru: "Северо-Казахстанская область",
    kk: "Солтүстік Қазақстан облысы",
  },
  pavlodar: { en: "Pavlodar Region", ru: "Павлодарская область", kk: "Павлодар облысы" },
} as const;

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey) => string;
  locale: string;
  formatNumber: (value: number) => string;
  formatDate: (value: string | number | Date | null | undefined) => string;
  formatMicroUsdc: (value: number) => string;
  translateStatus: (status: string) => string;
  translateTrustLabel: (label: string | null) => string;
  translateRiskLabel: (score: number | null) => string;
  translateCrop: (value: string) => string;
  translateRegion: (value: string) => string;
  cropOptions: Array<{ value: string; label: string }>;
  regionOptions: Array<{ value: string; label: string }>;
};

const storageKey = "agrotoken-language";
const I18nContext = createContext<I18nContextValue | null>(null);

function normalizeCrop(value: string) {
  const source = value.trim().toLowerCase();
  if (source.includes("wheat") || source.includes("пш") || source.includes("бидай")) return "wheat";
  if (source.includes("barley") || source.includes("яч") || source.includes("арпа")) return "barley";
  if (source.includes("sunflower") || source.includes("подс") || source.includes("күн")) return "sunflower";
  if (source.includes("rape") || source.includes("рап")) return "rapeseed";
  return null;
}

function normalizeRegion(value: string) {
  const source = value.trim().toLowerCase();
  if (source.includes("akm") || source.includes("акм") || source.includes("ақм")) return "akmola";
  if (source.includes("kost") || source.includes("кост") || source.includes("қост")) return "kostanay";
  if (source.includes("north") || source.includes("север") || source.includes("солт")) {
    return "northKazakhstan";
  }
  if (source.includes("pavl") || source.includes("павл")) return "pavlodar";
  return null;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>("ru");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey) as AppLanguage | null;
    if (saved && translations[saved]) {
      setLanguage(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, language);
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo<I18nContextValue>(() => {
    const locale = language === "ru" ? "ru-RU" : language === "kk" ? "kk-KZ" : "en-US";
    const t = (key: TranslationKey) => translations[language][key];

    return {
      language,
      setLanguage,
      t,
      locale,
      formatNumber: (value: number) => new Intl.NumberFormat(locale).format(value),
      formatDate: (value) =>
        value
          ? new Intl.DateTimeFormat(locale, {
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date(value))
          : "—",
      formatMicroUsdc: (value: number) =>
        `${new Intl.NumberFormat(locale).format(value / 1_000_000)} USDC`,
      translateStatus: (status: string) => {
        switch (status) {
          case "ACTIVE":
            return t("status.active");
          case "FUNDED":
            return t("status.funded");
          case "HARVEST_SOLD":
            return t("status.harvestSold");
          case "DISTRIBUTED":
            return t("status.distributed");
          case "CANCELLED":
            return t("status.cancelled");
          default:
            return status;
        }
      },
      translateTrustLabel: (label: string | null) => {
        switch (label) {
          case "HIGH_TRUST":
            return t("card.trust.high");
          case "MEDIUM_TRUST":
            return t("card.trust.medium");
          default:
            return t("card.trust.watch");
        }
      },
      translateRiskLabel: (score: number | null) => {
        if (score === null) return "";
        if (score <= 33) return t("card.risk.low");
        if (score <= 66) return t("card.risk.medium");
        return t("card.risk.high");
      },
      translateCrop: (value: string) => {
        const normalized = normalizeCrop(value);
        return normalized ? cropLabels[normalized][language] : value;
      },
      translateRegion: (value: string) => {
        const normalized = normalizeRegion(value);
        return normalized ? regionLabels[normalized][language] : value;
      },
      cropOptions: Object.values(cropLabels).map((entry) => ({
        value: entry.en,
        label: entry[language],
      })),
      regionOptions: Object.values(regionLabels).map((entry) => ({
        value: entry.en,
        label: entry[language],
      })),
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return context;
}
