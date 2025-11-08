import QuickLaunch from "@/components/create-token/QuickLaunch";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quick Launch - Create Token Fast",
  description: "Quickly create and launch your token across multiple blockchains with POTLAUNCH. Deploy tokens on Solana, NEAR Protocol, and other supported chains with our streamlined quick launch tool.",
  keywords: [
    "quick token launch",
    "fast token creation",
    "token deployment",
    "Solana token",
    "NEAR token",
    "cross-chain token",
    "quick token tool",
    "DeFi token",
    "cryptocurrency creation",
    "blockchain token",
    "POTLAUNCH",
    "instant token launch",
    "community token",
    "tokenomics"
  ],
  openGraph: {
    title: "Quick Launch - Create Token Fast",
    description: "Quickly create and launch your token across multiple blockchains with POTLAUNCH. Deploy tokens on Solana, NEAR Protocol, and other supported chains.",
    type: "website",
    url: "https://potlaunch.com/create/quick",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "POTLAUNCH - Quick Launch Token Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quick Launch - Create Token Fast",
    description: "Quickly create and launch your token across multiple blockchains with POTLAUNCH.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/create/quick",
  },
};

export default function QuickMintPage(){
    return(
        <QuickLaunch/>
    )
}