import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ExploreTokenCard from "./ExploreTokenCard";
import { useNavigate } from "@tanstack/react-router";
import { getTokens } from "../lib/api";
import { TokenInfo } from "../utils/tokenUtils";

export default function ExploreTokens() {
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [cardsPerView, setCardsPerView] = useState<number>(3);
    const navigate = useNavigate();
    const [tokens, setTokens] = useState<TokenInfo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTokens = async () => {
          try {
            setLoading(true);
            setError(null);
            const tokens = await getTokens();
            setTokens(tokens.data);
          } catch (error) {
            console.error('Error fetching tokens:', error);
            setError('Failed to load tokens. Please try again later.');
          } finally {
            setLoading(false);
          }
        };
    
        fetchTokens();
    }, []);

    // Responsive cards per view
    useEffect(() => {
        const updateCardsPerView = () => {
            if (window.innerWidth < 640) { // sm
                setCardsPerView(1);
            } else if (window.innerWidth < 1024) { // lg
                setCardsPerView(2);
            } else {
                setCardsPerView(3);
            }
        };

        updateCardsPerView();
        window.addEventListener('resize', updateCardsPerView);
        return () => window.removeEventListener('resize', updateCardsPerView);
    }, []);

    const maxIndex = Math.max(0, tokens.length - cardsPerView);

    const nextSlide = () => {
        setCurrentIndex(prev => Math.min(prev + 1, maxIndex));
    };

    const prevSlide = () => {
        setCurrentIndex(prev => Math.max(prev - 1, 0));
    };

    const LoadingSkeleton = () => (
        <div className="flex gap-3">
            {Array.from({ length: cardsPerView }).map((_, index) => (
                <div key={index} className="flex-shrink-0 animate-pulse" style={{ width: `calc((100% - ${(cardsPerView - 0.2) * 0.75}rem) / ${cardsPerView})` }}>
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <div className="h-48 bg-gray-200"></div>
                        <div className="p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-200 rounded"></div>
                                <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                                <div className="h-3 bg-gray-200 rounded w-3/5"></div>
                            </div>
                            <div className="mt-4 h-10 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const ErrorMessage = () => (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Tokens</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    );

    return (
        <div className="pt-[68px] md:px-6">
            <div className="w-full flex flex-col md:flex-row justify-center text-center md:text-start gap-2 md:justify-between items-center mb-5 md:mb-12">
                <h1 className="font-bold text-3xl">Explore Tokens</h1>
                <span className="lg:max-w-[26rem] text-xl">Participate in all the latest token launches.</span>
            </div>
            
            <div className="relative w-full overflow-hidden">
                {loading ? (
                    <LoadingSkeleton />
                ) : error ? (
                    <ErrorMessage />
                ) : tokens.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="text-center">
                            <div className="text-gray-400 text-6xl mb-4">📭</div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Tokens Available</h3>
                            <p className="text-gray-600 mb-4">There are currently no tokens to display.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div 
                            className="flex gap-3 transition-transform duration-500 ease-in-out"
                            style={{
                                transform: `translateX(-${currentIndex * (100 / cardsPerView)}%)`
                            }}
                        >
                            {tokens.map((token) => (
                                <div key={token.id} className="flex-shrink-0" style={{ width: `calc((100% - ${(cardsPerView - 0.2) * 0.75}rem) / ${cardsPerView})` }}>
                                    <ExploreTokenCard  
                                        id={token.id}
                                        mint={token.mintAddress || ''}
                                        banner={token.bannerUrl || ''}
                                        avatar={token.avatarUrl || ''}
                                        name={token.name}
                                        symbol={token.symbol}
                                        type={token.selectedPricing || ''}
                                        description={token.description}
                                        decimals={token.decimals}
                                        status={'Trading'}
                                        actionButton={{
                                            text: 'Buy on Curve',
                                            variant: 'presale' as const
                                        }}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-row justify-between items-center mt-8 gap-4">
                            <button onClick={()=>navigate({to: "/tokens"})} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors">
                                <span className="text-sm">Explore All</span>
                            </button>
                            
                            <div className='flex justify-center'>
                                <div className="border border-black max-w-[200px] flex rounded-full">
                                    <button
                                        onClick={prevSlide}
                                        disabled={currentIndex === 0}
                                        className="h-8 md:h-10 w-8 md:w-12 p-2 border-r border-black hover:bg-gray-100 rounded-l-full flex items-center justify-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button
                                        onClick={nextSlide}
                                        disabled={currentIndex >= maxIndex}
                                        className="h-8 md:h-10 w-8 md:w-12 p-2 flex items-center justify-center hover:bg-gray-100 rounded-r-full disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <ChevronRight className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}