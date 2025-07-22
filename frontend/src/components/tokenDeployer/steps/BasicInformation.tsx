import { useState, useRef } from 'react';
import type { StepProps } from '../../../types';
import { ChevronDown, ChevronUp, Loader2, CircleCheck, Lightbulb } from 'lucide-react';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { useDeployStore } from '../../../stores/deployStores';
import { toast } from 'react-hot-toast';

export const BasicInformation = ({ isExpanded, stepKey, onHeaderClick }: StepProps) => {
    const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
    const [isUploadingBanner, setIsUploadingBanner] = useState<boolean>(false);
    const { basicInfo, updateBasicInfo, validationErrors, validateBasicInfo } = useDeployStore();
    const { name, symbol, description, supply, decimals, avatarUrl, bannerUrl } = basicInfo;
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    const handleInputChange = (field: string, value: string) => {
        updateBasicInfo({ [field]: value });
        validateBasicInfo();
    };

    // Recommendation logic
    const getRecommendations = () => {
        const recommendations: { [key: string]: string } = {};

        // Decimals recommendation
        if (!decimals || decimals === '') {
            recommendations.decimals = 'Recommended: 6 decimals for most tokens';
        } else if (Number(decimals) !== 6) {
            recommendations.decimals = 'Most tokens use 6 decimals for optimal compatibility';
        }

        // Total supply recommendation
        if (!supply || supply === '') {
            recommendations.supply = 'Recommended: 10,000,000 tokens for fair distribution';
        } else if (Number(supply) !== 10000000) {
            const currentSupply = Number(supply);
            if (currentSupply < 1000000) {
                recommendations.supply = 'Consider a larger supply (10M+) for better liquidity';
            } else if (currentSupply > 100000000) {
                recommendations.supply = 'Large supply may affect token price perception';
            }
        }

        return recommendations;
    };

    const recommendations = getRecommendations();

    const uploadToPinata = async (file: File, type: 'avatar' | 'banner'): Promise<string | null> => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            if (type === 'avatar') setIsUploadingAvatar(true);
            else setIsUploadingBanner(true);
            const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.PUBLIC_JWT_PINATA_SECRET}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const errorData = await res.json();
                console.error('Pinata error:', errorData);
                throw new Error(errorData.error?.message || 'Upload failed');
            }

            const data = await res.json();
            if (!data.IpfsHash) {
                toast.error('Upload failed');
                return null;
            }
            
            return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload file');
            return null;
        } finally {
            if (type === 'avatar') setIsUploadingAvatar(false);
            else setIsUploadingBanner(false);
        }
    };

    const handleImageUpload = async (type: 'avatar' | 'banner', file: File) => {
        if (file) {
            try {
                const pinataRes = await uploadToPinata(file, type);
                
                if (pinataRes) {
                    if (type === 'avatar') {
                        setAvatarPreview(pinataRes);
                        updateBasicInfo({ avatarUrl: pinataRes });
                    } else {
                        setBannerPreview(pinataRes);
                        updateBasicInfo({ bannerUrl: pinataRes });
                    }
                }
            } catch (error) {
                console.error('Upload error:', error);
            }
        }
    };

    const handleImageClick = (type: 'avatar' | 'banner') => {
        const inputRef = type === 'avatar' ? avatarInputRef : bannerInputRef;
        inputRef.current?.click();
    };

    const handleImageDrop = (type: 'avatar' | 'banner', e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            handleImageUpload(type, file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    // Check if all required fields are valid
    const isFormValid = () => {
        const hasErrors = Object.keys(validationErrors).some(key => 
            key.includes('name') || 
            key.includes('symbol') || 
            key.includes('supply') || 
            key.includes('decimals') ||
            key.includes('avatarUrl') ||
            key.includes('bannerUrl')
        );
        
        const hasRequiredFields = basicInfo.name.trim() !== '' && 
                                 basicInfo.symbol.trim() !== '' && 
                                 basicInfo.supply.trim() !== '' && 
                                 basicInfo.decimals.trim() !== '';
        
        const hasImages = basicInfo.avatarUrl && basicInfo.bannerUrl;
        
        return !hasErrors && hasRequiredFields && hasImages;
    };

    const avatarDisplay = avatarUrl || avatarPreview || undefined;
    const bannerDisplay = bannerUrl || bannerPreview || undefined;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full">
            <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => onHeaderClick(stepKey)}
            >
                <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>Basic Information</div>
                {isFormValid() ? (
                    <CircleCheck className="w-5 h-5 text-green-500" />
                ) : isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </div>
            {isExpanded && (
                <>
                    <div className="text-xs text-gray-500 mb-4">Token Name, Symbol & Supply</div>
                    <div className="space-y-4">
                        <div>
                            <div className="text-sm font-medium mb-1">Token Name <span className="text-red-500">*</span></div>
                            <Input 
                                placeholder="POTLAUNCH" 
                                value={name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={validationErrors.name ? "border-red-500 focus:border-red-500" : ""}
                            />
                            {validationErrors.name && <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>}
                        </div>
                        <div>
                            <div className="text-sm font-medium mb-1">Token Symbol <span className="text-red-500">*</span></div>
                            <Input 
                                placeholder="PTL" 
                                value={symbol}
                                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
                                className={validationErrors.symbol ? "border-red-500 focus:border-red-500" : ""}
                            />
                            {validationErrors.symbol && <p className="text-red-500 text-xs mt-1">{validationErrors.symbol}</p>}
                        </div>
                        <div>
                            <div className="text-sm font-medium mb-1">Total Supply <span className="text-red-500">*</span></div>
                            <Input 
                                placeholder="10000000" 
                                type="number"
                                value={supply}
                                onChange={(e) => handleInputChange('supply', e.target.value)}
                                className={validationErrors.supply ? "border-red-500 focus:border-red-500" : ""}
                            />
                            {validationErrors.supply && <p className="text-red-500 text-xs mt-1">{validationErrors.supply}</p>}
                            {recommendations.supply && (
                                <div className="flex items-center gap-1 mt-1">
                                    <Lightbulb className="w-3 h-3 text-yellow-500" />
                                    <p className="text-yellow-600 text-xs">{recommendations.supply}</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="text-sm font-medium mb-1">Decimal <span className="text-red-500">*</span></div>
                            <Input 
                                placeholder="6" 
                                type="number"
                                value={decimals}
                                onChange={(e) => handleInputChange('decimals', e.target.value)}
                                className={validationErrors.decimals ? "border-red-500 focus:border-red-500" : ""}
                            />
                            {validationErrors.decimals && <p className="text-red-500 text-xs mt-1">{validationErrors.decimals}</p>}
                            {recommendations.decimals && (
                                <div className="flex items-center gap-1 mt-1">
                                    <Lightbulb className="w-3 h-3 text-yellow-500" />
                                    <p className="text-yellow-600 text-xs">{recommendations.decimals}</p>
                                </div>
                            )}
                        </div>
                        <div>
                            <Textarea 
                                rows={3} 
                                placeholder="Description goes here"
                                value={description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="mb-6 space-y-2">
                        <div className="text-sm font-semibold mt-3 flex flex-row gap-1">
                            <span>Token Branding</span>
                            <span className='text-red-500'>*</span>
                        </div>
                        <div className="flex gap-4 mb-2 flex-col md:flex-row">
                            <div className='flex flex-col gap-1'>
                                <input
                                    type="file"
                                    ref={avatarInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => e.target.files?.[0] && handleImageUpload('avatar', e.target.files[0])}
                                />
                                <div 
                                    className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 min-h-[160px] cursor-pointer transition-colors relative ${
                                        validationErrors.avatarUrl 
                                            ? 'border-red-500 hover:border-red-600' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                    onClick={() => handleImageClick('avatar')}
                                    onDrop={(e) => handleImageDrop('avatar', e)}
                                    onDragOver={handleDragOver}
                                >
                                    {isUploadingAvatar && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                                            <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center">
                                        {avatarDisplay ? (
                                            <img 
                                                src={avatarDisplay} 
                                                alt="avatar" 
                                                className="w-24 h-24 object-cover rounded-full mb-2"
                                            />
                                        ) : (
                                            <>
                                                <div className="w-12 h-12 flex items-center justify-center mb-2">
                                                    <img src="/icons/add-image.svg" alt="add-image" />
                                                </div>
                                                <div className="text-sm font-medium text-gray-700 mb-1">Token Logo</div>
                                                <div className="text-xs text-gray-500 mb-2">Drop your image here or browse</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {validationErrors.avatarUrl && (
                                    <p className="text-red-500 text-xs mt-1">{validationErrors.avatarUrl}</p>
                                )}
                            </div>
                            <input
                                type="file"
                                ref={bannerInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => e.target.files?.[0] && handleImageUpload('banner', e.target.files[0])}
                            />
                            <div 
                                className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-6 min-h-[160px] cursor-pointer transition-colors relative ${
                                    validationErrors.bannerUrl 
                                        ? 'border-red-500 hover:border-red-600' 
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => handleImageClick('banner')}
                                onDrop={(e) => handleImageDrop('banner', e)}
                                onDragOver={handleDragOver}
                            >
                                {isUploadingBanner && (
                                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-lg">
                                        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
                                    </div>
                                )}
                                <div className="flex flex-col items-center">
                                    {bannerDisplay ? (
                                        <img 
                                            src={bannerDisplay} 
                                            alt="banner" 
                                            className="w-full h-32 object-cover rounded-lg mb-2"
                                        />
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 flex items-center justify-center mb-2">
                                                <img src="/icons/add-image.svg" alt="add-image" />
                                            </div>
                                            <div className="text-sm font-medium text-gray-700 mb-1">Banner image</div>
                                            <div className="text-xs text-gray-500 mb-2">Drop your image here or browse</div>
                                        </>
                                    )}
                                </div>
                            </div>
                            {validationErrors.bannerUrl && (
                                <p className="text-red-500 text-xs mt-1">{validationErrors.bannerUrl}</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
