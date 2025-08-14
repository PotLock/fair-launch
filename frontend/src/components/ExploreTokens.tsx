import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ExploreTokenCard from "./ExploreTokenCard";

const sampleTokens = [
    {
        id: "1",
        banner: "/curate.png",
        avatar: "/curate.png",
        name: "Llama",
        symbol: "llama",
        type: "Fixed price",
        description: "A community-driven meme token on Solana. Our mission is to build a fun and engaging ecosystem with a focus on long-term growth for our holders.",
        price: "$0.00234",
        supply: "500M",
        holders: "200",
        marketCap: "$2.17M",
        status: "Presale",
        actionButton: {
            text: "Join Presale",
            variant: "presale" as const
        }
    },
    {
        id: "2",
        banner: "/curate.png",
        avatar: "/curate.png",
        name: "CURATE",
        symbol: "CURATE",
        type: "Fixed price",
        description: "A decentralized platform for content creators and curators. Use CURATE to monetize your digital collections and participate in the governance of the ecosystem.",
        price: "$0.00234",
        supply: "500M",
        holders: "200",
        marketCap: "$1.17M",
        status: "Holding",
        actionButton: {
            text: "Buy on Curve",
            variant: "curve" as const
        }
    },
    {
        id: "3",
        banner: "/curate.png",
        avatar: "/curate.png",
        name: "Nature Lovers",
        symbol: "Nature",
        type: "Bonding Curve",
        description: "A token for those who appreciate the beauty of the natural world. $NATURE aims to fund and support environmental conservation projects globally.",
        price: "$0.00234",
        supply: "500M",
        holders: "200",
        marketCap: "$1.17M",
        status: "Trading",
        actionButton: {
            text: "Trade Now",
            variant: "trade" as const
        }
    },
    {
        id: "4",
        banner: "/curate.png",
        avatar: "/curate.png",
        name: "Gaming Token",
        symbol: "GAME",
        type: "Bonding Curve",
        description: "The ultimate gaming token for the metaverse. Connect, play, and earn rewards across multiple gaming platforms.",
        price: "$0.00170",
        supply: "500M",
        holders: "150",
        marketCap: "$0.85M",
        status: "Trading",
        actionButton: {
            text: "Trade Now",
            variant: "trade" as const
        }
    },
    {
        id: "5",
        banner: "/curate.png",
        avatar: "/curate.png",
        name: "DeFi Protocol",
        symbol: "DEFI",
        type: "Fixed price",
        description: "Revolutionary DeFi protocol offering yield farming, lending, and staking opportunities with innovative tokenomics.",
        price: "$0.00690",
        supply: "500M",
        holders: "300",
        marketCap: "$3.45M",
        status: "Trading",
        actionButton: {
            text: "Trade Now",
            variant: "trade" as const
        }
    }
];

export default function ExploreTokens() {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const cardsPerView = 3;
    const maxIndex = Math.max(0, sampleTokens.length - cardsPerView);

    const nextSlide = () => {
        setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
    };

    const prevSlide = () => {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
    };

    return (
        <div className="pt-[68px] px-10">
            <div className="w-full flex justify-between items-center mb-12">
                <h1 className="font-bold text-3xl">Explore Tokens</h1>
                <span className="max-w-[20rem] text-xl">Participate in all the latest token launches.</span>
            </div>
            
            <div className="relative w-full overflow-hidden">
                <div 
                    className="flex gap-3 transition-transform duration-500 ease-in-out"
                    style={{
                        transform: `translateX(-${currentIndex * (100 / 3)}%)`
                    }}
                >
                    {sampleTokens.map((token) => (
                        <div key={token.id} className="flex-shrink-0" style={{ width: `calc((100% - 1rem) / 3)` }}>
                            <ExploreTokenCard {...token} />
                        </div>
                    ))}
                </div>

                <div className="flex justify-between items-center mt-8">
                    <button className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition-colors">
                        <span className="text-sm">Explore All</span>
                    </button>
                    
                    <div className='flex justify-center mt-8'>
                        <div className="border border-black max-w-[200px] flex rounded-full">
                            <button
                                onClick={prevSlide}
                                disabled={currentIndex === 0}
                                className="h-10 w-12 p-2 border-r border-black hover:bg-gray-100 rounded-l-full flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                                onClick={nextSlide}
                                disabled={currentIndex >= maxIndex}
                                className="h-10 w-12 p-2 flex items-center justify-center hover:bg-gray-100 rounded-r-full disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}