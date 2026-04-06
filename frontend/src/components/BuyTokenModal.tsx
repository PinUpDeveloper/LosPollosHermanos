"use client";

import { FormEvent, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
  pricePerToken: number;
  remainingSupply: number;
};

export function BuyTokenModal({
  open,
  onClose,
  onSubmit,
  pricePerToken,
  remainingSupply,
}: Props) {
  const { language, formatNumber, formatMicroUsdc } = useI18n();
  const [amount, setAmount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const text = useMemo(
    () =>
      ({
        en: {
          title: "Buy harvest allocation",
          subtitle: "Choose how many tokens to purchase. The transaction will be signed with Phantom.",
          total: "Total",
          cancel: "Cancel",
          submit: "Sign and send",
          signing: "Signing...",
          min: "Minimum purchase is 1 token.",
          max: `Only ${formatNumber(remainingSupply)} tokens remain.`,
          tx: "Transaction failed.",
        },
        ru: {
          title: "Купить долю урожая",
          subtitle: "Выберите количество токенов. Транзакция будет подписана через Phantom.",
          total: "Итого",
          cancel: "Отмена",
          submit: "Подписать и отправить",
          signing: "Подписание...",
          min: "Минимальная покупка — 1 токен.",
          max: `Осталось только ${formatNumber(remainingSupply)} токенов.`,
          tx: "Ошибка транзакции.",
        },
        kk: {
          title: "Егін үлесін сатып алу",
          subtitle: "Сатып алатын токен санын таңдаңыз. Транзакция Phantom арқылы қол қойылады.",
          total: "Жалпы",
          cancel: "Бас тарту",
          submit: "Қол қойып жіберу",
          signing: "Қол қойылуда...",
          min: "Ең аз сатып алу мөлшері — 1 токен.",
          max: `Тек ${formatNumber(remainingSupply)} токен қалды.`,
          tx: "Транзакция қатесі.",
        },
      })[language],
    [formatNumber, language, remainingSupply],
  );

  if (!open) return null;

  const normalizedAmount = amount === "" ? 0 : Number(amount);
  const totalUsdc = normalizedAmount * pricePerToken;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 1) {
      setError(text.min);
      return;
    }
    if (parsedAmount > remainingSupply) {
      setError(text.max);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(parsedAmount);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : text.tx);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#243126]/26 p-4 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="panel w-full max-w-md p-6">
        <h3 className="text-2xl font-semibold tracking-[-0.03em] text-soil">{text.title}</h3>
        <p className="mt-2 text-sm leading-6 text-soil/65">{text.subtitle}</p>
        <input
          type="number"
          min={1}
          max={remainingSupply}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          onBlur={() => {
            if (amount === "") return;
            setAmount(String(Number(amount)));
          }}
          className="field-shell mt-5 w-full px-4 py-3"
        />
        <p className="mt-3 text-sm text-soil/62">
          {text.total}: <span className="font-semibold text-soil">{formatMicroUsdc(totalUsdc)}</span>
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-bark/14 bg-white/70 px-4 py-2 text-sm text-soil/75"
          >
            {text.cancel}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-soil px-5 py-2 text-sm font-semibold text-[#f6f1e8]"
          >
            {loading ? text.signing : text.submit}
          </button>
        </div>
      </form>
    </div>
  );
}
