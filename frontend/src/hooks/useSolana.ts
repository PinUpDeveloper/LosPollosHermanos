"use client";

import { useWallet } from "@solana/wallet-adapter-react";

export function useSolana() {
  const wallet = useWallet();

  return {
    wallet,
    publicKey: wallet.publicKey?.toBase58(),
    connected: wallet.connected
  };
}

