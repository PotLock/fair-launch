export default function IntegratedEcosystem(){
    return(
        <div className="pt-[68px] px-10">
            <div className="w-full flex justify-between items-center mb-12">
                <h1 className="font-bold text-3xl">Integrated Ecosystem</h1>
                <span className="max-w-[22rem] text-xl">Connected with leading blockchains and DeFi protocols</span>
            </div>
            <div className="relative w-full overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div 
                        className="bg-white min-h-[200px] flex justify-center items-center flex-col rounded-xl p-4 hover:shadow-sm cursor-pointer transition-shadow duration-300 border border-gray-200"
                    >
                        <div className="flex flex-col items-center mb-2 gap-2">
                            <img src={'/logos/near-intents.svg'} alt={'NEAR Intents'} className="w-24 h-full bg-gray-100 rounded-lg flex items-center justify-center text-2xl mr-3"/>
                            <h3 className="font-bold text-xl text-gray-900">
                                NEAR Intents
                            </h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Cross-chain intent processing and execution for seamless operations
                        </p>
                    </div>
                    <div 
                        className="bg-white min-h-[200px] flex justify-center items-center flex-col rounded-xl p-2 hover:shadow-sm cursor-pointer transition-shadow duration-300 border border-gray-200"
                    >
                        <div className="flex flex-col items-center mb-2 gap-2">
                            <div className="w-9 h-9 bg-black rounded-full flex items-center justify-center text-2xl">
                                <img src={'/logos/solana_light.svg'} alt={'Solana'} className="w-7 h-full object-contain"/>
                            </div>
                            <h3 className="font-bold text-xl text-gray-900">
                                Solana
                            </h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Native Solana blockchain support for high-speed, low-cost transactions
                        </p>
                    </div>
                    <div 
                        className="bg-white min-h-[200px] flex justify-center text-center items-center flex-col rounded-xl p-2 hover:shadow-sm cursor-pointer transition-shadow duration-300 border border-gray-200"
                    >
                        <div className="flex flex-col items-center mb-2 gap-2">
                            <img src={'/logos/near.svg'} alt={'NEAR Intents'} className="w-8 h-full rounded-lg flex items-center justify-center"/>
                            <h3 className="font-bold text-xl text-gray-900">
                                NEAR Omnibridge
                            </h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Universal bridge connectivity enabling seamless cross-chain transfers
                        </p>
                    </div>
                    <div 
                        className="bg-white flex justify-center text-center items-center flex-col rounded-xl p-2 hover:shadow-sm cursor-pointer transition-shadow duration-300 border border-gray-200"
                    >
                        <div className="flex flex-col items-center mb-2 gap-2">
                            <img src={'/logos/raydium.png'} alt={'Raydium'} className="w-10 h-full rounded-lg flex items-center justify-center"/>
                            <h3 className="font-bold text-xl text-gray-900">
                                Raydium
                            </h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Automated market maker integration with yield farming capabilities
                        </p>
                    </div>
                    <div 
                        className="bg-white min-h-[200px] flex justify-center items-center flex-col rounded-xl p-2 hover:shadow-sm cursor-pointer transition-shadow duration-300 border border-gray-200"
                    >
                        <div className="flex flex-col items-center mb-4 gap-2">
                            <img src={'/logos/pumpfun.png'} alt={'PumpSwap'} className="w-12 h-12 flex items-center justify-center"/>
                            <h3 className="font-bold text-xl text-gray-900">
                                PumpSwap
                            </h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Advanced token swapping platform with optimized routing mechanisms
                        </p>
                    </div>
                    <div 
                        className="bg-white min-h-[200px] text-center flex justify-center items-center flex-col rounded-xl p-6 hover:shadow-sm cursor-pointer transition-shadow duration-300 border border-gray-200"
                    >
                        <div className="flex flex-col items-center mb-4 gap-2">
                            <img src={'/logos/jupiter.png'} alt={'Jupiter'} className="w-12 h-12 flex items-center justify-center"/>
                            <h3 className="font-bold text-xl text-gray-900">
                                Jupiter
                            </h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Cross-chain swapping aggregation providing the best rates across DEXes
                        </p>
                    </div>
                    <div 
                        className="bg-white min-h-[200px] text-center flex justify-center items-center flex-col rounded-xl p-6 hover:shadow-sm cursor-pointer transition-shadow duration-300 border border-gray-200"
                    >
                        <div className="flex flex-col items-center mb-4 gap-2">
                            <img src={'/logos/aerodrome.png'} alt={'Aerodrome'} className="w-12 h-12 flex items-center justify-center"/>
                            <h3 className="font-bold text-xl text-gray-900">
                                Aerodrome
                            </h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Advanced liquidity provision on Base, automated trading protocol integration
                        </p>
                    </div>
                    <div 
                        className="bg-white min-h-[200px] text-center flex justify-center items-center flex-col rounded-xl p-6 hover:shadow-sm cursor-pointer transition-shadow duration-300 border border-gray-200"
                    >
                        <div className="flex flex-col items-center mb-4 gap-2">
                            <img src={'/logos/meteora.png'} alt={'Meteora'} className="w-12 h-12 flex items-center justify-center"/>
                            <h3 className="font-bold text-xl text-gray-900">
                                Meteora
                            </h3>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            Dynamic liquidity management and yield optimization
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}