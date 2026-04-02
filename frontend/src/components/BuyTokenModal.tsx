"use client";

import { FormEvent, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
  pricePerToken: number;
  remainingSupply: number;
};

export function BuyTokenModal({ open, onClose, onSubmit, pricePerToken, remainingSupply }: Props) {
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  const totalUsdc = (amount * pricePerToken) / 1_000_000;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (amount < 1) {
      setError("Минимум 1 токен");
      return;
    }
    if (amount > remainingSupply) {
      setError(`Осталось только ${remainingSupply} токенов`);
      return;
    }
    setLoading(true);
    try {
      await onSubmit(amount);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка транзакции");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-soil/30 p-4">
      <form onSubmit={handleSubmit} className="panel w-full max-w-md p-6">
        <h3 className="font-display text-2xl">Купить долю урожая</h3>
        <p className="mt-2 text-sm text-soil/70">
          Введите количество токенов. Транзакция будет подписана через Phantom.
        </p>
        <input
          type="number"
          min={1}
          max={remainingSupply}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="mt-4 w-full rounded-2xl border border-bark/20 px-4 py-3"
        />
        <p className="mt-2 text-sm text-soil/60">
          Итого: {totalUsdc.toLocaleString("ru-RU")} USDC
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border px-4 py-2">
            Отмена
          </button>
          <button type="submit" disabled={loading} className="rounded-2xl bg-leaf px-4 py-2 text-white">
            {loading ? "Подписание..." : "Подписать и отправить"}
          </button>
        </div>
      </form>
    </div>
  );
}
