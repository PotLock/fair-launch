"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Globe } from "lucide-react";

interface SocialButtonsProps {
  website?: string | null;
  twitter?: string | null;
  telegram?: string | null;
}

export function SocialButtons({ website, twitter, telegram }: SocialButtonsProps) {
  const getSocialUrl = (type: string, value?: string | null) => {
    if (!value) return null;
    switch (type) {
      case 'website':
        return value.startsWith('http') ? value : `https://${value}`;
      case 'twitter':
        return value.startsWith('http') ? value : `https://x.com/${value}`;
      case 'telegram':
        return value.startsWith('http') ? value : `https://t.me/${value}`;
      default:
        return value;
    }
  };

  const hasSocialLinks = !!(website || twitter || telegram);

  if (!hasSocialLinks) return null;

  return (
    <div className="flex items-center md:justify-between gap-6 mr-10 md:mr-14">
      {website && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
              onClick={() => {
                const url = getSocialUrl('website', website);
                if (url) window.open(url, '_blank');
              }}
            >
              <Globe className="w-6 h-6 text-white hover:text-gray-200" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Visit Website</p>
          </TooltipContent>
        </Tooltip>
      )}
      {twitter && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
              onClick={() => {
                const url = getSocialUrl('twitter', twitter);
                if (url) window.open(url, '_blank');
              }}
            >
              <img src="/icons/twitter.svg" alt="Twitter" className="w-6 h-6 text-white hover:text-gray-200" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Follow on Twitter</p>
          </TooltipContent>
        </Tooltip>
      )}
      {telegram && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              className="w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
              onClick={() => {
                const url = getSocialUrl('telegram', telegram);
                if (url) window.open(url, '_blank');
              }}
            >
              <img src="/icons/telegram.svg" alt="Telegram" className="w-6 h-6 text-white hover:text-gray-200" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Join Telegram Channel</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
