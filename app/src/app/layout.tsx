import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import Header from "../components/layout/Header";
import WalletContextProvider from "@/contexts/WalletProviderContext";
import { Toaster } from 'sonner';
import { InforWarning } from "../components/layout/InforWarning";
import { Footer } from "../components/layout/Footer";
import { HelpButton } from "../components/layout/HelpButton";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Cooked Pad — Launch Tokens with Comedy",
    template: "%s | Cooked Pad"
  },
  description: "Cooked Pad is the meme-native token launchpad built on Cooked Labs. Launch and manage tokens with utility, humor, and cross-chain support.",
  keywords: [
    "Cooked Pad",
    "Cooked Labs",
    "token launch",
    "cryptocurrency",
    "blockchain",
    "Solana",
    "NEAR Intents",
    "cross-chain",
    "DeFi",
    "bonding curves",
    "fair launch",
    "community funding",
    "comedic capital markets"
  ],
  authors: [{ name: "Cooked Labs", url: "https://cooked.business" }],
  creator: "Cooked Labs",
  publisher: "Cooked Labs",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://cooked.business"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cooked.business",
    siteName: "Cooked Pad",
    title: "Cooked Pad — Launch Tokens with Comedy",
    description: "Cooked Pad is the meme-native token launchpad built on Cooked Labs.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Cooked Pad — Meme-native token launchpad",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@cooked_business",
    creator: "@cooked_business",
    title: "Cooked Pad — Launch Tokens with Comedy",
    description: "Cooked Pad is the meme-native token launchpad built on Cooked Labs.",
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
  classification: "Comedic Capital Markets, Meme Tech, Blockchain",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Cooked Pad",
    "application-name": "Cooked Pad",
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
        <meta name="apple-mobile-web-app-title" content="Cooked Pad" />
        <meta name="application-name" content="Cooked Pad" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body
        className={`${spaceGrotesk.variable} antialiased`}
      >
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
