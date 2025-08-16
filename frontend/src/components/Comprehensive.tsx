import { useState, useRef } from 'react';

export default function Comprehensive(){
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const carouselRef = useRef<HTMLDivElement>(null);

    // Data for carousel slides
    const slides = [
        {
            title: "Multi-Chain Deployment",
            description: "Deploy your token across Solana, Ethereum, NEAR, and Base with a single click. Seamless cross-chain functionality.",
            image: "/icons/multi-chain.png",
            bgColor: "bg-gray-50",
            textColor: "text-gray-700",
            imageBg: "bg-neutral-200"
        },
        {
            title: "Vesting Schedules",
            description: "Flexible vesting schedules with cliff periods, custom intervals, and automated distribution for team and investor allocations.",
            image: "/icons/vesting.png",
            bgColor: "bg-[#EFF3DB]",
            textColor: "text-[#4D5E0E]",
            imageBg: "bg-[#607316]"
        },
        {
            title: "Bonding Curves",
            description: "Advanced bonding curve mechanisms with linear, exponential, logarithmic, and sigmoid curve options for optimal price discovery.",
            image: "/icons/bonding-curve.png",
            bgColor: "bg-[#FAE2DF]",
            textColor: "text-gray-700",
            imageBg: "bg-[#6B0036]"
        },
        {
            title: "Launch Mechanism",
            description: "Built-in governance, voting mechanisms, and community management tools to engage your token holders effectively.",
            image: "/icons/launch-mechanism.png",
            bgColor: "bg-[#DFF2F1]",
            textColor: "text-[#43696B]",
            imageBg: "bg-[#43696B]"
        },
        {
            title: "Cross-Chain DEX Support",
            description: "Cross chain balance top up and dex support. Swap through intents and access your assets through native dex.",
            image: "/icons/cross-chain-dex.png",
            bgColor: "bg-[#EEF2FF]",
            textColor: "text-slate-700",
            imageBg: "bg-indigo-800"
        }
    ];

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
        if (isRightSwipe && currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }

        setTouchStart(0);
        setTouchEnd(0);
    };


    return(
        <div className="pt-[68px] md:px-10">
            <div className="w-full flex flex-col md:flex-row justify-center text-center md:text-start gap-2 md:justify-between items-center mb-5 md:mb-12">
                <div className="md:max-w-[20rem]">
                    <h1 className="font-bold text-3xl">Comprehensive</h1>
                    <h1 className="font-bold text-3xl">Token Launch Suite</h1>
                </div>
                <span className="md:max-w-[24rem] text-lg font-normal">Everything you need to launch, manage, and scale your token across multiple chains.</span>
            </div>

            <div className="md:hidden relative w-full overflow-hidden pt-5">
                <div 
                    ref={carouselRef}
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    {slides.map((slide, index) => (
                        <div key={index} className="w-full flex-shrink-0 min-h-[530px] max-h-[530px]">
                            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 flex flex-col mx-4">
                                <div className={`flex-1 p-6 ${slide.bgColor}`}>
                                    <h3 className="font-normal text-4xl text-black mb-4">{slide.title}</h3>
                                    <p className={`text-base leading-relaxed ${slide.textColor}`}>
                                        {slide.description}
                                    </p>
                                </div>
                                <div className={`${slide.imageBg} flex items-center justify-center h-64`}>
                                    <img 
                                        src={slide.image} 
                                        alt={slide.title} 
                                        className="w-full h-full object-contain" 
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center items-center mt-6 space-x-2">
                    {slides.map((slide, index) => {
                        const getDotColor = (bgColor: string) => {
                            switch (bgColor) {
                                case 'bg-gray-50':
                                    return 'bg-gray-400';
                                case 'bg-[#EFF3DB]':
                                    return 'bg-[#607316]';
                                case 'bg-[#FAE2DF]':
                                    return 'bg-[#6B0036]';
                                case 'bg-[#DFF2F1]':
                                    return 'bg-[#43696B]';
                                case 'bg-[#EEF2FF]':
                                    return 'bg-indigo-800';
                                default:
                                    return 'bg-gray-400';
                            }
                        };

                        const dotColor = getDotColor(slide.bgColor);
                        
                        return (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`transition-all duration-300 rounded-full ${
                                    index === currentSlide 
                                        ? `${dotColor} w-8 h-3` 
                                        : `${dotColor} w-3 h-3 opacity-50`
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        );
                    })}
                </div>
            </div>

            <div className="hidden md:block relative w-full overflow-hidden">
                <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col gap-4 col-span-2">
                        <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 flex max-h-[280px]">
                            <div className="w-[60%] p-10 bg-gray-50">
                                <h3 className="font-normal text-3xl text-black mb-4">Multi-Chain Deployment</h3>
                                <p className="text-gray-700 text-sm leading-relaxed">
                                    Deploy your token across Solana, Ethereum, NEAR, and Base with a single click. Seamless cross-chain functionality.
                                </p>
                            </div>
                            <div className="w-[40%] bg-neutral-200 p-5 flex items-center justify-center relative">
                                <img src="/icons/multi-chain.png" alt="Multi-Chain Deployment" className="w-full h-full object-contain" />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl overflow-hidden flex items-center max-h-[280px]">
                            <div className="w-[40%] bg-[#607316] p-8 flex items-center justify-center relative">
                                <img src="/icons/vesting.png" alt="Vesting Schedules" className="w-full max-w-[250px] h-full object-contain" />
                            </div>
                            <div className="w-[60%] p-10 bg-[#EFF3DB] h-full flex justify-center flex-col">
                                <h3 className="font-base text-3xl text-black mb-4">Vesting Schedules</h3>
                                <p className="text-[#4D5E0E] text-sm leading-relaxed">
                                    Flexible vesting schedules with cliff periods, custom intervals, and automated distribution for team and investor allocations.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl overflow-hidden flex flex-col w-full">
                        <div className="p-10 bg-[#FAE2DF] h-[295px] flex justify-center flex-col">
                            <h3 className="font-base text-3xl text-black mb-4">Bonding Curves</h3>
                            <p className="text-gray-700 text-sm leading-relaxed">
                                Advanced bonding curve mechanisms with linear, exponential, logarithmic, and sigmoid curve options for optimal price discovery.
                            </p>
                        </div>
                        <div className="bg-[#6B0036] py-6 flex items-center justify-center rounded-b-2xl">
                            <img src="/icons/bonding-curve.png" alt="Bonding Curves" className="w-full h-full max-w-[215px] object-contain" />
                        </div>
                    </div>
                </div>
                <div className="relative flex flex-col gap-4 mt-4">
                    <div className="bg-[#DFF2F1] rounded-2xl overflow-hidden flex h-[280px]">
                        <div className="w-[60%] p-12 bg-[#DFF2F1]">
                            <h3 className="font-base text-3xl text-black mb-4">Launch Mechanism</h3>
                            <p className="text-[#43696B] text-sm leading-relaxed max-w-[80%]">
                                Built-in governance, voting mechanisms, and community management tools to engage your token holders effectively.
                            </p>
                        </div>
                        <div className="w-[40%] bg-[#43696B] flex items-center justify-center relative">
                            <img src="/icons/launch-mechanism.png" alt="Launch Mechanism" className="w-[300px] h-full object-contain" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#EEF2FF] rounded-2xl overflow-hidden flex col-span-2">
                            <div className="w-[60%] p-12 bg-[#EEF2FF]">
                                <h3 className="font-base text-3xl text-black mb-4 max-w-[14rem]">Cross-Chain DEX Support</h3>
                                <p className="text-slate-700 text-sm leading-relaxed">
                                    Cross chain balance top up and dex support. Swap through intents and access your assets through native dex.
                                </p>
                            </div>
                            <div className="w-[40%] bg-indigo-800 p-6 flex items-center justify-center relative">
                                <img src="/icons/cross-chain-dex.png" alt="Cross-Chain DEX Support" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <div className="bg-lime-50 rounded-2xl overflow-hidden flex">
                            <div className="w-full p-12 bg-lime-50">
                                <h3 className="font-base text-3xl text-black mb-4 max-w-[12rem]">Fee Configuration</h3>
                                <p className="text-lime-600 text-sm leading-relaxed">
                                    Configure custom fee structures and designate transparent recipient wallets for full transparency.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}