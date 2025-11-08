import BridgeToken from "@/components/bridge/BridgeToken";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bridge Tokens | POTLAUNCH",
  description: "Bridge your tokens seamlessly across multiple blockchain networks with POTLAUNCH. Transfer tokens between Solana, NEAR Protocol, and EVM-compatible chains securely and efficiently.",
  keywords: [
    "token bridge",
    "cross-chain bridge",
    "blockchain bridge",
    "Solana bridge",
    "NEAR bridge",
    "EVM bridge",
    "token transfer",
    "cross-chain transfer",
    "multi-chain bridge",
    "POTLAUNCH",
    "cryptocurrency bridge",
    "DeFi bridge",
    "token migration",
    "chain bridge",
    "interoperability"
  ],
  openGraph: {
    title: "Bridge Tokens | POTLAUNCH",
    description: "Bridge your tokens seamlessly across multiple blockchain networks with POTLAUNCH. Transfer tokens between Solana, NEAR Protocol, and EVM-compatible chains.",
    type: "website",
    url: "https://potlaunch.com/token/bridge",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "POTLAUNCH - Token Bridge Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bridge Tokens | POTLAUNCH",
    description: "Bridge your tokens seamlessly across multiple blockchain networks with POTLAUNCH.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/token/bridge",
  },
};

export default function BridgePage() {
  return <BridgeToken />;
}