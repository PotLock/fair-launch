import CustomToken from "@/components/create-token/custom";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Custom Token - Advanced Token Creation",
  description: "Create custom tokens with advanced features on multiple blockchains with POTLAUNCH. Deploy tokens on Solana, NEAR Protocol, and other supported chains with full control over tokenomics, vesting, and bonding curves.",
  keywords: [
    "custom token creation",
    "advanced token deployment",
    "custom tokenomics",
    "Solana token",
    "NEAR token",
    "cross-chain token",
    "token creation tool",
    "DeFi token",
    "cryptocurrency creation",
    "blockchain token",
    "POTLAUNCH",
    "bonding curve",
    "community token",
    "token vesting",
    "custom token parameters"
  ],
  openGraph: {
    title: "Custom Token - Advanced Token Creation",
    description: "Create custom tokens with advanced features on multiple blockchains with POTLAUNCH. Full control over tokenomics, vesting, and bonding curves.",
    type: "website",
    url: "https://potlaunch.com/create/custom",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "POTLAUNCH - Custom Token Creation Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Custom Token - Advanced Token Creation",
    description: "Create custom tokens with advanced features on multiple blockchains with POTLAUNCH.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/create/custom",
  },
};

export default function CustomMintPage(){
    return(
        <CustomToken/>
    )
}