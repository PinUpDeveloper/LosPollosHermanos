import type { Metadata } from "next";
import "./globals.css";
import { WalletProviderWrapper } from "@/components/WalletProvider";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AgroToken",
  description: "Токенизация будущего урожая на Solana"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <WalletProviderWrapper>
          <div className="min-h-screen">
            <Navbar />
            <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">{children}</main>
          </div>
        </WalletProviderWrapper>
      </body>
    </html>
  );
}

