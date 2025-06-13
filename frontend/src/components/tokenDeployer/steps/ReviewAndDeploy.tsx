import { IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';
import { useDeployStore } from '../../../stores/deployStores';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getExchangeDisplay } from '../../../utils';

type SectionKey = keyof typeof defaultExpanded;
const defaultExpanded = {
    tokenDetails: true,
    tokenDistribution: false,
    tokenReleaseSchedule: false,
    priceMechanism: false,
    dexListingSetup: false,
    tokenSaleSetup: false,
};

const SectionHeader = ({ title, sectionKey, expanded, onClick }: { title: string, sectionKey: SectionKey, expanded: boolean, onClick: (section: SectionKey) => void }) => (
    <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-t-lg cursor-pointer"
        onClick={() => onClick(sectionKey)}
    >
        <span className="font-semibold text-sm">{title}</span>
        <IconChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
    </div>
);

export const ReviewAndDeploy = () => {
    const state = useDeployStore();
    const [expanded, setExpanded] = useState<typeof defaultExpanded>(defaultExpanded);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const handleExpand = (section: SectionKey) => {
      setExpanded(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full">
            <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex flex-col">
                    <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>Review & Deploy</div>
                    {
                        isExpanded && (
                            <span className="text-xs text-gray-500">Review your token configuration before deployment. Once deployed, some parameters cannot be changed.</span>
                        )
                    }
                </div>
                {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </div>
            {
                isExpanded && (
                    <div className='space-y-2 mt-6'>
                        <div className="border rounded-lg">
                            <SectionHeader title="Token Details" sectionKey="tokenDetails" expanded={expanded.tokenDetails} onClick={handleExpand} />
                            {expanded.tokenDetails && (
                                <div className="p-4 grid grid-cols-2 gap-4 bg-white rounded-b-lg">
                                    <div className='flex flex-col gap-1'>
                                        <label className="text-xs text-gray-500">Name</label>
                                        <span className="font-medium">{state.basicInfo.name}</span>
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <label className="text-xs text-gray-500">Symbol</label>
                                        <span className="font-medium">{state.basicInfo.symbol}</span>
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <label className="text-xs text-gray-500">Supply</label>
                                        <span className="font-medium">{state.basicInfo.supply}</span>
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <label className="text-xs text-gray-500">Decimal</label>
                                        <span className="font-medium">{state.basicInfo.decimals}</span>
                                    </div>
                                    <div className="col-span-2 border-t pt-2 mt-2 flex flex-col gap-1">
                                        <label className="text-xs text-gray-500 mb-1">Description</label>
                                        <span className="font-medium text-sm">{state.basicInfo.description}</span>
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <label className="text-xs text-gray-500">Revoke Mint Authority</label>
                                        <span className="font-medium">{state.adminSetup.revokeMintAuthority.isEnabled ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className='flex flex-col gap-1'>
                                        <label className="text-xs text-gray-500">Revoke Freeze Authority</label>
                                        <span className="font-medium">{state.adminSetup.revokeFreezeAuthority.isEnabled ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Token Distribution */}
                        {state.allocation.length > 0 && (
                        <div className="border rounded-lg">
                            <SectionHeader title="Token Distribution" sectionKey="tokenDistribution" expanded={expanded.tokenDistribution} onClick={handleExpand} />
                            {expanded.tokenDistribution && (
                            <div className="p-4 grid grid-cols-2 gap-4 bg-white rounded-b-lg">
                                {state.allocation.map((allocation, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-500">{allocation.description || `Allocation #${idx + 1}`}</label>
                                    <span className="font-medium">{allocation.percentage}%</span>
                                </div>
                                ))}
                            </div>
                            )}
                        </div>
                        )}

                        {state.allocation.some(a => a.vesting.enabled) && (
                            <div className="border rounded-lg">
                                <SectionHeader title="Token Release Schedule" sectionKey="tokenReleaseSchedule" expanded={expanded.tokenReleaseSchedule} onClick={handleExpand} />
                                {expanded.tokenReleaseSchedule && (
                                <div className="p-4 bg-white rounded-b-lg space-y-3">
                                    {state.allocation.filter(a => a.vesting.enabled).map((allocation, idx) => (
                                    <div key={idx} className="flex justify-between items-center">
                                        <div className='flex flex-col gap-1'>
                                            <label className="text-xs text-gray-500">{allocation.vesting.description || `Schedule #${idx + 1}`}</label>
                                            <span className="text-xs text-gray-400">{allocation.vesting.cliff} days cliff, {allocation.vesting.duration} days duration</span>
                                        </div>
                                        <span className="font-medium">{allocation.vesting.percentage}%</span>
                                    </div>
                                    ))}
                                </div>
                                )}
                            </div>
                        )}

                        {state.dexListing && (
                            <div className="mb-4 border rounded-lg">
                                <SectionHeader title="DEX Listing Setup" sectionKey="dexListingSetup" expanded={expanded.dexListingSetup} onClick={handleExpand} />
                                {expanded.dexListingSetup && (
                                <div className="p-4 flex justify-between gap-4 bg-white rounded-b-lg">
                                    <div className='flex flex-col gap-2'>
                                        <div>
                                            <label className="text-xs text-gray-500">DEX</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <img src={state.dexListing.launchLiquidityOn.icon} alt={state.dexListing.launchLiquidityOn.name} className="w-5 h-5 rounded-full" />
                                                <span className="font-medium">{state.dexListing.launchLiquidityOn.name}</span>
                                            </div>
                                        </div>
                                        <div className='flex flex-col gap-1'>
                                            <label className="text-xs text-gray-500">Liquidity Percentage</label>
                                            <span className="font-medium">{state.dexListing.liquidityPercentage}%</span>
                                        </div>
                                    </div>
                                    <div className='flex flex-col gap-2'>
                                        <div className='flex flex-col gap-1'>
                                            <label className="text-xs text-gray-500">Liquidity Type</label>
                                            <span className="font-medium capitalize">{state.dexListing.liquidityType}-Sided</span>
                                        </div>
                                        <div className='flex flex-col gap-1'>
                                            <label className="text-xs text-gray-500">Lockup Period</label>
                                            <span className="font-medium">{state.dexListing.liquidityLockupPeriod} days</span>
                                        </div>
                                    </div>
                                </div>
                                )}
                            </div>
                        )}

                        {state.saleSetup && (
                            <div className="border rounded-lg">
                                <SectionHeader title="Token Sale Setup" sectionKey="tokenSaleSetup" expanded={expanded.tokenSaleSetup} onClick={handleExpand} />
                                {expanded.tokenSaleSetup && (
                                <div className="p-4 grid grid-cols-2 gap-4 bg-white rounded-b-lg">
                                    <div>
                                        <label className="text-xs text-gray-500">Launch Type</label>
                                        <div className="font-medium">{getExchangeDisplay(state.selectedExchange)}</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Fundraising Target</label>
                                        <div className="font-medium">{state.saleSetup.softCap} - {state.saleSetup.hardCap} SOL</div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Contribution Limits</label>
                                        <div className="font-medium">{state.saleSetup.minimumContribution} - {state.saleSetup.maximumContribution} SOL</div>
                                    </div>
                                </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            }
        </div>
    );
}

