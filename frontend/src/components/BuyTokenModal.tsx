"use client";

import { FormEvent, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
};

export function BuyTokenModal({ open, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await onSubmit(amount);
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-soil/30 p-4">
      <form onSubmit={handleSubmit} className="panel w-full max-w-md p-6">
        <h3 className="font-display text-2xl">Купить долю урожая</h3>
        <p className="mt-2 text-sm text-soil/70">Введите количество токенов для покупки через Phantom.</p>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="mt-4 w-full rounded-2xl border border-bark/20 px-4 py-3"
        />
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-2xl border px-4 py-2">
            Отмена
          </button>
          <button type="submit" disabled={loading} className="rounded-2xl bg-leaf px-4 py-2 text-white">
            {loading ? "Подписание..." : "Продолжить"}
          </button>
        </div>
      </form>
    </div>
  );
}

