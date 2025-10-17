import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getTokenByMint } from "@/lib/api";
import { SocialButtons } from "@/components/token/SocialButtons";
import { TradingInterface } from "@/components/token/TradingInterface";
import Link from "next/link";

export default async function TokenDetailPage({ params }: { params: Promise<{ address: string }> }) {
    const { address } = await params;
    const token = await getTokenByMint(address);
    // console.log(token);

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

                <Card className="p-3 md:p-6 mb-6 shadow-none">
                    <h2 className="text-xl font-medium mb-4">Description</h2>
                    <p className="text-gray-600 text-sm">
                        {token.description}
                    </p>
                </Card>
                
                
                {/* <LaunchStatus/>

                <LaunchConditions 
                    tokenInfo={tokenInfo} 
                    currentPrice={currentPrice}
                />

                <LiquidityPools 
                    onAddLiquidity={setShowAddLiquidityModal} 
                    listPools={listPools}
                    loadingPools={loadingPools}
                    errorPools={errorPools}
                /> */}
            </div>
            <TradingInterface token={token} address={address} />
        </div>
    );
}