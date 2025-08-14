export default function Comprehensive(){
    return(
        <div className="pt-[68px] px-10">
            <div className="w-full flex justify-between items-center mb-12">
                <div className="max-w-[20rem]">
                    <h1 className="font-bold text-3xl">Comprehensive</h1>
                    <h1 className="font-bold text-3xl">Token Launch Suite</h1>
                </div>
                <span className="max-w-[24rem] text-lg">Everything you need to launch, manage, and scale your token across multiple chains.</span>
            </div>
            <div className="relative w-full overflow-hidden">
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