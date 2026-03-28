"use client";

import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export function Navbar() {
  return (
    <header className="border-b border-bark/10 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="font-display text-2xl font-semibold text-leaf">
          AgroToken
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/farmer/dashboard">Фермеру</Link>
          <Link href="/investor/dashboard">Инвестору</Link>
          <WalletMultiButton className="!bg-leaf hover:!bg-soil" />
        </nav>
      </div>
    </header>
  );
}

