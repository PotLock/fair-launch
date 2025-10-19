import { getSolPrice } from "@/lib/sol";
import { Metadata } from "next";
import MyTokensClient from "@/components/token/MyTokensClient";

export async function generateMetadata(): Promise<Metadata> {
  const title = "My Portfolio | PotLaunch";
  const description = "View and manage all the tokens you've created on PotLaunch. Track your portfolio performance and manage your token launches.";
  
  // Create structured data for better SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "My Portfolio - PotLaunch",
    "description": description,
    "url": "https://potlaunch.com/me",
    "isPartOf": {
      "@type": "WebSite",
      "name": "PotLaunch",
      "url": "https://potlaunch.com"
    },
    "provider": {
      "@type": "Organization",
      "name": "PotLaunch",
      "url": "https://potlaunch.com"
    }
  };

  return {
    title,
    description,
    keywords: [
      "portfolio",
      "my tokens",
      "token management",
      "cryptocurrency portfolio",
      "token creator",
      "DeFi",
      "Solana",
      "token dashboard",
      "PotLaunch"
    ],
    authors: [{ name: "PotLaunch" }],
    creator: "PotLaunch",
    publisher: "PotLaunch",
    robots: {
      index: false, // Private page, don't index
      follow: false,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: "https://potlaunch.com/me",
      title,
      description,
      siteName: "PotLaunch",
      images: [
        {
          url: "/hero.png",
          width: 1200,
          height: 630,
          alt: "PotLaunch My Portfolio",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@potlaunch",
      creator: "@potlaunch",
      title,
      description,
      images: ["/hero.png"],
    },
    alternates: {
      canonical: "https://potlaunch.com/me",
    },
    other: {
      "application/ld+json": JSON.stringify(structuredData),
    },
  };
}

export default async function MyTokensPage() {
  // Fetch initial data server-side
  let solPrice: number = 0;
  
  try {
    const fetchedSolPrice = await getSolPrice();
    solPrice = fetchedSolPrice || 0;
  } catch (error) {
    console.error("Error fetching initial data:", error);
    solPrice = 0;
  }

  return <MyTokensClient solPrice={solPrice} />;
}