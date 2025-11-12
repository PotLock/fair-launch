"use client";

import { useState } from "react";
import { SocialButtons } from "./SocialButtons";
import type { Token } from "@/types/api";
import Link from "next/link";

interface TokenHeaderProps {
    token: Token;
    address: string;
}

export function TokenHeader({ token, address }: TokenHeaderProps) {
    const [copied, setCopied] = useState(false);

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative">
            <div className="relative">
                <img src={token.metadata.bannerUri} alt={token.name} className="w-full h-64 object-cover rounded-lg" />
                <div className="absolute left-0 bottom-0 w-full h-64 rounded-b-lg pointer-events-none"
                    style={{background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 100%)'}} />
            </div>
            <div className="absolute left-4 bottom-5 md:left-5 md:bottom-10 flex md:items-end justify-between gap-5 md:gap-3 flex-col md:flex-row w-full">
                <div className="flex items-center gap-3">
                    <img src={token.metadata.tokenUri} alt={token.name} className="w-20 h-20 rounded-xl border object-cover border-gray-100 shadow-md bg-white" />
                    <div className="flex flex-col">
                        <span className="text-3xl font-bold text-white uppercase">{token.name}</span>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-lg text-white">${token.symbol}</span>
                        </div>
                        {/* <div className="flex items-center gap-2 mt-1">
                            <Link href={`https://solscan.io/token/${address}`} target="_blank">
                                <span className="text-sm text-gray-300 font-mono hover:underline hover:text-white">
                                    {address.slice(0, 6)}...{address.slice(-6)}
                                </span>
                            </Link>
                            <button 
                                onClick={handleCopyAddress}
                                className="text-gray-300 hover:text-white transition-colors p-1 hover:bg-white/10 rounded relative cursor-pointer"
                                title={copied ? "Copied!" : "Copy contract address"}
                            >
                                {copied ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                                    </svg>
                                )}
                            </button>
                        </div> */}
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

