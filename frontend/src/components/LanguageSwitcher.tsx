"use client";

import { AppLanguage, useI18n } from "@/lib/i18n";

const languages: AppLanguage[] = ["en", "ru", "kk"];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-full border border-bark/10 bg-white/78 p-1">
      {languages.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLanguage(value)}
          className={`rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] transition ${
            language === value
              ? "bg-leaf text-[#f6f1e8]"
              : "text-soil/56 hover:bg-mist hover:text-soil"
          }`}
        >
          {t(`lang.${value}`)}
        </button>
      ))}
    </div>
  );
}
