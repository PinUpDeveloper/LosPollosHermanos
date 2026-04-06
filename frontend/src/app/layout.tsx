import type { Metadata } from "next";
import "./globals.css";
import { WalletProviderWrapper } from "@/components/WalletProvider";
import { Navbar } from "@/components/Navbar";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "AgroToken",
  description: "Tokenized agricultural funding on Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          <WalletProviderWrapper>
            <div className="min-h-screen">
              <Navbar />
              <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 md:px-6 md:pb-16 md:pt-8">
                {children}
              </main>
            </div>
          </WalletProviderWrapper>
        </I18nProvider>
      </body>
    </html>
  );
}
