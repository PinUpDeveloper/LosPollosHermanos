"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { WalletActionButton } from "@/components/WalletActionButton";
import { useI18n } from "@/lib/i18n";

export function Navbar() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 px-4 pt-4 md:px-6">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 rounded-[1.2rem] border border-bark/10 bg-[#fbf7ef]/92 px-4 py-4 shadow-[0_10px_24px_rgba(31,42,35,0.05)] backdrop-blur md:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-1.5 rounded-full bg-gradient-to-b from-leaf to-wheat" />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-leaf/72">
                  Solana agri-finance
                </p>
                <p className="mt-1 text-xl font-semibold tracking-[0.12em] text-soil">AGROTOKEN</p>
              </div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-bark/10 bg-white/70 p-1 md:flex">
            <NavLink href="/" label={t("nav.home")} />
            <NavLink href="/farmer/dashboard" label={t("nav.farmer")} />
            <NavLink href="/investor/dashboard" label={t("nav.investor")} />
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <LanguageSwitcher />
          <WalletActionButton />
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-2 text-sm font-medium text-soil/68 transition hover:bg-mist hover:text-soil"
    >
      {label}
    </Link>
  );
}
