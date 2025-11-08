import { getTokens } from "@/lib/api";
import TokenSearch from "@/components/token/TokenSearch";
import { Metadata } from "next";

// Force dynamic rendering since we're fetching data from external API
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const tokensResponse = await getTokens();
    const tokenCount = tokensResponse.data?.length || 0;

    const title = "Token Launchpad | POTLAUNCH";
    const description = `Discover and participate in ${tokenCount}+ token launches on POTLAUNCH. Support projects you believe in and explore the latest cryptocurrency tokens.`;
    
    // Create structured data for better SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "POTLAUNCH Token Launchpad",
      "description": description,
      "url": "https://potlaunch.com/token",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://potlaunch.com/token?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "provider": {
        "@type": "Organization",
        "name": "POTLAUNCH",
        "url": "https://potlaunch.com"
      }
    };

    return {
      title,
      description,
      keywords: [
        "token launchpad",
        "cryptocurrency",
        "token launch",
        "DeFi",
        "Solana",
        "token trading",
        "crypto projects",
        "token discovery",
        "POTLAUNCH"
      ],
      authors: [{ name: "POTLAUNCH" }],
      creator: "POTLAUNCH",
      publisher: "POTLAUNCH",
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
      openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://potlaunch.com/token",
        title,
        description,
        siteName: "POTLAUNCH",
        images: [
          {
            url: "/hero.png",
            width: 1200,
            height: 630,
            alt: "POTLAUNCH Token Launchpad",
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
        canonical: "https://potlaunch.com/token",
      },
      other: {
        "application/ld+json": JSON.stringify(structuredData),
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    
    // Fallback metadata
    return {
      title: "Token Launchpad | POTLAUNCH",
      description: "Discover and participate in token launches on POTLAUNCH. Support projects you believe in and explore the latest cryptocurrency tokens.",
      openGraph: {
        title: "Token Launchpad | POTLAUNCH",
        description: "Discover and participate in token launches on POTLAUNCH. Support projects you believe in and explore the latest cryptocurrency tokens.",
        images: [
          {
            url: "/hero.png",
            width: 1200,
            height: 630,
            alt: "POTLAUNCH Token Launchpad",
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Token Launchpad | POTLAUNCH",
        description: "Discover and participate in token launches on POTLAUNCH. Support projects you believe in and explore the latest cryptocurrency tokens.",
        images: ["/hero.png"],
      },
    };
  }
}

export default async function TokenPage() {
  return (
    <div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-black mb-2">Token Launchpad</h1>
        <p className="text-gray-500 mb-8 text-base">
          Discover and participate in token launches. Support projects you believe in.
        </p>
        
        <TokenSearch />
      </div>
    </div>
  );
}