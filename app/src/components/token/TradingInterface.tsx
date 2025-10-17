"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Token } from "@/types/api";
import { ChevronDown, Copy, Download, ExternalLink } from "lucide-react";

interface TradingInterfaceProps {
  token: Token;
  address: string;
}

export function TradingInterface({ token, address }: TradingInterfaceProps) {
  const tokenOptions = [
    { name: 'SOL', icon: '/chains/sol.jpeg' },
    { name: token.symbol, icon: token.metadata.tokenUri }
  ];

  return (
    <div className="border border-gray-200 rounded-lg relative block bg-[#F9FAFB]">
      <div className="flex flex-col gap-3 p-4 rounded-t-lg rounded-b-none">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-700"></div>
          <span className="font-medium text-blue-700">LIVE TRADING</span>
        </div>
      </div>

      <div className="border border-gray-200 p-3 rounded-t-2xl bg-white w-full">
        <Tabs className="w-full rounded-lg" defaultValue="trade">
          <TabsList className="w-full">
            <TabsTrigger value="trade" className="w-full rounded-lg flex gap-2 items-center">
              <img src="/icons/trade-up.svg" alt="Trade" className="w-5 h-5" />
              <span>Trade</span>
            </TabsTrigger>
            <TabsTrigger value="deposit" className="w-full rounded-lg flex gap-2 items-center">
              <Download className="w-4 h-4" />
              <span>Deposit</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="trade">
            <div className="relative">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-500 mb-2">You Pay</div>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none"
                    placeholder="0.00"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-pointer">
                        <img src="/logos/solana_light.svg" alt="Solana" className="w-full h-full" />
                        <span>SOL</span>
                        <div className="relative w-4 h-4 mr-5">
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      {tokenOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.name}
                          className="cursor-pointer hover:bg-gray-100"
                        >
                          <div className="flex items-center gap-2">
                            <img src={option.icon} alt={option.name} className="w-5 h-5 rounded-full" />
                            <span>{option.name}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="text-sm text-gray-500 mt-1">-</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-500 mb-2">You Receive</div>
                <div className="flex items-center justify-between">
                  <input 
                    type="text" 
                    className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none" 
                    placeholder="0.00"
                    disabled
                  />
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 border border-gray-200 bg-white">
                    <img src={token.metadata.tokenUri} alt={token.name} className="w-6 h-6 rounded-full" />
                    <span className="text-lg mr-7">{token.symbol}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-1">-</div>
              </div>

              <Button
                className={`w-full bg-red-500 hover:bg-red-600 text-white font-medium py-6 rounded-lg mb-4`}
              >
                Buy ${token.symbol || 'CURATE'}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="deposit">
            <div className="flex flex-col space-y-2 mb-5">
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <label className="text-sm text-gray-500 mb-2">You Pay</label>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none"
                    placeholder="0.00"
                  />
                  <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <img src="/logos/near.svg" alt="NEAR" className="w-5 h-5" />
                    <span className="mr-5">NEAR</span>
                  </button>
                </div>
                <span className="text-sm text-gray-500 mt-1">-</span>
              </div>
              <Card className="shadow-none p-3 py-4 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Use this depsoit address</h3>
                  <p className="text-xs font-extralight text-gray-700">Always double-check your deposit address — it may change without notice.</p>
                </div>
                <div className="h-[1px] w-full bg-gray-300 mt-2 mb-2"/>
                <div className="flex flex-col space-y-5 justify-center items-center">
                  <div className="border border-gray-200 p-1 rounded-lg">
                    <img src="/icons/qrcode.svg" alt="QRcode" className="w-40 h-40"/>
                  </div>
                  <div className="p-1 flex justify-between items-center px-2 w-full bg-neutral-100 rounded-lg">
                    <span className="text-sm">qAHMEAU4..........8jiETcaSL5u5sAnZN</span>
                    <Button className="bg-neutral-100 shadow-none border-none hover:bg-neutral-200 p-1 px-2">
                      <Copy className="w-3 h-3 text-gray-600" />
                    </Button>
                  </div>
                </div>
                <div className="pt-3">
                  <div className="p-3 flex flex-col space-y-1 border border-orange-300 bg-orange-50 rounded-lg">
                    <h3 className="text-sm font-medium text-orange-500">Only deposit NEAR from the Near network</h3>
                    <p className="text-xs font-extralight text-orange-400">Depositing other assets or using a different network will result in loss of funds.</p>
                  </div>
                </div>
              </Card>
              <Card className="shadow-none p-3 space-y-4 w-full">
                <div className="flex justify-between w-full items-center text-xs text-gray-500">
                  <span>Minimum Deposit</span>
                  <span>0.001 SOL</span>
                </div>
                <div className="flex justify-between w-full items-center text-xs text-gray-500">
                  <span>Processing Time</span>
                  <span>~5 mins</span>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-4 flex flex-col gap-2">
        <h1 className="text-lg font-bold">Trade on DEX</h1>
        <div className="flex flex-col gap-2">
          <div 
            className="border border-gray-200 bg-white p-3 hover:bg-gray-50 rounded-lg flex items-center justify-between cursor-pointer"
            onClick={()=>(
              window.open(`https://raydium.io/swap/?inputMint=sol&outputMint=${address}`,"_blank")
            )} 
          >
            <div 
              className="flex items-center gap-2"
            >
              <div className="relative w-9 h-9">
                <img src="/logos/raydium.png" alt="Raydium" className="w-9 h-9 rounded-full" />
                <div className="absolute -bottom-1 right-0 w-4 h-4 rounded-sm  bg-black flex items-center justify-center">
                  <img src="/logos/solana_light.svg" alt="Solana" className="w-3 h-3" />
                </div>
              </div>
              <span>Trade on Raydium</span>
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="border border-gray-200 bg-white p-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <span>Trade on other DEX</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full bg-white">
              <DropdownMenuGroup>
                <DropdownMenuItem className="flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                      <img src="/logos/jupiter.png" alt="Jupiter" className="w-8 h-8 rounded-full" />
                      <div className="absolute -bottom-1 right-0 w-3 h-3 rounded-sm bg-black flex items-center justify-center">
                        <img src="/logos/solana_light.svg" alt="Solana" className="w-2 h-2" />
                      </div>
                    </div>
                    <span>Jupiter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex justify-between items-center gap-3 p-3 cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                      <img src="/logos/meteora.png" alt="Meteora" className="w-8 h-8 rounded-full" />
                      <div className="absolute -bottom-1 right-0 w-3 h-3 rounded-sm bg-black flex items-center justify-center">
                        <img src="/logos/solana_light.svg" alt="Solana" className="w-2 h-2" />
                      </div>
                    </div>
                    <span>Meteora</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
