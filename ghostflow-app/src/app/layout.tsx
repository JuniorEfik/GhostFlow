import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/providers/AppProviders";
import { Header } from "@/components/header/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ghostflow.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GhostFlow | Cross-Chain Swap & Send",
    template: "%s | GhostFlow",
  },
  description:
    "Send and swap USDC privately across Arbitrum, Avalanche, Base, BSC, Ethereum, Optimism, Polygon & Solana. Cross-chain swaps with privacy.",
  icons: { icon: "/ghost.png" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "GhostFlow",
    title: "GhostFlow | Cross-Chain Swap & Send",
    description:
      "Send and swap USDC privately across multiple blockchains. Cross-chain swaps with privacy.",
    images: [
      {
        url: "/ghost.png",
        width: 512,
        height: 512,
        alt: "GhostFlow logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "GhostFlow | Cross-Chain Swap & Send",
    description:
      "Send and swap USDC privately across Arbitrum, Avalanche, Base, BSC, Ethereum, Optimism, Polygon & Solana.",
    images: ["/ghost.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('ghostflow-theme');var d=!(t&&t==='light');document.documentElement.classList.toggle('dark',d);})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-100 text-gray-900 dark:bg-[#0d0d0d] dark:text-white min-h-screen transition-colors`}>
        <AppProviders>
          <Header />
          <main className="pt-16 min-h-screen">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
