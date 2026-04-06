"use client";

import { AppLanguage } from "@/lib/i18n";

const exactTextMap = {
  "Akmola Wheat 2026": {
    ru: "Пшеница, Акмолинская область, 2026",
    kk: "Ақмола облысы бидайы, 2026",
  },
  "Kostanay Barley 2026": {
    ru: "Ячмень, Костанайская область, 2026",
    kk: "Қостанай облысы арпасы, 2026",
  },
  "Working-capital round for wheat cultivation with transparent payout logic after harvest.": {
    ru: "Раунд оборотного финансирования для выращивания пшеницы с прозрачной логикой выплат после сбора урожая.",
    kk: "Егіннен кейінгі төлем механикасы түсінікті бидай өсіруге арналған айналым қаржыландыру раунды.",
  },
  "Seasonal barley campaign with proof documents and on-chain revenue distribution.": {
    ru: "Сезонная кампания по ячменю с подтверждающими документами и on-chain распределением выручки.",
    kk: "Растайтын құжаттары және on-chain табыс бөлу механикасы бар маусымдық арпа кампаниясы.",
  },
  "Runtime verification campaign": {
    ru: "Кампания с оперативной проверкой",
    kk: "Жедел тексеруі бар кампания",
  },
  "Sequential runtime verification campaign": {
    ru: "Кампания с поэтапной проверкой",
    kk: "Кезең-кезеңімен тексерілетін кампания",
  },
  "Live Proof Stream Sequential Check": {
    ru: "Последовательная проверка подтверждений",
    kk: "Растауларды кезең-кезеңімен тексеру",
  },
  "Trust Score Runtime Check": {
    ru: "Оперативная проверка индекса доверия",
    kk: "Сенім индексін жедел тексеру",
  },
  "Proof document uploaded and verified": {
    ru: "Подтверждающий документ загружен и успешно проверен",
    kk: "Растайтын құжат жүктеліп, тексеруден өтті",
  },
  "Proof document uploaded and awaiting review": {
    ru: "Подтверждающий документ загружен и ожидает проверки",
    kk: "Растайтын құжат жүктеліп, тексеруді күтіп тұр",
  },
  "Proof-of-asset verified by oracle": {
    ru: "Проверка подтверждающего документа завершена",
    kk: "Растайтын құжат тексеруден өтті",
  },
  "Trust estimate is provisional until AI risk scoring completes": {
    ru: "Индекс доверия пока предварительный, пока не завершена оценка AI-риска",
    kk: "AI тәуекел бағасы толық аяқталғанша сенім индексі алдын ала көрсетіледі",
  },
  "Farmer has prior campaign history on the platform": {
    ru: "У фермера уже есть история кампаний на платформе",
    kk: "Фермердің платформада бұрынғы кампания тарихы бар",
  },
  "Farmer already has platform history": {
    ru: "У фермера уже есть история на платформе",
    kk: "Фермердің платформада бұрыннан тарихы бар",
  },
  "Funding traction is already visible": {
    ru: "Интерес со стороны инвесторов уже заметен",
    kk: "Инвестор қызығушылығы қазірдің өзінде байқалады",
  },
  "AI model sees moderate campaign risk": {
    ru: "AI-модель оценивает риск кампании как умеренный",
    kk: "AI-модель кампания тәуекелін орташа деп бағалайды",
  },
  "Average trust score across campaigns: 71/100": {
    ru: "Средний индекс доверия по всем кампаниям: 71/100",
    kk: "Барлық кампания бойынша орташа сенім индексі: 71/100",
  },
  "Average trust score across campaigns: 56/100": {
    ru: "Средний индекс доверия по всем кампаниям: 56/100",
    kk: "Барлық кампания бойынша орташа сенім индексі: 56/100",
  },
  "67% of campaigns have verified proof data": {
    ru: "У 67% кампаний подтверждающие данные уже проверены",
    kk: "Кампаниялардың 67%-ында растайтын деректер тексерілген",
  },
  "50% of campaigns have verified proof data": {
    ru: "У 50% кампаний подтверждающие данные уже проверены",
    kk: "Кампаниялардың 50%-ында растайтын деректер тексерілген",
  },
  "50% of campaigns have verified proof-of-asset": {
    ru: "У 50% кампаний подтверждение актива уже проверено",
    kk: "Кампаниялардың 50%-ында актив расталуы тексерілген",
  },
  "Average time to harvest confirmation: 204 days": {
    ru: "Среднее время до подтверждения урожая: 204 дня",
    kk: "Өнімді растауға дейінгі орташа уақыт: 204 күн",
  },
  "Average time to harvest confirmation: 0 days": {
    ru: "Среднее время до подтверждения урожая: 0 дней",
    kk: "Өнімді растауға дейінгі орташа уақыт: 0 күн",
  },
  "1 completed campaign reached payout distribution": {
    ru: "1 завершённая кампания дошла до распределения выплат",
    kk: "1 аяқталған кампания төлемдерді бөлу кезеңіне жетті",
  },
  "Campaign created": {
    ru: "Кампания создана",
    kk: "Кампания құрылды",
  },
  "Proof uploaded": {
    ru: "Документ загружен",
    kk: "Құжат жүктелді",
  },
  "Proof verified": {
    ru: "Проверка документа завершена",
    kk: "Құжат тексерілді",
  },
  "Oracle verified proof": {
    ru: "Проверка документа завершена",
    kk: "Құжат тексерілді",
  },
  "25% funded": {
    ru: "Собрано 25%",
    kk: "25% жиналды",
  },
  "50% funded": {
    ru: "Собрано 50%",
    kk: "50% жиналды",
  },
  "100% funded": {
    ru: "Собрано 100%",
    kk: "100% жиналды",
  },
  "Harvest confirmed": {
    ru: "Урожай подтверждён",
    kk: "Өнім расталды",
  },
  "Payout distributed": {
    ru: "Выплаты распределены",
    kk: "Төлемдер таратылды",
  },
  "The campaign was created and its on-chain lifecycle started.": {
    ru: "Кампания была создана, и её on-chain жизненный цикл начался.",
    kk: "Кампания құрылды және оның on-chain өмірлік циклі басталды.",
  },
  "The farmer created the campaign and the on-chain lifecycle started.": {
    ru: "Фермер создал кампанию, после чего начался её on-chain цикл.",
    kk: "Фермер кампанияны құрды, содан кейін оның on-chain циклі басталды.",
  },
  "A proof document was attached and its hash was linked to the campaign.": {
    ru: "Подтверждающий документ был прикреплён, а его хеш привязан к кампании.",
    kk: "Растайтын құжат тіркеліп, оның hash-і кампаниямен байланыстырылды.",
  },
  "Proof-of-asset document was attached and its hash was linked to the campaign.": {
    ru: "Подтверждающий документ был прикреплён, а его хеш привязан к кампании.",
    kk: "Растайтын құжат тіркеліп, оның hash-і кампаниямен байланыстырылды.",
  },
  "The uploaded document was checked and matched the real-world asset.": {
    ru: "Загруженный документ был проверен и подтвердил соответствие реальному активу.",
    kk: "Жүктелген құжат тексеріліп, нақты активке сәйкес екені расталды.",
  },
  "The oracle or verifier confirmed that the uploaded proof matches the real-world asset.": {
    ru: "Проверка подтвердила, что загруженный документ соответствует реальному активу.",
    kk: "Тексеру жүктелген құжаттың нақты активке сәйкес екенін растады.",
  },
  "The campaign passed its first investor milestone.": {
    ru: "Кампания прошла первый этап подтверждённого интереса инвесторов.",
    kk: "Кампания инвестор қызығушылығының алғашқы кезеңінен өтті.",
  },
  "The campaign passed the first investor traction milestone.": {
    ru: "Кампания прошла первый этап подтверждённого спроса со стороны инвесторов.",
    kk: "Кампания инвестор сұранысының алғашқы кезеңінен өтті.",
  },
  "The campaign reached the midpoint of its funding target.": {
    ru: "Кампания достигла середины своей цели по сбору средств.",
    kk: "Кампания қаржыландыру мақсатының ортасына жетті.",
  },
  "The campaign fully sold its tokenized allocation.": {
    ru: "Кампания полностью продала свой токенизированный объём.",
    kk: "Кампания токенделген көлемін толық сатты.",
  },
  "The campaign fully sold its tokenized funding allocation.": {
    ru: "Кампания полностью продала весь токенизированный объём финансирования.",
    kk: "Кампания токенделген қаржыландыру көлемін толық сатты.",
  },
  "The harvest result was confirmed and the campaign moved toward payout.": {
    ru: "Результат урожая был подтверждён, и кампания перешла к этапу выплат.",
    kk: "Өнім нәтижесі расталып, кампания төлем кезеңіне өтті.",
  },
  "Revenue distribution for token holders was finalized.": {
    ru: "Распределение выручки между держателями токенов было завершено.",
    kk: "Токен иелеріне табысты бөлу аяқталды.",
  },
} as const;

export function localizeContent(value: string | null | undefined, language: AppLanguage) {
  if (!value || language === "en") return value ?? "";
  return exactTextMap[value as keyof typeof exactTextMap]?.[language] ?? value;
}
