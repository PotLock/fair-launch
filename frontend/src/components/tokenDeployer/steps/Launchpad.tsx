import { useState, useRef, ChangeEvent } from 'react';
import { IconArrowLeft, IconArrowRight } from '@tabler/icons-react';
import { InfoIcon, UploadIcon } from 'lucide-react';
import { useTokenDeployer } from '../../../context/TokenDeployerContext';
import { PublicKey } from '@solana/web3.js';

interface LaunchpadProps {
    setCurrentStep: (step: number) => void;
    currentStep: number;
}


const Launchpad = ({ setCurrentStep, currentStep }: LaunchpadProps) => {
    const { state, updateLaunchpad, setStepEnabled } = useTokenDeployer();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Remove unused state since we'll use context
    const { enabled, data } = state.launchpad;
    
    const handleLaunchTypeChange = (type: 'Whitelist' | 'Fair Launch') => {
        updateLaunchpad({ launchType: type });
        setIsDropdownOpen(false);
    };

    const updateField = (field: string, value: any) => {
        updateLaunchpad({ [field]: value });
    };

    const addWhitelistAddress = () => {
        const newAddresses = [...data.whitelist.data.walletAddresses, ''];
        updateField('whitelist', {
            ...data.whitelist,
            data: { ...data.whitelist.data, walletAddresses: newAddresses }
        });
    };

    // Todo: Fix function to remove whitelist address
    // const removeWhitelistAddress = (index: number) => {
    //     const newAddresses = [...data.whitelist.data.walletAddresses];
    //     newAddresses.splice(index, 1);
    //     updateField('whitelist', {
    //         ...data.whitelist,
    //         data: { ...data.whitelist.data, walletAddresses: newAddresses }
    //     });
    // };

    const handleAddressChange = (index: number, value: string) => {
        try {
            // Only validate if there's a value
            if (value.trim()) {
                new PublicKey(value);
            }
            
            const newAddresses = [...data.whitelist.data.walletAddresses];
            newAddresses[index] = value;
            updateField('whitelist', {
                ...data.whitelist,
                data: { ...data.whitelist.data, walletAddresses: newAddresses },
                errors: {
                    ...data.whitelist.errors,
                    walletAddresses: {
                        ...data.whitelist.errors?.walletAddresses,
                        [index]: undefined // Clear error when address is valid
                    }
                }
            });
        } catch (error) {
            // If validation fails, still update the value but mark it as invalid
            const newAddresses = [...data.whitelist.data.walletAddresses];
            newAddresses[index] = value;
            updateField('whitelist', {
                ...data.whitelist,
                data: { ...data.whitelist.data, walletAddresses: newAddresses },
                errors: {
                    ...data.whitelist.errors,
                    walletAddresses: {
                        ...data.whitelist.errors?.walletAddresses,
                        [index]: 'Invalid Solana wallet address'
                    }
                }
            });
        }
    };

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const addresses = text.split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);
            
            updateField('whitelist', {
                ...data.whitelist,
                data: { 
                    ...data.whitelist.data, 
                    walletAddresses: [...data.whitelist.data.walletAddresses, ...addresses] 
                }
            });
        };
        reader.readAsText(file);
    };

    const downloadSampleCSV = () => {
        const sampleContent = "wallet_address_1\nwallet_address_2\nwallet_address_3";
        const blob = new Blob([sampleContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'whitelist_sample.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <div>
                    <h1 className="text-lg font-bold">Launchpad Configuration</h1>
                    <p className="text-xs text-gray-500">Configure your token launch parameters. The launchpad will help you distribute your tokens to initial investors.</p> 
                </div>
                <button
                    onClick={() => setStepEnabled('launchpad', !enabled)}
                    className={`
                    relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                    ${enabled ? 'bg-black' : 'bg-gray-200'}
                    `}
                >
                    <span
                    className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                        ${enabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                    />
                </button>
            </div>
            
            {enabled && (
                <div className='space-y-6'>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium">Launch Type</label>
                        <div className="relative">
                            <div 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full p-2 border border-gray-300 rounded-md cursor-pointer flex justify-between items-center hover:border-gray-400"
                            >
                                <span className="text-sm">
                                    {data.launchType}
                                </span>
                                <svg 
                                    className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            
                            {isDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                                    <div 
                                        className={`p-2 text-sm cursor-pointer hover:bg-gray-100 ${data.launchType === 'Whitelist' ? 'bg-gray-50' : ''}`}
                                        onClick={() => handleLaunchTypeChange('Whitelist')}
                                    >
                                        Whitelist
                                    </div>
                                    <div 
                                        className={`p-2 text-sm cursor-pointer hover:bg-gray-100 ${data.launchType === 'Fair Launch' ? 'bg-gray-50' : ''}`}
                                        onClick={() => handleLaunchTypeChange('Fair Launch')}
                                    >
                                        Fair Launch
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className='space-y-2 mb-2'>
                                <label className="block text-sm font-medium">Soft Cap (SOL)</label>
                                <input 
                                    type="text" 
                                    value={data.softCap || ''}
                                    onChange={(e) => updateField('softCap', e.target.value)}
                                    placeholder="0.02"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                                />
                            </div>
                            <span className="text-sm text-gray-500">Current rate: 1 SOL = $150 USD</span>
                        </div>
                        <div className="space-y-2">
                            <div className='space-y-2 mb-2'>
                                <label className="block text-sm font-medium">Hard Cap (SOL)</label>
                                <input 
                                    type="text" 
                                    value={data.hardCap || ''}
                                    onChange={(e) => updateField('hardCap', e.target.value)}
                                    placeholder="750"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                                />
                            </div>
                            <span className="text-sm text-gray-500">Current rate: 1 SOL = $150 USD</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Start Date</label>
                            <input 
                                type="date" 
                                value={data.startTime || ''}
                                onChange={(e) => updateField('startTime', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">End Date</label>
                            <input 
                                type="date" 
                                value={data.endTime || ''}
                                onChange={(e) => updateField('endTime', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Minimum Contribution (SOL)</label>
                            <input 
                                type="text" 
                                value={data.minContribution || ''}
                                onChange={(e) => updateField('minContribution', e.target.value)}
                                placeholder="0.1"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                            />
                            <p className="text-xs text-gray-500">Minimum amount an investor can contribute</p>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">Maximum Contribution (SOL)</label>
                            <input 
                                type="text" 
                                value={data.maxContribution || ''}
                                onChange={(e) => updateField('maxContribution', e.target.value)}
                                placeholder="10"
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                            />
                            <p className="text-xs text-gray-500">Maximum amount an investor can contribute</p>
                        </div>
                    </div>

                    {data.launchType === 'Whitelist' && (
                        <div className="space-y-4">
                            <div className='space-y-1'>
                                <h3 className="font-medium">Whitelist Settings</h3>
                                <p className="text-xs text-gray-500">In a whitelist sale, only pre-approved addresses can participate in the token sale.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium">Token Price</label>
                                    <input 
                                        type="text" 
                                        value={data.whitelist.data.tokenPrice || ''}
                                        onChange={(e) => updateField('whitelist', { 
                                            ...data.whitelist,
                                            data: { ...data.whitelist.data, tokenPrice: e.target.value }
                                        })}
                                        placeholder="0.1"
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                                    />
                                    <p className="text-xs text-gray-500">Fixed price per token for whitelisted participants</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium">Whitelist Duration (days)</label>
                                    <input 
                                        type="text" 
                                        value={data.whitelist.data.whitelistDuration || ''}
                                        onChange={(e) => updateField('whitelist', {
                                            ...data.whitelist,
                                            data: { ...data.whitelist.data, whitelistDuration: e.target.value }
                                        })}
                                        placeholder="10"
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black" 
                                    />
                                    <p className="text-xs text-gray-500">Duration of the whitelist registration period</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="block font-medium">Whitelist Addresses</label>
                                <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-md">
                                    {data.whitelist.data.walletAddresses.map((address, index) => (
                                        <div key={index} className="flex items-center gap-4">
                                            <div className='p-6 px-10 w-[50px] flex justify-center items-center bg-blue-50'>
                                                <span className="text-sm">{index + 1}.</span>
                                            </div>
                                            <input 
                                                type="text" 
                                                value={address}
                                                onChange={(e) => handleAddressChange(index, e.target.value)}
                                                placeholder="Type wallet address here"
                                                className={`flex-1 focus:outline-none ${
                                                    data.whitelist.errors?.walletAddresses?.[index] 
                                                    ? 'border-b border-red-500' 
                                                    : 'border-b border-gray-200'
                                                }`}
                                            />
                                            {data.whitelist.errors?.walletAddresses?.[index] && (
                                                <div className="text-red-500 text-sm">
                                                    {data.whitelist.errors.walletAddresses[index]}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className='flex justify-between items-center gap-4 border border-blue-200 bg-blue-50 rounded-md p-6 px-8'>
                                    <div className="flex gap-4 items-center">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            accept=".csv"
                                            className="hidden"
                                        />
                                        <button 
                                            onClick={() => fileInputRef.current?.click()} 
                                            className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-md hover:bg-opacity-90"
                                        >
                                            <UploadIcon className='w-4 h-4 text-white' />
                                            <span className="text-sm">Upload CSV</span>
                                        </button>
                                        <button 
                                            onClick={downloadSampleCSV}
                                            className="text-sm text-black hover:underline"
                                        >
                                            Download CSV Sample
                                        </button>
                                    </div>
                                    <div className='flex gap-20 items-center'>
                                        <div className='h-[60px] w-0.5 bg-[#0F172A]'/>
                                        <div className='flex gap-2 items-center'>
                                            <button 
                                                onClick={addWhitelistAddress}
                                                className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-md hover:bg-opacity-90"
                                            >
                                                <span className="text-sm">Add</span>
                                            </button>
                                            <span className='text-sm bg-blue-100 border text-[#0A3245] border-blue-200 rounded-md px-2 py-1 w-[200px]'>New wallet address</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {data.launchType === 'Fair Launch' && (
                        <div className="space-y-4">
                            <div className='space-y-1'>
                                <h3 className="font-medium">Fair Launch Settings</h3>
                                <p className="text-xs text-gray-500">In a fair launch, all participants have equal opportunity to acquire tokens at the same price.</p>
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div className='space-y-2'>
                                    <div className='space-y-2'>
                                        <label className="block text-sm font-medium">Token Price</label>
                                        <input 
                                            type="text" 
                                            value={data.fairLaunch.data.tokenPrice || ''}
                                            onChange={(e) => updateField('fairLaunch', {
                                                ...data.fairLaunch,
                                                data: { ...data.fairLaunch.data, tokenPrice: e.target.value }
                                            })}
                                            placeholder='0.1' 
                                            className='w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black' 
                                        />
                                        <span className='text-xs text-gray-500'>Fixed price per token for all participants</span>
                                    </div>
                                </div>
                                <div className='space-y-2'>
                                    <div className='flex gap-2 items-center'>
                                        <label className="block text-sm font-medium">Max Tokens Per Wallet</label>
                                        <InfoIcon className='w-4 h-4' />
                                    </div>
                                    <input 
                                        type="number" 
                                        value={data.fairLaunch.data.maxTokensPerWallet || ''}
                                        onChange={(e) => updateField('fairLaunch', {
                                            ...data.fairLaunch,
                                            data: { ...data.fairLaunch.data, maxTokensPerWallet: Number(e.target.value) }
                                        })}
                                        placeholder='1000' 
                                        className='w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black' 
                                    />
                                    <div className='flex justify-between items-center'>
                                        <span className='text-xs text-gray-500'>Anti-whale measure to ensure fair distribution</span>
                                        <span className='text-xs'>0.10% of supply</span>
                                    </div>
                                </div>
                            </div>
                            <div className='space-y-2'>
                                <div className='space-y-2'>
                                    <label className="block text-sm font-medium">Distribution Delay (hours)</label>
                                    <input 
                                        type="number" 
                                        value={data.fairLaunch.data.distributionDelay || ''}
                                        onChange={(e) => updateField('fairLaunch', {
                                            ...data.fairLaunch,
                                            data: { ...data.fairLaunch.data, distributionDelay: Number(e.target.value) }
                                        })}
                                        placeholder='24' 
                                        className='w-full p-2 border border-gray-300 rounded-md focus:ring-black focus:border-black' 
                                    />
                                    <span className='text-xs text-gray-500'>Time delay after sale ends before tokens are distributed (0 for immediate)</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex flex-row gap-2 justify-between">
                <button 
                    className="border border-gray-300 text-gray-500 py-2 px-4 rounded-md hover:bg-gray-100 transition-colors flex flex-row gap-2 items-center justify-center" 
                    onClick={() => setCurrentStep(currentStep - 1)}
                    disabled={currentStep === 0}
                >
                    <IconArrowLeft className="w-4 h-4" />
                    Previous
                </button>
                <button 
                    className="bg-black text-white py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors flex flex-row gap-2 items-center justify-center" 
                    onClick={() => setCurrentStep(currentStep + 1)}
                >
                    Next
                    <IconArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Launchpad;