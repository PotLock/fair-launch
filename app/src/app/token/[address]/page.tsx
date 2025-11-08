import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTokenByMint, getPopularTokens } from "@/lib/api";
import { SocialButtons } from "@/components/token/SocialButtons";
import { TradingInterface } from "@/components/token/TradingInterface";
import Link from "next/link";
import { Metadata } from "next";
import LaunchStatusData from "@/components/token/LaunchStatusData";
import { LaunchConditions } from "@/components/token/LaunchConditions";
import { fetchLaunchConditionsData } from "@/lib/launch-conditions-data";
import { LiquidityPoolsWrapper } from "@/components/token/LiquidityPoolsWrapper";
import Transactions from "@/components/token/Transactions";
import { getSolPrice } from "@/lib/sol";

// Force dynamic rendering since we're fetching data from external API
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export async function generateStaticParams() {
    try {
        const popularTokens = await getPopularTokens(10);
        
        return popularTokens.map((token) => ({
            address: token.mintAddress,
        }));
    } catch (error) {
        console.error('Error generating static params:', error);
        return [];
    }
}

export async function generateMetadata({ params }: { params: Promise<{ address: string }> }): Promise<Metadata> {
    const { address } = await params;
    
    try {
        const token = await getTokenByMint(address);
        
        if (!token) {
            return {
                title: "Token Not Found | POTLAUNCH",
                description: "The token you're looking for doesn't exist or was removed. Discover amazing tokens on POTLAUNCH.",
                openGraph: {
                    title: "Token Not Found | POTLAUNCH",
                    description: "The token you're looking for doesn't exist or was removed. Discover amazing tokens on POTLAUNCH.",
                    images: [
                        {
                            url: "/images/broken-pot.png",
                            width: 280,
                            height: 280,
                            alt: "Token Not Found",
                        },
                    ],
                },
                twitter: {
                    card: "summary_large_image",
                    title: "Token Not Found | POTLAUNCH",
                    description: "The token you're looking for doesn't exist or was removed. Discover amazing tokens on POTLAUNCH.",
                    images: ["/images/broken-pot.png"],
                },
            };
        }

        const title = `${token.name} (${token.symbol}) | POTLAUNCH`;
        const description = token.description || `Discover ${token.name} (${token.symbol}) on POTLAUNCH. Trade, explore, and learn about this token.`;
        const imageUrl = token.metadata.tokenUri || "/logo.png";
        
        // Create structured data for better SEO
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "FinancialProduct",
            "name": token.name,
            "description": token.description,
            "image": imageUrl,
            "brand": {
                "@type": "Brand",
                "name": "POTLAUNCH"
            },
            "provider": {
                "@type": "Organization",
                "name": "POTLAUNCH",
                "url": "https://potlaunch.com"
            },
            "category": "Cryptocurrency Token",
            "offers": {
                "@type": "Offer",
                "availability": "https://schema.org/InStock",
                "url": `https://potlaunch.com/token/${address}`
            }
        };

        return {
            title,
            description,
            keywords: [
                token.name,
                token.symbol,
                "cryptocurrency",
                "token",
                "trading",
                "DeFi",
                "Solana",
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
                url: `https://potlaunch.com/token/${address}`,
                title,
                description,
                siteName: "PotLaunch",
                images: [
                    {
                        url: imageUrl,
                        width: 400,
                        height: 400,
                        alt: `${token.name} token image`,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                site: "@potlaunch",
                creator: "@potlaunch",
                title,
                description,
                images: [imageUrl],
            },
            alternates: {
                canonical: `https://potlaunch.com/token/${address}`,
            },
            other: {
                "application/ld+json": JSON.stringify(structuredData),
            },
        };
    } catch (error) {
        // Fallback metadata
        return {
            title: "Token | POTLAUNCH",
            description: "Discover and trade tokens on POTLAUNCH. Explore the latest cryptocurrency tokens and trading opportunities.",
            openGraph: {
                title: "Token | POTLAUNCH",
                description: "Discover and trade tokens on POTLAUNCH. Explore the latest cryptocurrency tokens and trading opportunities.",
                images: [
                    {
                        url: "/hero.png",
                        width: 1200,
                        height: 630,
                        alt: "POTLAUNCH",
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: "Token | POTLAUNCH",
                description: "Discover and trade tokens on POTLAUNCH. Explore the latest cryptocurrency tokens and trading opportunities.",
                images: ["/hero.png"],
            },
        };
    }
}

export default async function TokenDetailPage({ params }: { params: Promise<{ address: string }> }) {
    const { address } = await params;
    const token = await getTokenByMint(address);
    const launchConditionsData = token ? await fetchLaunchConditionsData(token) : null;
    const solPrice = await getSolPrice();

    if (!token) {
        return (
            <div className="flex flex-col items-center py-20 min-h-screen">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-[280px] h-[280px]">
                        <img 
                            src="/images/broken-pot.png" 
                            alt="Broken Pot" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    
                    <div className="flex flex-col items-center gap-2.5 max-w-[741px]">
                        <h1 className="text-5xl font-semibold text-black text-center leading-[1.69] tracking-[-6.14%]">
                            Token Not Found
                        </h1>
                        <p className="text-xl text-black text-center leading-[2] max-w-[741px]">
                            The token you're looking for doesn't exist, was removed, or the URL is incorrect. Let's get you back to discovering amazing tokens!
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 mt-4">
                        <Button asChild variant="outline" size="lg" className="inline-flex items-center justify-center rounded-md px-8 py-3 text-base font-medium transition-colors duration-200 hover:text-gray-400 hover:border-gray-400">
                            <Link href="/">Return home</Link>
                        </Button>
                        <Button asChild size="lg" className="inline-flex items-center justify-center rounded-md bg-[#DD3345] px-8 py-3 text-base font-medium text-white transition-colors duration-200 hover:bg-[#C02A3A]">
                            <Link href="/token">Browse launchpad</Link>
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen xl:container mx-auto py-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:px-2">
            <div className="px-3 col-span-2 space-y-4">
                <div className="relative">
                    <div className="relative">
                        <img src={token.metadata.bannerUri} alt={token.name} className="w-full h-64 object-cover rounded-lg" />
                        <div className="absolute left-0 bottom-0 w-full h-64 rounded-b-lg pointer-events-none"
                            style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)'}} />
                    </div>
                    <div className="absolute left-4 bottom-5 md:left-5 md:bottom-10 flex md:items-end justify-between gap-5 md:gap-3 flex-col md:flex-row w-full">
                        <div className="flex items-center gap-3">
                            <img src={token.metadata.tokenUri} alt={token.name} className="w-20 h-20 rounded-xl border-[1px] object-cover border-gray-100 shadow-md bg-white" />
                            <div className="flex flex-col">
                                <span className="text-3xl font-bold text-white uppercase">{token.name}</span>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-lg text-white">${token.symbol}</span>
                                </div>
                            </div>
                        </div>
                        <SocialButtons 
                            website={token.metadata.website}
                            twitter={token.metadata.twitter}
                            telegram={token.metadata.telegram}
                        />
                    </div>
                </div>

                {/* <TradingInterface token={token} address={address} /> */}

                <Card className="p-3 md:p-6 mb-6 shadow-none flex flex-col gap-1">
                    <h2 className="text-2xl font-medium mb-4">Description</h2>
                    <p className="text-gray-600 text-sm">
                        {token.description}
                    </p>
                </Card>
                
                {/* <LaunchStatusData 
                    mint={token.mintAddress}
                    totalSupply={token.totalSupply}
                    decimals={token.decimals}
                /> */}

                <LaunchConditions 
                    token={token}
                    data={launchConditionsData!}
                />

                <LiquidityPoolsWrapper 
                    token={token}
                />

                <Transactions 
                    tokenAddress={address}
                    tokenSymbol={token.symbol}
                    solPrice={solPrice || 0}
                />
            </div>
            <TradingInterface token={token} address={address} />
        </div>
    );
}