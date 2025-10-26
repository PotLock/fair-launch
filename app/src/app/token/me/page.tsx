import { getSolPrice } from "@/lib/sol";
import { Metadata } from "next";
import MyTokensClient from "@/components/token/MyTokensClient";

// Force dynamic rendering since we're fetching data from external API
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const title = "My Portfolio | Cooked Pad";
  const description = "View and manage all the tokens you've created on Cooked Pad. Track your portfolio performance and manage your token launches.";
  
  // Create structured data for better SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "My Portfolio - Cooked Pad",
    "description": description,
-    "url": "https://potlaunch.com/me",
+    "url": "https://cooked.business/me",
    "isPartOf": {
      "@type": "WebSite",
-      "name": "POTLAUNCH",
-      "url": "https://potlaunch.com"
+      "name": "Cooked Pad",
+      "url": "https://cooked.business"
    },
    "provider": {
      "@type": "Organization",
-      "name": "POTLAUNCH",
-      "url": "https://potlaunch.com"
+      "name": "Cooked Labs",
+      "url": "https://cooked.business"
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
-      "POTLAUNCH"
+      "Cooked Pad"
    ],
-    authors: [{ name: "POTLAUNCH" }],
-    creator: "POTLAUNCH",
-    publisher: "POTLAUNCH",
+    authors: [{ name: "Cooked Pad" }],
+    creator: "Cooked Labs",
+    publisher: "Cooked Labs",
    robots: {
      index: false, // Private page, don't index
      follow: false,
    },
    openGraph: {
      type: "website",
      locale: "en_US",
-      url: "https://potlaunch.com/me",
+      url: "https://cooked.business/me",
      title,
      description,
-      siteName: "POTLAUNCH",
+      siteName: "Cooked Pad",
      images: [
        {
          url: "/hero.png",
          width: 1200,
          height: 630,
-          alt: "POTLAUNCH My Portfolio",
+          alt: "Cooked Pad My Portfolio",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
-      site: "@potlaunch",
-      creator: "@potlaunch",
+      site: "@cooked_business",
+      creator: "@cooked_business",
      title,
      description,
      images: ["/hero.png"],
    },
    alternates: {
-      canonical: "https://potlaunch.com/me",
+      canonical: "https://cooked.business/me",
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