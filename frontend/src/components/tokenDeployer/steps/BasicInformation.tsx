import React, { useState } from 'react';
import { IconCloudUpload,IconUpload, IconAdjustmentsHorizontal, IconArrowLeft,IconArrowRight } from '@tabler/icons-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs';
import {ShieldCheck} from "lucide-react"

interface FormData {
  tokenInfo: {
    name: string;
    symbol: string;
    description?: string;
    supply: string;
    decimals: string;
    logo?: File;
  };
  socialLinks: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  dexTools: {
    logo?: File;
    banner?: File;
  };
  tags: string[];
}

interface BasicInformationProps {
    setCurrentStep: (step: number) => void;
    currentStep: number;
}

const BasicInformation = ({setCurrentStep, currentStep}: BasicInformationProps) => {
    const [logoPrompt, setLogoPrompt] = useState<string|null>(null);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
    const [useLogoUrl, setUseLogoUrl] = useState<boolean>(false);
    const [logoUrl, setLogoUrl] = useState<string|null>(null);
    const [socialLinksEnabled, setSocialLinksEnabled] = useState<boolean>(true);
    const [dexToolsEnabled, setDexToolsEnabled] = useState<boolean>(true);
    const [revokeMintEnabled, setRevokeMintEnabled] = useState<boolean>(true);
    const [revokeFreezeEnabled, setRevokeFreezeEnabled] = useState<boolean>(true);
    const [governanceEnabled, setGovernanceEnabled] = useState<boolean>(true);
    const [formData, setFormData] = useState<FormData>({
        tokenInfo: {
        name: '',
        symbol: '',
        description: '',
        supply: '',
        decimals: '',
        },
        socialLinks: {},
        dexTools: {},
        tags: [],
    });

    const handleInputChange = (section: keyof FormData, field: string, value: string) => {
        setFormData((prev) => ({
        ...prev,
        [section]: { ...prev[section], [field]: value },
        }));
    };

    const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
        setFormData((prev) => ({
            ...prev,
            tokenInfo: { ...prev.tokenInfo, logo: file },
        }));
        }
    };

    const handleLogoUrlChange = (url: string) => {
        setLogoUrl(url);
        if (url) {
            fetch(url)
            .then(response => response.blob())
            .then(blob => {
                const file = new File([blob], 'logo.png', { type: 'image/png' });
                setFormData((prev) => ({
                    ...prev,
                    tokenInfo: { ...prev.tokenInfo, logo: file },
                }));
            })
            .catch(error => {
                console.error('Error loading logo from URL:', error);
            });
        }
    };

    const handleTagAdd = (tag: string) => {
        setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
        }));
    };

    const handleGenerateLogo = async () => {
        setIsGenerating(true);
        // Placeholder for generating logo with AI
        const generated = '';
        setGeneratedLogo(generated);
        setIsGenerating(false);
    };

    const handleUseGeneratedLogo = () => {
        console.log('Using generated logo');
    };

    const handleDexToolsFileUpload = (type: 'logo' | 'banner', event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFormData((prev) => ({
                ...prev,
                dexTools: { ...prev.dexTools, [type]: file },
            }));
        }
    };

    return(
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium mb-1">
                    Token Name (Max 50) <strong className='text-red-500'>*</strong>
                    </label>
                    <input
                    type="text"
                    value={formData.tokenInfo.name}
                    onChange={(e) => handleInputChange('tokenInfo', 'name', e.target.value)}
                    className="w-full p-2 border rounded-md placeholder:text-sm"
                    placeholder="USDT"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">
                    Token Symbol (Max 10) <strong className='text-red-500'>*</strong>
                    </label>
                    <input
                    type="text"
                    value={formData.tokenInfo.symbol}
                    onChange={(e) => handleInputChange('tokenInfo', 'symbol', e.target.value)}
                    className="w-full p-2 border rounded-md placeholder:text-sm"
                    placeholder="USDT"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">
                    Description (Optional)
                </label>
                <textarea
                    value={formData.tokenInfo.description}
                    onChange={(e) => handleInputChange('tokenInfo', 'description', e.target.value)}
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
                    value={formData.tokenInfo.supply}
                    onChange={(e) => handleInputChange('tokenInfo', 'supply', e.target.value)}
                    className="w-full p-2 border rounded-md placeholder:text-sm"
                    placeholder="2,000"
                    />
                    <span className='text-xs text-gray-500 mt-1'>The initial number of available tokens that will be created in your wallet</span>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">
                    Decimals <strong className='text-red-500'>*</strong>
                    </label>
                    <input
                    type="text"
                    value={formData.tokenInfo.decimals}
                    onChange={(e) => handleInputChange('tokenInfo', 'decimals', e.target.value)}
                    className="w-full p-2 border rounded-md placeholder:text-sm"
                    placeholder="eg. 3"
                    />
                    <span className='text-xs text-gray-500 mt-1'>Change the number of decimals for your token</span>
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
                        <div className="flex flex-row justify-between items-start">                  
                        {useLogoUrl ? (
                            <input
                            type="url"
                            placeholder="Enter logo URL"
                            className="w-full p-2 border rounded-md max-w-2xl placeholder:text-sm"
                            value={logoUrl || ''}
                            onChange={(e) => handleLogoUrlChange(e.target.value)}
                            />
                        ) : (
                            <div className="flex justify-center rounded-xl border-gray-200 px-6 py-8 bg-gray-100 w-[100px]">
                            <div className="text-center">
                                <IconCloudUpload className="mx-auto h-7 w-7" />
                                <div className="cursor-pointer">
                                <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer"
                                >
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

                        {formData.tokenInfo.logo && !useLogoUrl && (
                            <div className="mt-4">
                            <img
                                src={URL.createObjectURL(formData.tokenInfo.logo)}
                                alt="Preview"
                                className="mx-auto h-20 w-20 object-cover rounded-full"
                            />
                            </div>
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
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                        handleTagAdd((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                        }
                    }}
                    />
                    <div className='flex flex-wrap gap-2'>
                    {formData.tags.map((tag, index) => (
                        <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 rounded-lg text-sm"
                        >
                        {tag}
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
                        onClick={() => setSocialLinksEnabled(!socialLinksEnabled)}
                        className={`
                        relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                        ${socialLinksEnabled ? 'bg-black' : 'bg-gray-200'}
                        `}
                    >
                        <span
                        className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                            ${socialLinksEnabled ? 'translate-x-6' : 'translate-x-1'}
                        `}
                        />
                    </button>
                    </div>
                </div>
                {socialLinksEnabled && (
                    <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className='w-full'>
                        <label className='block text-sm font-medium mb-1'>
                        Website
                        </label>
                        <input
                        type="url"
                        placeholder="https://"
                        value={formData.socialLinks.website || ''}
                        onChange={(e) => handleInputChange('socialLinks', 'website', e.target.value)}
                        className={`p-2 border rounded-md w-full placeholder:text-sm`}
                        disabled={!socialLinksEnabled}
                        />
                    </div>
                    <div className='w-full'>
                        <label className='block text-sm font-medium mb-1'>
                        Twitter
                        </label>
                        <input
                        type="url"
                        placeholder="https://x.com/"
                        value={formData.socialLinks.twitter || ''}
                        onChange={(e) => handleInputChange('socialLinks', 'twitter', e.target.value)}
                        className={`p-2 border rounded-md w-full placeholder:text-sm`}
                        disabled={!socialLinksEnabled}
                        />
                    </div>
                    <div className='w-full'>
                        <label className='block text-sm font-medium mb-1'>
                        Telegram
                        </label>
                        <input
                        type="url"
                        placeholder="https://t.me/"
                        value={formData.socialLinks.telegram || ''}
                        onChange={(e) => handleInputChange('socialLinks', 'telegram', e.target.value)}
                        className={`p-2 border rounded-md w-full placeholder:text-sm`}
                        disabled={!socialLinksEnabled}
                        />
                    </div>
                    <div className='w-full'>
                        <label className='block text-sm font-medium mb-1'>
                        Discord
                        </label>
                        <input
                        type="url"
                        placeholder="https://discord.com/"
                        value={formData.socialLinks.discord || ''}
                        onChange={(e) => handleInputChange('socialLinks', 'discord', e.target.value)}
                        className={`p-2 border rounded-md w-full placeholder:text-sm`}
                        disabled={!socialLinksEnabled}
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
                                onClick={() => setDexToolsEnabled(!dexToolsEnabled)}
                                className={`
                                relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                                ${dexToolsEnabled ? 'bg-black' : 'bg-gray-200'}
                                `}
                            >
                                <span
                                className={`
                                    inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                                    ${dexToolsEnabled ? 'translate-x-6' : 'translate-x-1'}
                                `}
                                />
                            </button>
                            <h3 className="text-base font-medium">DEX Tool Integration</h3>
                        </div>
                        <p className="text-xs text-gray-500">Add your token information to DEXTools profile with a discounted price and much faster.</p>
                    </div>
                    <span className="text-sm text-gray-500">Fee: 0.1 SOL</span>
                </div>
                {dexToolsEnabled && (
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center space-x-1">
                                <label className="text-sm font-medium">Token Logo</label>
                                <span className="text-red-500">*</span>
                            </div>
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <IconUpload className="w-6 h-6 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
                                    <label className="mt-2 px-4 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                                        Select File
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleDexToolsFileUpload('logo', e)}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center space-x-1">
                                <label className="text-sm font-medium">Banner</label>
                                <span className="text-red-500">*</span>
                            </div>
                            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <IconUpload className="w-6 h-6 text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
                                        <label className="mt-2 px-4 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
                                        Select File
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => handleDexToolsFileUpload('banner', e)}
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-4 mt-6 pb-12">
                    <div className="flex items-center gap-2">
                        <IconAdjustmentsHorizontal className="w-6 h-6" />
                        <h4 className="text-sm font-medium">Additional settings</h4>
                    </div>

                    <div className="space-y-4">
                        <div className="flex flex-col gap-2">
                            <div className="space-y-1 w-full">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setRevokeMintEnabled(!revokeMintEnabled)}
                                            className={`
                                            relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                                            ${revokeMintEnabled ? 'bg-black' : 'bg-gray-200'}
                                            `}
                                        >
                                            <span
                                            className={`
                                                inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                                                ${revokeMintEnabled ? 'translate-x-6' : 'translate-x-1'}
                                            `}
                                            />
                                        </button>
                                        <span className="text-sm font-medium">Revoke Mint Authority</span>
                                    </div>
                                    <div className="text-sm text-gray-500">Fee: 0.1 SOL</div>
                                </div>
                                <p className="text-xs text-gray-500">Prevent additional token supply to increase investors trust.</p>
                            </div>
                            <div className="mt-2 p-3 flex flex-row gap-2 items-center bg-blue-50 rounded-md border border-blue-500">
                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                                <p className="text-sm">
                                    <span className="font-medium text-blue-500">Recommend!</span> Revoke right to mint new coins, this shows buyer of your coin that supply is fixed and cannot grow. DEX scanners will mark your coin as safe.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <div className="space-y-1 w-full">
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setRevokeFreezeEnabled(!revokeFreezeEnabled)}
                                            className={`
                                            relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                                            ${revokeFreezeEnabled ? 'bg-black' : 'bg-gray-200'}
                                            `}
                                        >
                                            <span
                                            className={`
                                                inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                                                ${revokeFreezeEnabled ? 'translate-x-6' : 'translate-x-1'}
                                            `}
                                            />
                                        </button>
                                        <span className="text-sm font-medium">Revoke Freeze Authority</span>
                                    </div>
                                    <div className="text-sm text-gray-500">Fee: 0.1 SOL</div>
                                </div>
                                <p className="text-xs text-gray-500">Prevent token freezing.</p>
                            </div>
                            <div className="mt-2 p-3 flex flex-row gap-2 items-center bg-blue-50 rounded-md border border-blue-500">
                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                                <p className="text-sm">
                                    <span className="font-medium text-blue-500">Recommend!</span> Revoke freeze right, you will make coin safer for potential buyers of your coin and get more sales. DEX scanners will mark your coin as safe.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-white">
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => setGovernanceEnabled(!governanceEnabled)}
                                        className={`
                                        relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 ease-in-out
                                        ${governanceEnabled ? 'bg-black' : 'bg-gray-200'}
                                        `}
                                    >
                                        <span
                                        className={`
                                            inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out
                                            ${governanceEnabled ? 'translate-x-6' : 'translate-x-1'}
                                        `}
                                        />
                                    </button>
                                    <span className="text-sm font-medium">Enable Governance</span>
                                </div>
                                <p className="text-xs text-gray-500">Allow token holders to vote on Proposal</p>
                            </div>
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
                        onClick={() => setCurrentStep(currentStep + 1)}
                        disabled={currentStep === 3}
                    >
                        Next
                        <IconArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
};

export default BasicInformation;