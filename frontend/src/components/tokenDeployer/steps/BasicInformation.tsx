import React, { useState, useEffect } from 'react';
import { IconCloudUpload, IconArrowLeft,IconArrowRight } from '@tabler/icons-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import {ShieldCheck} from "lucide-react"
import { useTokenDeployer } from '../../../context/TokenDeployerContext';
import { IconX } from '@tabler/icons-react';

interface BasicInformationProps {
    setCurrentStep: (step: number) => void;
    currentStep: number;
}

const BasicInformation = ({ setCurrentStep, currentStep }: BasicInformationProps) => {
    const { state, updateBasicInfo, validateBasicInfo } = useTokenDeployer();
    const [logoPrompt, setLogoPrompt] = useState<string|null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
    const [useLogoUrl, setUseLogoUrl] = useState<boolean>(false);
    const [logoUrl, setLogoUrl] = useState<string|null>(null);

    const handleInputChange = (field: string, value: string | boolean) => {
        updateBasicInfo({ [field]: value });
    };

    const handleSocialLinkChange = (platform: string, value: string) => {
        updateBasicInfo({
            socialLinks: {
                ...state.basicInfo.data.socialLinks,
                [platform]: value
            }
        });
    };

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // When uploading a file, clear the URL immediately
            updateBasicInfo({ logo: file, logoUrl: undefined });
        } else {
            // If no file selected, clear both states
            updateBasicInfo({ logo: null, logoUrl: undefined });
        }
    };

    const handleLogoUrlChange = (url: string) => {
        setLogoUrl(url);
        if (url) {
            try {
                // Validate URL format
                new URL(url);
                
                // Check if URL ends with common image extensions, ignoring query parameters
                const validImageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'];
                const urlWithoutQuery = url.split('?')[0];
                const hasValidExtension = validImageExtensions.some(ext => urlWithoutQuery.toLowerCase().endsWith(ext));
                
                if (!hasValidExtension) {
                    throw new Error('URL must end with a valid image extension (.png, .jpg, .jpeg, .gif, .webp, .svg)');
                }

                // Update both logoUrl and clear logo
                updateBasicInfo({ 
                    logoUrl: url,
                    logo: null,
                    isLogoUrl: true
                });
            } catch (error) {
                console.error('Invalid URL:', error);
                // Clear both states
                updateBasicInfo({ 
                    logoUrl: undefined,
                    logo: null,
                    isLogoUrl: false
                });
            }
        } else {
            // Clear both states
            updateBasicInfo({ 
                logoUrl: undefined,
                logo: null,
                isLogoUrl: false
            });
        }
    };

    const handleTagAdd = (tag: string) => {
        const currentTags = state.basicInfo.data.tags || [];
        if (currentTags.length >= 3) {
            return;
        }
        updateBasicInfo({ tags: [...currentTags, tag] });
    };

    const handleTagRemove = (indexToRemove: number) => {
        const currentTags = state.basicInfo.data.tags || [];
        const updatedTags = currentTags.filter((_, index) => index !== indexToRemove);
        updateBasicInfo({ tags: updatedTags });
    };

    //todo: Placeholder for generating logo with AI   
    const handleGenerateLogo = async () => {
        setIsGenerating(true);
        // 
        const generated = '';
        setGeneratedLogo(generated);
        setIsGenerating(false);
    };

    const handleUseGeneratedLogo = () => {
        console.log('Using generated logo');
    };

    const handleNext = () => {
        const isValid = validateBasicInfo();
        if (isValid) {
            setCurrentStep(currentStep + 1);
        }
    };

    // Update useEffect to handle state synchronization
    useEffect(() => {
        if (logoUrl !== state.basicInfo.data.logoUrl) {
            setLogoUrl(state.basicInfo.data.logoUrl || '');
        }
    }, [state.basicInfo.data.logoUrl, logoUrl]);

    return(
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Token Name (Max 50) <strong className='text-red-500'>*</strong>
                    </label>
                    <input
                        type="text"
                        value={state.basicInfo.data.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full p-2 border rounded-md placeholder:text-sm ${state.basicInfo.errors.name ? 'border-red-500' : ''}`}
                        placeholder="USDT"
                    />
                    {state.basicInfo.errors.name && (
                        <span className="text-xs text-red-500">{state.basicInfo.errors.name}</span>
                    )}
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Token Symbol (Max 10) <strong className='text-red-500'>*</strong>
                    </label>
                    <input
                        type="text"
                        value={state.basicInfo.data.symbol}
                        onChange={(e) => handleInputChange('symbol', e.target.value?.toUpperCase().slice(0, 10))}
                        className={`w-full p-2 border rounded-md placeholder:text-sm ${state.basicInfo.errors.symbol ? 'border-red-500' : ''}`}
                        placeholder="USDT"
                    />
                    {state.basicInfo.errors.symbol && (
                        <span className="text-xs text-red-500">{state.basicInfo.errors.symbol}</span>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">
                    Description (Optional)
                </label>
                <textarea
                    value={state.basicInfo.data.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full p-2 border rounded-md placeholder:text-sm"
                    rows={3}
                    placeholder="Describe your token's purpose"
                />
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Supply <strong className='text-red-500'>*</strong>
                    </label>
                    <input
                        type="text"
                        value={state.basicInfo.data.supply}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            handleInputChange('supply', value);
                        }}
                        className={`w-full p-2 border rounded-md placeholder:text-sm ${state.basicInfo.errors.supply ? 'border-red-500' : ''}`}
                        placeholder="2,000"
                    />
                    <div className='flex flex-col'>
                        {state.basicInfo.errors.supply && (
                            <span className="text-xs text-red-500">{state.basicInfo.errors.supply}</span>
                        )}
                        <span className='text-xs text-gray-500 mt-1'>The initial number of available tokens that will be created in your wallet</span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">
                        Decimals <strong className='text-red-500'>*</strong>
                    </label>
                    <input
                        type="text"
                        value={state.basicInfo.data.decimals}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9]/g, '');
                            handleInputChange('decimals', value);
                        }}
                        className={`w-full p-2 border rounded-md placeholder:text-sm ${state.basicInfo.errors.decimals ? 'border-red-500' : ''}`}
                        placeholder="eg. 3"
                    />
                    <div className='flex flex-col'>
                        {state.basicInfo.errors.decimals && (
                            <span className="text-xs text-red-500">{state.basicInfo.errors.decimals}</span>
                        )}
                        <span className='text-xs text-gray-500 mt-1'>Change the number of decimals for your token</span>
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">
                    Logo <strong className='text-red-500'>*</strong>
                </label>
                <div className="mt-2">
                    <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="w-[300px] flex gap-1 p-1 h-auto">
                        <TabsTrigger 
                            value="upload" 
                            className="flex-1 bg-transparent data-[state=active]:bg-white data-[state=active]:text-black font-normal text-[#64748B] data-[state=active]:shadow-none rounded-lg"
                            >
                            Upload
                        </TabsTrigger>
                        <TabsTrigger 
                            value="generate" 
                            className="flex-1 bg-transparent data-[state=active]:bg-white data-[state=active]:text-black font-normal text-[#64748B] data-[state=active]:shadow-none rounded-lg"
                            >
                            Generate with AI
                        </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload" className="mt-4">
                        <div className="flex flex-col space-y-2">
                        <div className="flex flex-row justify-between items-start">                  
                        {useLogoUrl ? (
                            <input
                                type="url"
                                placeholder="Enter logo URL"
                                className={`w-full p-2 border rounded-md max-w-2xl placeholder:text-sm ${state.basicInfo.errors.logo ? 'border-red-500' : ''}`}
                                value={logoUrl || ''}
                                onChange={(e) => handleLogoUrlChange(e.target.value)}
                            />
                        ) : (
                            state.basicInfo.data.logo && !logoUrl ? (
                                <div className="mt-4 relative">
                                    <img
                                        src={URL.createObjectURL(state.basicInfo.data.logo)}
                                        alt="Preview"
                                        className="h-20 w-20 object-cover rounded-xl"
                                    />
                                    <button
                                        onClick={() => {
                                            updateBasicInfo({ logo: null });
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <IconX className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : state.basicInfo.data.logoUrl ? (
                                <div className="mt-4 relative">
                                    <img
                                        src={state.basicInfo.data.logoUrl}
                                        alt="Preview"
                                        className="h-20 w-20 object-cover rounded-xl"
                                    />
                                    <button
                                        onClick={() => {
                                            updateBasicInfo({ logoUrl: undefined });
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                    >
                                        <IconX className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className={`flex justify-center rounded-xl border-2 ${state.basicInfo.errors.logo ? 'border-red-500' : 'border-gray-200'} px-6 py-8 bg-gray-100 w-[100px]`}>
                                    <div className="text-center">
                                        <div className="cursor-pointer">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer rounded-md font-medium text-sm"
                                            >
                                                <IconCloudUpload className={`mx-auto h-7 w-7 ${state.basicInfo.errors.logo ? 'text-red-500' : ''}`} />
                                                <input
                                                    id="file-upload"
                                                    name="file-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    accept="image/*"
                                                    onChange={handleLogoUpload}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                        <div className="flex items-center justify-end space-x-2">
                            <button
                            onClick={() => setUseLogoUrl(!useLogoUrl)}
                            className={`
                                relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                                ${useLogoUrl ? 'bg-black' : 'bg-gray-200'}
                            `}
                            >
                            <span
                                className={`
                                inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                                ${useLogoUrl ? 'translate-x-6' : 'translate-x-1'}
                                `}
                            />
                            </button>
                            <span className="text-sm font-medium">Enter logo url</span>
                        </div>
                        </div>
                        {state.basicInfo.errors.logo && (
                            <span className="text-xs text-red-500">{state.basicInfo.errors.logo}</span>
                        )}
                        </div>
                    </TabsContent>

                    <TabsContent value="generate" className="mt-4">
                        <div className="space-y-4 flex flex-col justify-end items-end">
                        <input
                            type="text"
                            placeholder="Describe your logo (e.g., 'A minimalist blue coin with waves')"
                            className="w-full p-2 border rounded-md placeholder:text-sm"
                            value={logoPrompt || ''}
                            onChange={(e) => setLogoPrompt(e.target.value)}
                        />
                        <div className='flex flex-row justify-end max-w-[200px]'>
                            <button
                            onClick={handleGenerateLogo}
                            className="w-full bg-black text-white py-2 px-4 rounded-md hover:bg-opacity-80 transition-colors"
                            disabled={isGenerating}
                            >
                            {isGenerating ? 'Generating...' : 'Generate Logo'}
                            </button>
                        </div>
                        {generatedLogo && (
                            <div className="mt-4">
                            <img
                                src={generatedLogo}
                                alt="Generated logo"
                                className="mx-auto h-20 w-20 object-cover rounded-full"
                            />
                            <button
                                onClick={handleUseGeneratedLogo}
                                className="mt-2 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                            >
                                Use This Logo
                            </button>
                            </div>
                        )}
                        </div>
                    </TabsContent>
                    </Tabs>
                </div>
            </div>

            <div className='space-y-2'>
                <label className="block text-sm font-medium mb-1">
                    Tags (Optional)
                </label>
                <span className='text-xs text-gray-500 mb-2'>Select tags that are most associated with your project - max 3 tags</span>
                <div className="flex flex-col gap-2">
                    <input
                    type="text"
                    placeholder="Enter tag"
                    className="px-3 py-2 border rounded-md text-sm placeholder:text-sm"
                    disabled={(state.basicInfo.data.tags || []).length >= 3}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                        handleTagAdd((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                        }
                    }}
                    />
                    <div className='flex flex-wrap gap-2'>
                    {state.basicInfo.data.tags?.map((tag, index) => (
                        <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 rounded-lg text-sm flex items-center gap-2"
                        >
                        {tag}
                        <button
                            onClick={() => handleTagRemove(index)}
                            className="text-gray-500 hover:text-red-500"
                        >
                            <IconX className="w-4 h-4" />
                        </button>
                        </span>
                    ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className='flex flex-row justify-between items-center border-b border-gray-300 pb-2'>
                    <div>
                        <h3 className="font-medium">Social Links & DEX Tools</h3>
                        <span className='text-xs text-gray-500'>Add links to your token metadata</span>
                    </div>
                    <div>
                        <button
                            onClick={() => handleInputChange('socialEnabled', !state.basicInfo.data.socialEnabled)}
                            className={`
                            relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                            ${state.basicInfo.data.socialEnabled ? 'bg-black' : 'bg-gray-200'}
                            `}
                        >
                            <span
                            className={`
                                inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                                ${state.basicInfo.data.socialEnabled ? 'translate-x-6' : 'translate-x-1'}
                            `}
                            />
                        </button>
                    </div>
                </div>
                {state.basicInfo.data.socialEnabled && (
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className='w-full'>
                            <label className='block text-sm font-medium mb-1'>
                                Website
                            </label>
                            <input
                                type="url"
                                placeholder="https://"
                                value={state.basicInfo.data.socialLinks?.website || ''}
                                onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                                className={`p-2 border rounded-md w-full placeholder:text-sm`}
                            />
                        </div>
                        <div className='w-full'>
                            <label className='block text-sm font-medium mb-1'>
                                Twitter
                            </label>
                            <input
                                type="url"
                                placeholder="https://x.com/"
                                value={state.basicInfo.data.socialLinks?.twitter || ''}
                                onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                                className={`p-2 border rounded-md w-full placeholder:text-sm`}
                            />
                        </div>
                        <div className='w-full'>
                            <label className='block text-sm font-medium mb-1'>
                                Telegram
                            </label>
                            <input
                                type="url"
                                placeholder="https://t.me/"
                                value={state.basicInfo.data.socialLinks?.telegram || ''}
                                onChange={(e) => handleSocialLinkChange('telegram', e.target.value)}
                                className={`p-2 border rounded-md w-full placeholder:text-sm`}
                            />
                        </div>
                        <div className='w-full'>
                            <label className='block text-sm font-medium mb-1'>
                                Discord
                            </label>
                            <input
                                type="url"
                                placeholder="https://discord.com/"
                                value={state.basicInfo.data.socialLinks?.discord || ''}
                                onChange={(e) => handleSocialLinkChange('discord', e.target.value)}
                                className={`p-2 border rounded-md w-full placeholder:text-sm`}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-6 mt-6">
                <div className="flex items-start justify-between">
                    <div className="flex flex-col space-y-1">
                        <div className='flex flex-row items-center space-x-2'>
                            <button
                                onClick={() => handleInputChange('revokeMintEnabled', !state.basicInfo.data.revokeMintEnabled)}
                                className={`
                                relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                                ${state.basicInfo.data.revokeMintEnabled ? 'bg-black' : 'bg-gray-200'}
                                `}
                            >
                                <span
                                className={`                                    inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                                    ${state.basicInfo.data.revokeMintEnabled ? 'translate-x-6' : 'translate-x-1'}
                                `}
                                />
                            </button>
                            <h3 className="text-base font-medium">Revoke Mint Authority</h3>
                        </div>
                        <p className="text-xs text-gray-500">Prevent additional token supply to increase investors trust.</p>
                    </div>
                    <span className="text-sm text-gray-500">Fee: 0.1 SOL</span>
                </div>
                <div className="mt-2 p-3 flex flex-row gap-2 items-center bg-blue-50 rounded-md border border-blue-500">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <p className="text-sm">
                        <span className="font-medium text-blue-500">Recommend!</span> Revoke right to mint new coins, this shows buyer of your coin that supply is fixed and cannot grow. DEX scanners will mark your coin as safe.
                    </p>
                </div>

                <div className="flex items-start justify-between">
                    <div className="flex flex-col space-y-1">
                        <div className='flex flex-row items-center space-x-2'>
                            <button
                                onClick={() => handleInputChange('revokeFreezeEnabled', !state.basicInfo.data.revokeFreezeEnabled)}
                                className={`
                                relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                                ${state.basicInfo.data.revokeFreezeEnabled ? 'bg-black' : 'bg-gray-200'}
                                `}
                            >
                                <span
                                className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                                    ${state.basicInfo.data.revokeFreezeEnabled ? 'translate-x-6' : 'translate-x-1'}
                                `}
                                />
                            </button>
                            <h3 className="text-base font-medium">Revoke Freeze Authority</h3>
                        </div>
                        <p className="text-xs text-gray-500">Prevent token freezing.</p>
                    </div>
                    <span className="text-sm text-gray-500">Fee: 0.1 SOL</span>
                </div>
                <div className="mt-2 p-3 flex flex-row gap-2 items-center bg-blue-50 rounded-md border border-blue-500">
                    <ShieldCheck className="w-5 h-5 text-blue-500" />
                    <p className="text-sm">
                        <span className="font-medium text-blue-500">Recommend!</span> Revoke freeze right, you will make coin safer for potential buyers of your coin and get more sales. DEX scanners will mark your coin as safe.
                    </p>
                </div>

                <div className="flex items-center justify-between bg-white">
                    <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handleInputChange('governanceEnabled', !state.basicInfo.data.governanceEnabled)}
                                className={`                                relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                                ${state.basicInfo.data.governanceEnabled ? 'bg-black' : 'bg-gray-200'}
                                `}
                            >
                                <span
                                className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                                    ${state.basicInfo.data.governanceEnabled ? 'translate-x-6' : 'translate-x-1'}
                                `}
                                />
                            </button>
                            <span className="text-sm font-medium">Enable Governance</span>
                        </div>
                        <p className="text-xs text-gray-500">Allow token holders to vote on Proposal</p>
                    </div>
                </div>
            </div>

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
                    onClick={handleNext}
                >
                    Next
                    <IconArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
};

export default BasicInformation;

