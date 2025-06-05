import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '../../ui/input';

export const Social = () => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4 w-full max-w-2xl mx-auto">
            <div>
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
                                <Input className="text-sm" placeholder="x.com/" />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Telegram</div>
                                <Input className="text-sm" placeholder="t.me/" />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Discord</div>
                                <Input className="text-sm" placeholder="discord.gg/" />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Farcaster</div>
                                <Input className="text-sm" placeholder="warpcast.com/" />
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-1">Website</div>
                                <Input className="text-sm" placeholder="https://" />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}