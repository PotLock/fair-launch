import { IconChevronDown } from '@tabler/icons-react';
import { useState } from 'react';
import { useTokenDeployer } from '../../../context/TokenDeployerContext';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
    const { state } = useTokenDeployer();
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
                className="flex items-center justify-between cursor-pointer"
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
                                    <div>
                                        <div className="text-xs text-gray-500">Name</div>
                                        <div className="font-medium">{state.basicInfo.data.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Symbol</div>
                                        <div className="font-medium">{state.basicInfo.data.symbol}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Supply</div>
                                        <div className="font-medium">{state.basicInfo.data.supply}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Decimal</div>
                                        <div className="font-medium">{state.basicInfo.data.decimals}</div>
                                    </div>
                                    <div className="col-span-2 border-t pt-2 mt-2">
                                        <div className="text-xs text-gray-500 mb-1">Description</div>
                                        <div className="font-medium text-sm">{state.basicInfo.data.description}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Revoke Mint Authority</div>
                                        <div className="font-medium">{state.basicInfo.data.revokeMintEnabled ? 'Yes' : 'No'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Revoke Freeze Authority</div>
                                        <div className="font-medium">{state.basicInfo.data.revokeFreezeEnabled ? 'Yes' : 'No'}</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Token Distribution */}
                        {state.allocation.enabled && (
                        <div className="border rounded-lg">
                            <SectionHeader title="Token Distribution" sectionKey="tokenDistribution" expanded={expanded.tokenDistribution} onClick={handleExpand} />
                            {expanded.tokenDistribution && (
                            <div className="p-4 grid grid-cols-2 gap-4 bg-white rounded-b-lg">
                                {state.allocation.data.map((allocation, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <div className="text-xs text-gray-500">{allocation.description || `Allocation #${idx + 1}`}</div>
                                    <div className="font-medium">{allocation.percentage}%</div>
                                </div>
                                ))}
                            </div>
                            )}
                        </div>
                        )}

                        {/* Token Release Schedule */}
                        {state.vesting.enabled && (
                        <div className="border rounded-lg">
                            <SectionHeader title="Token Release Schedule" sectionKey="tokenReleaseSchedule" expanded={expanded.tokenReleaseSchedule} onClick={handleExpand} />
                            {expanded.tokenReleaseSchedule && (
                            <div className="p-4 bg-white rounded-b-lg space-y-3">
                                {state.vesting.data.map((vesting, idx) => (
                                <div key={idx} className="flex justify-between items-center">
                                    <div>
                                    <div className="text-xs text-gray-500">{vesting.description || `Schedule #${idx + 1}`}</div>
                                    <div className="text-xs text-gray-400">{vesting.cliffPeriod} days cliff, {vesting.vestingDuration} days duration</div>
                                    </div>
                                    <div className="font-medium">{vesting.percentage}%</div>
                                </div>
                                ))}
                            </div>
                            )}
                        </div>
                        )}

                        {/* Price Mechanism */}
                        {state.bondingCurve.enabled && (
                        <div className="border rounded-lg">
                            <SectionHeader title="Price Mechanism" sectionKey="priceMechanism" expanded={expanded.priceMechanism} onClick={handleExpand} />
                            {expanded.priceMechanism && (
                            <div className="p-4 grid grid-cols-2 gap-4 bg-white rounded-b-lg">
                                <div>
                                    <div className="text-xs text-gray-500">Curve Type</div>
                                    <div className="font-medium">{state.bondingCurve.data.curveType}</div>
                                    </div>
                                    <div>
                                    <div className="text-xs text-gray-500">Initial Price</div>
                                    <div className="font-medium">{state.bondingCurve.data.initialPrice} SOL</div>
                                    </div>
                                    <div>
                                    <div className="text-xs text-gray-500">Target Price</div>
                                    <div className="font-medium">{state.bondingCurve.data.targetPrice} SOL</div>
                                    </div>
                                    <div>
                                    <div className="text-xs text-gray-500">Max Supply</div>
                                    <div className="font-medium">{state.bondingCurve.data.maxSupply}</div>
                                </div>
                            </div>
                            )}
                        </div>
                        )}

                        {/* DEX Listing Setup */}
                        {state.liquidity.enabled && (
                        <div className="mb-4 border rounded-lg">
                            <SectionHeader title="DEX Listing Setup" sectionKey="dexListingSetup" expanded={expanded.dexListingSetup} onClick={handleExpand} />
                            {expanded.dexListingSetup && (
                            <div className="p-4 grid grid-cols-2 gap-4 bg-white rounded-b-lg">
                                <div>
                                <div className="text-xs text-gray-500">DEX</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <img src={state.liquidity.data.launchLiquidityOn.icon} alt={state.liquidity.data.launchLiquidityOn.name} className="w-5 h-5 rounded-full" />
                                    <span className="font-medium">{state.liquidity.data.launchLiquidityOn.name}</span>
                                </div>
                                </div>
                                <div>
                                <div className="text-xs text-gray-500">Liquidity Type</div>
                                <div className="font-medium capitalize">{state.liquidity.data.liquidityType}-Sided</div>
                                </div>
                                <div>
                                <div className="text-xs text-gray-500">Liquidity Percentage</div>
                                <div className="font-medium">{state.liquidity.data.liquidityPercentage}%</div>
                                </div>
                                <div>
                                <div className="text-xs text-gray-500">Lockup Period</div>
                                <div className="font-medium">{state.liquidity.data.liquidityLockupPeriod} days</div>
                                </div>
                            </div>
                            )}
                        </div>
                        )}

                        {/* Token Sale Setup */}
                        {state.launchpad.enabled && (
                        <div className="border rounded-lg">
                            <SectionHeader title="Token Sale Setup" sectionKey="tokenSaleSetup" expanded={expanded.tokenSaleSetup} onClick={handleExpand} />
                            {expanded.tokenSaleSetup && (
                            <div className="p-4 grid grid-cols-2 gap-4 bg-white rounded-b-lg">
                                <div>
                                <div className="text-xs text-gray-500">Launch Type</div>
                                <div className="font-medium">{state.launchpad.data.launchType}</div>
                                </div>
                                <div>
                                <div className="text-xs text-gray-500">Fundraising Target</div>
                                <div className="font-medium">{state.launchpad.data.softCap} - {state.launchpad.data.hardCap} SOL</div>
                                </div>
                                <div>
                                <div className="text-xs text-gray-500">Contribution Limits</div>
                                <div className="font-medium">{state.launchpad.data.minContribution} - {state.launchpad.data.maxContribution} SOL</div>
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

