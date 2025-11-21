"use client";

import { useState } from "react";
import { SocialButtons } from "./SocialButtons";
import type { Token } from "@/types/api";
import Link from "next/link";
import { getIpfsUrl } from "@/lib/utils";

interface TokenHeaderProps {
    token: Token;
    address: string;
}

export function TokenHeader({ token, address }: TokenHeaderProps) {
    return (
        <div className="relative">
            <div className="relative">
                <img src={getIpfsUrl(token.metadata.bannerUri)} alt={token.name} className="w-full h-64 object-cover rounded-lg" />
                <div className="absolute left-0 bottom-0 w-full h-64 rounded-b-lg pointer-events-none"
                    style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)'}} />
            </div>
            <div className="absolute left-4 bottom-5 md:left-5 md:bottom-10 flex md:items-end justify-between gap-5 md:gap-3 flex-col md:flex-row w-full">
                <div className="flex items-center gap-3">
                    <img src={getIpfsUrl(token.metadata.tokenUri)} alt={token.name} className="w-20 h-20 rounded-xl border object-cover border-gray-100 shadow-md bg-white" />
                    <div className="flex flex-col">
                        <span className="text-3xl font-bold text-white uppercase">{token.name}</span>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg text-white">${token.symbol}</span>
                        </div>
                    </div>
                </div>
                <SocialButtons 
                    website={token.metadata.website}
                    twitter={token.metadata.twitter}
                    telegram={token.metadata.telegram}
                />
            </div>
        </div>
    );
}

