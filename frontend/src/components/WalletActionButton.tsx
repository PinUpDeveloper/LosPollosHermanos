"use client";

import { useEffect, useState } from "react";
import { BaseWalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useI18n } from "@/lib/i18n";

export function WalletActionButton() {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const buttonClass =
    "!h-11 !rounded-full !bg-soil !px-5 !text-sm !font-semibold !text-[#f6f1e8] transition hover:!bg-leaf";

  if (!mounted) {
    return (
      <button type="button" disabled className="h-11 rounded-full bg-soil px-5 text-sm font-semibold text-[#f6f1e8]">
        {t("wallet.connect")}
      </button>
    );
  }

  return (
    <BaseWalletMultiButton
      labels={{
        "no-wallet": t("wallet.connect"),
        connecting: t("wallet.connecting"),
        "has-wallet": t("wallet.connect"),
        "copy-address": t("wallet.copy"),
        copied: t("wallet.copied"),
        "change-wallet": t("wallet.change"),
        disconnect: t("wallet.disconnect"),
      }}
      className={buttonClass}
    />
  );
}
