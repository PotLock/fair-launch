"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Token } from "@/types/api";
import { formatNumberToCurrency, formatTokenPrice } from "@/utils";
import { ChevronDown, Copy, Download, ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { getTokenHolders, getPoolStateByMint, getPoolConfigByMint, Swap } from "@/lib/api";
import { getRpcSOLEndpoint, getSolPrice } from "@/lib/sol";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { Connection, Transaction } from "@solana/web3.js";

interface TradingInterfaceProps {
  token: Token;
  address: string;
}

interface TokenData {
  price: number;
  holders: number;
  marketCap: number;
  targetRaise: number;
  poolAddress: string;
}

export function TradingInterface({ token, address }: TradingInterfaceProps) {
  const { publicKey, sendTransaction } = useWallet()
  const [tokenData, setTokenData] = useState<TokenData>({
    price: 0,
    holders: 0,
    marketCap: 0,
    targetRaise: 0,
    poolAddress: ''
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isBuying, setIsBuying] = useState<boolean>(false);
  const [amountPay, setAmountPay] = useState<string | null>(null);
  const [amountReceive, setAmountReceive] = useState<string | null>(null);
  const [baseReserve, setBaseReserve] = useState<number>(0);
  const [quoteReserve, setQuoteReserve] = useState<number>(0);

  const tokenOptions = [
    { name: 'SOL', icon: '/chains/sol.jpeg' },
    { name: token.symbol, icon: token.metadata.tokenUri }
  ];

  const fetchTokenData = useCallback(async () => {
    const solPrice = await getSolPrice();
    if(!solPrice) return;
    try {
      setLoading(true);
      
      const [holders, pool, poolConfig] = await Promise.all([
        getTokenHolders(address),
        getPoolStateByMint(address),
        getPoolConfigByMint(address)
      ]);

      // Helper function to convert hex to number
      const hexToNumber = (hex: string) => (!hex || hex === "00" ? 0 : parseInt(hex, 16));

      // Convert hex values to numbers
      const quote = hexToNumber(pool?.account?.quoteReserve) / Math.pow(10, 9);
      const base = hexToNumber(pool?.account?.baseReserve) / Math.pow(10, 9);
      setBaseReserve(base);
      setQuoteReserve(quote);

      const preMigrationTokenSupply = hexToNumber(poolConfig?.preMigrationTokenSupply) / Math.pow(10, token.decimals);

      // Calculate price: quote / base (in SOL)
      const price = base > 0 ? quote / base : 0;
      
      // Calculate total supply: preMigrationTokenSupply + baseReserve
      const totalSupply = preMigrationTokenSupply + base;
      
      // Calculate circulating supply: totalSupply - base (tokens NOT in pool)
      const circulating = totalSupply - base;
      
      // Calculate market cap: price * circulating
      const marketCap = price * circulating;

      // Calculate target raise
      const migrationQuoteThreshold = hexToNumber(poolConfig?.migrationQuoteThreshold);
      const targetRaise = (migrationQuoteThreshold / Math.pow(10, 9)) * solPrice;

      setTokenData({
        price: price * solPrice, // Convert to USD
        holders: holders.length,
        marketCap: marketCap * solPrice, // Convert to USD
        targetRaise,
        poolAddress: pool.publicKey
      });
    } catch (error) {
      console.error('Error fetching token data:', error);
      // Keep default values on error
    } finally {
      setLoading(false);
    }
  }, [address, token.totalSupply, token.decimals]);
  
  useEffect(() => {
    fetchTokenData();
  }, [fetchTokenData]);

  const handleAmountPayChange = (value: string) => {
    setAmountPay(value);
    const amountPayNum = parseFloat(value);

    if (!baseReserve || !quoteReserve || !amountPayNum || amountPayNum <= 0) {
      setAmountReceive("0.00");
      return;
    }
    // Constant product formula
    const k = baseReserve * quoteReserve;
    const newQuote = quoteReserve + amountPayNum;
    const newBase = k / newQuote;
    const deltaBase = baseReserve - newBase;

    setAmountReceive(deltaBase.toFixed(6));
  };


  const handleBuy = async () => {
    if(!publicKey){
      toast.error('Please connect your wallet to buy tokens');
      return;
    };
    if(!amountPay){
      toast.error('Please enter an amount to buy');
      return;
    };
    setIsBuying(true);
    try{
      const connection = new Connection(getRpcSOLEndpoint());
      const amountInLamports = parseFloat(amountPay);
      
      const swapParams = {
        baseMint: address, // Token mint address
        signer: publicKey.toString(), // User's wallet address
        amount: amountInLamports, // Amount in lamports
        slippageBps: 50, // 0.5% slippage tolerance (50 basis points)
        swapBaseForQuote: false, // false means buying tokens with SOL (quote for base)
        computeUnitPriceMicroLamports: 100000, // Optional: compute unit price (100k micro-lamports)
      };

      const result = await Swap(swapParams);
      
      const serializedDeployTx = result.data.transaction;
      const swapTxBuffer = Buffer.from(serializedDeployTx, "base64");
      const swapTransaction = Transaction.from(swapTxBuffer);
      const signatureDeployToken = await sendTransaction(
        swapTransaction,
        connection,
        {
          skipPreflight: false,
          preflightCommitment: 'processed'
        }
      );

      await connection.confirmTransaction(signatureDeployToken, 'confirmed');

      if (result.success) {
        toast.success(`Successfully bought ${token.symbol}! ${amountReceive} ${token.symbol}`);
        console.log('Swap Transaction Signature:', signatureDeployToken);
        // Refresh token data after successful swap
        await fetchTokenData();
        // Clear input fields
        setAmountPay(null);
        setAmountReceive(null);
      } else {
        toast.error('Swap failed. Please try again.');
      }
    }catch(error){
      console.error('Error buying token:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to execute swap. Please try again.');
    }finally{
      setIsBuying(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg relative block bg-[#F9FAFB] max-h-[850px]">
      <div className="flex flex-col gap-3 p-4 rounded-t-lg rounded-b-none">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-700"></div>
          <span className="font-medium text-blue-700">LIVE TRADING</span>
        </div>
        <div className="flex flex-col">
            <div className="text-3xl font-bold text-blue-600">
              {loading ? '...' : `$${formatNumberToCurrency(tokenData.marketCap)}`}
            </div>
            <div className="text-xs text-gray-500">Market Cap</div>
        </div>

        <div className="flex items-center gap-10 w-full">
            <div>
                <div className="text-lg font-semibold">
                  {loading ? '...' : `$${formatTokenPrice(tokenData.price)}`}
                </div>
                <div className="text-sm text-gray-500">Current Price</div>
            </div>
            <div>
                <div className="text-lg font-semibold">
                  {loading ? '...' : tokenData.holders}
                </div>
                <div className="text-sm text-gray-500">Holders</div>
            </div>
            <div>
                <div className="text-lg font-semibold">
                  {loading ? '...' : `$${formatNumberToCurrency(tokenData.targetRaise)}`}
                </div>
                <div className="text-sm text-gray-500">Target Raise</div>
            </div>
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
                    value={amountPay || '0.00'}
                    onChange={(e) => handleAmountPayChange(e.target.value)}
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
                    value={amountReceive || '0.00'}
                    className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none" 
                    placeholder="0.00"
                    disabled
                  />
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 border border-gray-200 bg-white">
                    <div className="h-6 w-6">
                      <img src={token.metadata.tokenUri} alt={token.name} className="w-6 h-6 rounded-full" />
                    </div>
                    <span className="text-lg">{token.symbol}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-1">-</div>
              </div>

              <Button
                onClick={handleBuy}
                disabled={isBuying || !publicKey || !amountPay}
                className={`w-full ${publicKey && !isBuying ? "bg-red-500 hover:bg-red-600 cursor-pointer": "bg-red-300 hover:bg-red-200 cursor-not-allowed"} text-white font-medium py-6 rounded-lg mb-4`}
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
              window.open(`https://devnet.meteora.ag/dlmm/${tokenData.poolAddress}`,"_blank")
            )} 
          >
            <div 
              className="flex items-center gap-2"
            >
              <div className="relative w-9 h-9">
                <img src="/logos/meteora.png" alt="Meteora" className="w-9 h-9 rounded-full" />
                <div className="absolute -bottom-1 right-0 w-4 h-4 rounded-sm  bg-black flex items-center justify-center">
                  <img src="/logos/solana_light.svg" alt="Solana" className="w-3 h-3" />
                </div>
              </div>
              <span>Trade on Meteora</span>
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
