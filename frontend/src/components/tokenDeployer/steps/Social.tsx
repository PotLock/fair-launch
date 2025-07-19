import { useState } from 'react';
import { ChevronDown, ChevronUp, CircleCheck } from 'lucide-react';
import { Input } from '../../ui/input';
import { useDeployStore } from '../../../stores/deployStores';
import { Socials } from '../../../types';

export const Social = () => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const { socials, updateSocials, validationErrors, validateSocials } = useDeployStore();

    const handleSocialChange = (field: keyof Socials, value: string) => {
        updateSocials({ [field]: value });
        validateSocials();
    };

    // Check if all required fields are valid
    const isFormValid = () => {
        const hasErrors = Object.keys(validationErrors).some(key => 
            key.includes('twitter') || 
            key.includes('telegram') || 
            key.includes('discord') || 
            key.includes('farcaster') ||
            key.includes('website') ||
            key.includes('socials')
        );
        
        // At least one social media link should be provided
        const hasAtLeastOneSocial = socials.twitter || socials.telegram || socials.discord || socials.farcaster || socials.website;
        
        return !hasErrors && hasAtLeastOneSocial;
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full max-w-2xl mx-auto">
            <>
                <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>Socials</div>
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
                        <div className="text-sm text-gray-500 mb-6 mt-1">Token social media and website</div>
                        <div className="space-y-4">
                            <div>
                                <div className="text-sm font-medium mb-1">X/Twitter</div>
                                <div className="flex items-center">
                                    <div className="bg-gray-100 text-gray-600 px-3 py-[7px] text-sm border border-r-0 border-gray-300 rounded-l-md">
                                        x.com/
                                    </div>
                                    <Input 
                                        className="text-sm rounded-l-none border-l-0" 
                                        placeholder="username" 
                                        value={socials.twitter}
                                        onChange={(e) => handleSocialChange('twitter', e.target.value)}
                                    />
                                </div>
                                {validationErrors.twitter && (
                                    <div className="text-red-500 text-xs mt-1">{validationErrors.twitter}</div>
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Telegram</div>
                                <div className="flex items-center">
                                    <div className="bg-gray-100 text-gray-600 px-3 py-[7px] text-sm border border-r-0 border-gray-300 rounded-l-md">
                                        t.me/
                                    </div>
                                    <Input 
                                        className="text-sm rounded-l-none border-l-0" 
                                        placeholder="username" 
                                        value={socials.telegram}
                                        onChange={(e) => handleSocialChange('telegram', e.target.value)}
                                    />
                                </div>
                                {validationErrors.telegram && (
                                    <div className="text-red-500 text-xs mt-1">{validationErrors.telegram}</div>
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Discord</div>
                                <div className="flex items-center">
                                    <div className="bg-gray-100 text-gray-600 px-3 py-[7px] text-sm border border-r-0 border-gray-300 rounded-l-md">
                                        discord.gg/
                                    </div>
                                    <Input 
                                        className="text-sm rounded-l-none border-l-0" 
                                        placeholder="invite-code" 
                                        value={socials.discord}
                                        onChange={(e) => handleSocialChange('discord', e.target.value)}
                                    />
                                </div>
                                {validationErrors.discord && (
                                    <div className="text-red-500 text-xs mt-1">{validationErrors.discord}</div>
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Farcaster</div>
                                <div className="flex items-center">
                                    <div className="bg-gray-100 text-gray-600 px-3 py-[7px] text-sm border border-r-0 border-gray-300 rounded-l-md">
                                        warpcast.com/
                                    </div>
                                    <Input 
                                        className="text-sm rounded-l-none border-l-0" 
                                        placeholder="username" 
                                        value={socials.farcaster}
                                        onChange={(e) => handleSocialChange('farcaster', e.target.value)}
                                    />
                                </div>
                                {validationErrors.farcaster && (
                                    <div className="text-red-500 text-xs mt-1">{validationErrors.farcaster}</div>
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Website</div>
                                <div className="flex items-center">
                                    <div className="bg-gray-100 text-gray-600 px-3 py-[7px] text-sm border border-r-0 border-gray-300 rounded-l-md">
                                        https://
                                    </div>
                                    <Input 
                                        className="text-sm rounded-l-none border-l-0" 
                                        placeholder="example.com" 
                                        value={socials.website}
                                        onChange={(e) => handleSocialChange('website', e.target.value)}
                                    />
                                </div>
                                {validationErrors.website && (
                                    <div className="text-red-500 text-xs mt-1">{validationErrors.website}</div>
                                )}
                            </div>
                            {validationErrors.socials && (
                                <div className="text-red-500 text-xs mt-1">{validationErrors.socials}</div>
                            )}
                        </div>
                    </>
                )}
            </>
        </div>
    );
};