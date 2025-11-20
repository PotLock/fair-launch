import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "../components/layout/Header";
import WalletContextProvider from "@/contexts/WalletProviderContext";
import { Toaster } from 'sonner';
import { InforWarning } from "../components/layout/InforWarning";
import { Footer } from "../components/layout/Footer";
import { HelpButton } from "../components/layout/HelpButton";
import { Analytics } from "@vercel/analytics/next"
import { PageProgressBar } from "../components/layout/PageProgressBar";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "POTLAUNCH - Launch Your Token Everywhere",
    template: "%s | POTLAUNCH"
  },
  description: "Cross-chain token launch kit powered by Solana x NEAR Intents x Omnibridge. Create, launch, and manage tokens across multiple blockchains with fair launch mechanisms, bonding curves, and community funding.",
  keywords: [
    "token launch",
    "cryptocurrency",
    "blockchain",
    "Solana",
    "NEAR Protocol",
    "cross-chain",
    "DeFi",
    "token creation",
    "bonding curves",
    "fair launch",
    "community funding",
    "PotLock",
    "web3",
    "decentralized"
  ],
  authors: [{ name: "PotLock Labs", url: "https://potlock.org" }],
  creator: "PotLock Labs",
  publisher: "PotLock Foundation DAO",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://potlaunch.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://potlaunch.com",
    siteName: "POTLAUNCH",
    title: "POTLAUNCH - Launch Your Token Everywhere",
    description: "Cross-chain token launch kit powered by Solana x NEAR Intents x Omnibridge. Create, launch, and manage tokens across multiple blockchains.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "POTLAUNCH - Cross-chain token launch platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@PotLock_",
    creator: "@PotLock_",
    title: "POTLAUNCH - Launch Your Token Everywhere",
    description: "Cross-chain token launch kit powered by Solana x NEAR Intents x Omnibridge.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "technology",
  classification: "Cryptocurrency, Blockchain, DeFi, Token Launch Platform",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "POTLAUNCH",
    "application-name": "POTLAUNCH",
    "msapplication-TileColor": "#000000",
    "msapplication-config": "/browserconfig.xml",
    "theme-color": "#000000",
  },
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="POTLAUNCH" />
        <meta name="application-name" content="POTLAUNCH" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${spaceGrotesk.variable} antialiased`}
      >
        <PageProgressBar />
        <Analytics />
        <WalletContextProvider>
            <Header />
            <InforWarning/>
            {children}
            <Footer/>
            <HelpButton />
            <Toaster position="bottom-right" />
        </WalletContextProvider>
      </body>
    </html>
  );
}
