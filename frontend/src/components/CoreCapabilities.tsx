import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight} from 'lucide-react';

export default function CoreCapabilities() {
    const [currentSlide, setCurrentSlide] = useState<number>(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    const capabilities = [
        {
            id: 1,
            title: "Custom and Fast Tokens",
            headline: "Launch your own token with Solana",
            description: "Deploy professional tokens across multiple chains with our no-code platform",
            bgColor: "bg-[#B7E6D7] border border-[#b0efdb]",
            icon: "/icons/rocket-3d.png"
        },
        {
            id: 2,
            title: "Cross-Chain Native",
            headline: "4+ Blockchain Networks Supported",
            description: "Seamlessly bridge tokens between Solana, NEAR, Base, and Ethereum and provide liquidity across tokens.",
            bgColor: "bg-gradient-to-br from-purple-100 to-violet-100",
            icon: "/icons/cross-chain.png"
        },
        {
            id: 3,
            title: "Bridge & Provide Liquidity",
            headline: "Make your token accessible everywhere",
            description: "Bridge new or existing tokens to other chains and provide liquidity on these new chains.",
            bgColor: "bg-gradient-to-br from-yellow-100 to-amber-100",
            icon: "/icons/bridge.png"
        },
        {
            id: 4,
            title: "Trade Tokens",
            headline: "Instant Token Swaps with best rates",
            description: "Trade thousands of tokens on our platform. We provide deep liquidity and competitive rates for all your transactions.",
            bgColor: "bg-gradient-to-br from-gray-100 to-slate-100",
            icon: "/icons/trade.png"
        }
    ];

    const maxDesktopSlide = Math.max(0, capabilities.length - 3); 

    const nextSlide = () => {
        setCurrentSlide((prev) => Math.min(prev + 1, maxDesktopSlide));
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
    };

    const goToSlide = (index: number) => {
        setCurrentSlide(index);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        setStartX(e.touches[0].clientX);
        setCurrentX(e.touches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        setCurrentX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        
        const diff = startX - currentX;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0 && currentSlide < capabilities.length - 1) {
                setCurrentSlide((prev) => Math.min(prev + 1, capabilities.length - 1));
            } else if (diff < 0 && currentSlide > 0) {
                setCurrentSlide((prev) => Math.max(prev - 1, 0));
            }
        }

        setIsDragging(false);
    };

    // Mouse drag handlers for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartX(e.clientX);
        setCurrentX(e.clientX);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setCurrentX(e.clientX);
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        
        const diff = startX - currentX;
        const threshold = 50;

        if (Math.abs(diff) > threshold) {
            if (diff > 0 && currentSlide < capabilities.length - 1) {
                setCurrentSlide((prev) => Math.min(prev + 1, capabilities.length - 1));
            } else if (diff < 0 && currentSlide > 0) {
                setCurrentSlide((prev) => Math.max(prev - 1, 0));
            }
        }

        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.userSelect = 'auto';
        }

        return () => {
            document.body.style.userSelect = 'auto';
        };
    }, [isDragging]);

    return (
        <div className="pt-[68px] md:px-10">
            <div className="w-full flex flex-col md:flex-row justify-center text-center md:text-start gap-2 md:justify-between items-center mb-5 md:mb-12">
                <h1 className="font-bold text-3xl">Core Capabilities</h1>
                <span className="md:max-w-[26rem] text-xl">Comprehensive tools for the complete token lifecycle</span>
            </div>
            
            <div className="relative w-full overflow-hidden">
                <div className="md:hidden">
                    <div 
                        ref={carouselRef}
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        {capabilities.map((capability) => (
                            <div key={capability.id} className="w-full flex-shrink-0 px-4">
                                <div className={`${capability.bgColor} rounded-2xl p-6 h-[440px] relative overflow-hidden flex flex-col`}>
                                    <div className="relative z-10 h-full flex flex-col">
                                        <h3 className="text-xl font-semibold">{capability.title}</h3>
                                        <div className="relative flex items-center justify-center">
                                            <img src={capability.icon as string} alt={capability.title} className='w-60 h-60'/>
                                        </div>
                                        <div className='absolute bottom-12'>
                                            <h4 className="text-xl font-semibold mb-5 flex items-end">{capability.headline}</h4>
                                        </div>
                                        <div className='absolute bottom-0'>
                                            <p className="text-xs text-gray-600 leading-relaxed">{capability.description}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hidden md:block">
                    <div className="flex">
                        <div className="flex transition-transform duration-500 ease-in-out gap-6 " 
                            style={{ transform: `translateX(-${currentSlide * (200)}px)` }}
                        >
                            {capabilities.map((capability) => (
                                <div key={capability.id} className="w-[320px] flex-shrink-0">
                                    <div className={`${capability.bgColor} rounded-2xl p-6 h-[440px] relative overflow-hidden flex flex-col`}>
                                        <div className="relative z-10 h-full flex flex-col">
                                            <h3 className="text-lg font-semibold mb-4">{capability.title}</h3>
                                            <div className="relative">
                                                <img src={capability.icon as string} alt={capability.title} className='w-56 h-56'/>
                                            </div>
                                            <div className='absolute bottom-12'>
                                                <h4 className="text-xl font-semibold mb-5 flex items-end">{capability.headline}</h4>
                                            </div>
                                            <div className='absolute bottom-0'>
                                                <p className="text-xs text-gray-600 leading-relaxed">{capability.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className='flex justify-center mt-5 md:hidden'>
                    <div className="flex gap-2">
                        {capabilities.map((capability, index) => (
                            <button
                                key={capability.id}
                                onClick={() => goToSlide(index)}
                                className={`transition-all duration-300 ${
                                    currentSlide === index 
                                        ? 'w-8 h-3 rounded-full' 
                                        : 'w-3 h-3 rounded-full'
                                } ${
                                    currentSlide === index 
                                        ? capability.bgColor.includes('B7E6D7') ? 'bg-[#B7E6D7]' 
                                          : capability.bgColor.includes('purple') ? 'bg-purple-200'
                                          : capability.bgColor.includes('yellow') ? 'bg-yellow-200'
                                          : 'bg-gray-200'
                                        : capability.bgColor.includes('B7E6D7') ? 'bg-[#B7E6D7]' 
                                          : capability.bgColor.includes('purple') ? 'bg-purple-200'
                                          : capability.bgColor.includes('yellow') ? 'bg-yellow-200'
                                          : 'bg-gray-200/30'
                                }`}
                            />
                        ))}
                    </div>
                </div>

                <div className='hidden md:flex justify-center mt-8'>
                    <div className="border border-black max-w-[200px] flex rounded-full">
                        <button
                            onClick={prevSlide}
                            className="h-10 w-12 p-2 border-r border-black hover:bg-gray-100 rounded-l-full flex items-center justify-center transition-colors shadow-sm"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="h-10 w-12 p-2 flex items-center justify-center hover:bg-gray-100 rounded-r-full"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}