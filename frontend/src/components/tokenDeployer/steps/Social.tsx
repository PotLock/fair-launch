import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '../../ui/input';
import { useDeployStore } from '../../../stores/deployStores';
import { Socials } from '../../../types';

export const Social = () => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const { socials, updateSocials } = useDeployStore();

    const handleSocialChange = (field: keyof Socials, value: string) => {
        updateSocials({ [field]: value });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full max-w-2xl mx-auto">
            <>
                <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className={`${isExpanded ? 'text-black text-base font-semibold' : 'text-sm text-gray-500'}`}>Socials</div>
                    {isExpanded ? (
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
                                <Input 
                                    className="text-sm" 
                                    placeholder="x.com/" 
                                    value={socials.twitter}
                                    onChange={(e) => handleSocialChange('twitter', e.target.value)}
                                />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Telegram</div>
                                <Input 
                                    className="text-sm" 
                                    placeholder="t.me/" 
                                    value={socials.telegram}
                                    onChange={(e) => handleSocialChange('telegram', e.target.value)}
                                />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Discord</div>
                                <Input 
                                    className="text-sm" 
                                    placeholder="discord.gg/" 
                                    value={socials.discord}
                                    onChange={(e) => handleSocialChange('discord', e.target.value)}
                                />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Farcaster</div>
                                <Input 
                                    className="text-sm" 
                                    placeholder="warpcast.com/" 
                                    value={socials.farcaster}
                                    onChange={(e) => handleSocialChange('farcaster', e.target.value)}
                                />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Website</div>
                                <Input 
                                    className="text-sm" 
                                    placeholder="https://" 
                                    value={socials.website}
                                    onChange={(e) => handleSocialChange('website', e.target.value)}
                                />
                            </div>
                        </div>
                    </>
                )}
            </>
        </div>
    );
};