"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Token, TransactionAction, TransactionStatus, TransactionChain } from "@/types/api";
import { formatNumberToCurrency, formatTokenPrice } from "@/utils";
import { ChevronDown, Copy, Download, ExternalLink, Wallet } from "lucide-react";
import { useCallback, useEffect, useMemo, useReducer, useTransition, useDeferredValue, memo } from "react";
import { getTokenHolders, getPoolStateByMint, getPoolConfigByMint, Swap } from "@/lib/api";
import { getRpcSOLEndpoint, getSolPrice, getSolBalance, getTokenBalanceOnSOL } from "@/lib/sol";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { Connection, Transaction } from "@solana/web3.js";
import { createTransaction, updateTransactionStatus } from "@/lib/api";
import { SOL_NETWORK } from "@/configs/env.config";

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
  migrationProgress: number;
}

interface UserBalances {
  sol: number;
  token: number;
}

interface TradingState {
  tokenData: TokenData;
  userBalances: UserBalances;
  loading: boolean;
  loadingBalances: boolean;
  isBuying: boolean;
  amountPay: string;
  amountReceive: string;
  baseReserve: number;
  quoteReserve: number;
  payIsSol: boolean;
}

type TradingAction =
  | { type: 'SET_TOKEN_DATA'; payload: TokenData }
  | { type: 'SET_USER_BALANCES'; payload: UserBalances }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LOADING_BALANCES'; payload: boolean }
  | { type: 'SET_IS_BUYING'; payload: boolean }
  | { type: 'SET_AMOUNT_PAY'; payload: string }
  | { type: 'SET_AMOUNT_RECEIVE'; payload: string }
  | { type: 'SET_RESERVES'; payload: { base: number; quote: number } }
  | { type: 'SET_PAY_IS_SOL'; payload: boolean }
  | { type: 'RESET_AMOUNTS' }
  | { type: 'SWITCH_TOKEN'; payload: boolean };

const tradingReducer = (state: TradingState, action: TradingAction): TradingState => {
  switch (action.type) {
    case 'SET_TOKEN_DATA':
      return { ...state, tokenData: action.payload, loading: false };
    case 'SET_USER_BALANCES':
      return { ...state, userBalances: action.payload, loadingBalances: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_LOADING_BALANCES':
      return { ...state, loadingBalances: action.payload };
    case 'SET_IS_BUYING':
      return { ...state, isBuying: action.payload };
    case 'SET_AMOUNT_PAY':
      return { ...state, amountPay: action.payload };
    case 'SET_AMOUNT_RECEIVE':
      return { ...state, amountReceive: action.payload };
    case 'SET_RESERVES':
      return { ...state, baseReserve: action.payload.base, quoteReserve: action.payload.quote };
    case 'SET_PAY_IS_SOL':
      return { ...state, payIsSol: action.payload };
    case 'RESET_AMOUNTS':
      return { ...state, amountPay: '', amountReceive: '' };
    case 'SWITCH_TOKEN':
      return { ...state, payIsSol: action.payload, amountPay: '', amountReceive: '' };
    default:
      return state;
  }
};

const GAS_RESERVE = 0.001; // Reserve SOL for gas fees
const SLIPPAGE_BPS = 50;
const COMPUTE_UNIT_PRICE = 100000;
const MAX_FRACTION_DIGITS = 6;
const LAMPORTS_PER_SOL = 1_000_000_000;

// Migration Progress Enum
enum MigrationProgress {
  PreBondingCurve = 0,
  PostBondingCurve = 1,
  LockedVesting = 2,
  CreatedPool = 3
}

// Get user-friendly phase information
const getPhaseInfo = (migrationProgress: number) => {
  switch (migrationProgress) {
    case MigrationProgress.PreBondingCurve:
      return {
        label: 'BONDING CURVE',
        color: 'orange',
        description: 'Initial fundraising phase'
      };
    case MigrationProgress.PostBondingCurve:
      return {
        label: 'FUNDRAISING COMPLETE',
        color: 'green',
        description: 'Preparing for migration'
      };
    case MigrationProgress.LockedVesting:
      return {
        label: 'VESTING PERIOD',
        color: 'purple',
        description: 'Locked vesting in progress'
      };
    case MigrationProgress.CreatedPool:
      return {
        label: 'LIVE TRADING',
        color: 'emerald',
        description: 'Pool created and migrated'
      };
    default:
      return {
        label: 'UNKNOWN',
        color: 'gray',
        description: 'Status unknown'
      };
  }
};

const hexToNumber = (hex: string): number => {
  return !hex || hex === "00" ? 0 : parseInt(hex, 16);
};

const formatBalance = (balance: number, decimals: number = 4): string => {
  return balance.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

function TradingInterfaceComponent({ token, address }: TradingInterfaceProps) {
  const { publicKey, sendTransaction } = useWallet()

  const [state, dispatch] = useReducer(tradingReducer, {
    tokenData: {
      price: 0,
      holders: 0,
      marketCap: 0,
      targetRaise: 0,
      poolAddress: '',
      migrationProgress: 0
    },
    userBalances: {
      sol: 0,
      token: 0
    },
    loading: true,
    loadingBalances: false,
    isBuying: false,
    amountPay: '',
    amountReceive: '',
    baseReserve: 0,
    quoteReserve: 0,
    payIsSol: true
  });

  const [isPending, startTransition] = useTransition();

  const deferredAmountPay = useDeferredValue(state.amountPay);

  const tokenOptions = [
    { name: 'SOL', icon: '/chains/sol.jpeg' },
    { name: token.symbol, icon: token.metadata.tokenUri }
  ];

  const fetchUserBalances = useCallback(async () => {
    if (!publicKey) {
      dispatch({ type: 'SET_USER_BALANCES', payload: { sol: 0, token: 0 } });
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING_BALANCES', payload: true });

      const [solBalance, tokenBalance] = await Promise.all([
        getSolBalance(publicKey.toString()),
        getTokenBalanceOnSOL(address, publicKey.toString())
      ]);

      startTransition(() => {
        dispatch({
          type: 'SET_USER_BALANCES',
          payload: { sol: solBalance, token: tokenBalance }
        });
      });
    } catch (error) {
      console.error('Error fetching user balances:', error);
      dispatch({ type: 'SET_USER_BALANCES', payload: { sol: 0, token: 0 } });
    }
  }, [publicKey, address]);

  const fetchTokenData = useCallback(async () => {
    const solPrice = await getSolPrice();
    if(!solPrice) return;

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const [holders, pool, poolConfig] = await Promise.all([
        getTokenHolders(address),
        getPoolStateByMint(address),
        getPoolConfigByMint(address)
      ]);

      const quote = hexToNumber(pool?.account?.quoteReserve) / LAMPORTS_PER_SOL;
      const base = hexToNumber(pool?.account?.baseReserve) / Math.pow(10, token.decimals);

      const preMigrationTokenSupply = hexToNumber(poolConfig?.preMigrationTokenSupply) / Math.pow(10, token.decimals);

      const price = base > 0 ? quote / base : 0;

      const totalSupply = preMigrationTokenSupply + base;

      const circulating = totalSupply - base;

      const marketCap = price * circulating;

      const migrationQuoteThreshold = hexToNumber(poolConfig?.migrationQuoteThreshold);
      const targetRaise = (migrationQuoteThreshold / LAMPORTS_PER_SOL) * solPrice;

      dispatch({ type: 'SET_RESERVES', payload: { base, quote } });

      startTransition(() => {
        dispatch({
          type: 'SET_TOKEN_DATA',
          payload: {
            price: price * solPrice,
            holders: holders.length,
            marketCap: marketCap * solPrice,
            targetRaise,
            poolAddress: pool.publicKey,
            migrationProgress: pool?.account?.migrationProgress ?? 0
          }
        });
      });
    } catch (error) {
      console.error('Error fetching token data:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [address, token.totalSupply, token.decimals]);
  
  // Effects
  useEffect(() => {
    fetchTokenData();
  }, [fetchTokenData]);

  useEffect(() => {
    fetchUserBalances();
  }, [fetchUserBalances]);

  const hasInsufficientBalance = useMemo(() => {
    if (!deferredAmountPay || deferredAmountPay.trim() === '') return false;

    const amountPayNum = parseFloat(deferredAmountPay.replace(/,/g, ''));
    if (isNaN(amountPayNum) || amountPayNum <= 0) return false;

    if (state.payIsSol) {
      return amountPayNum > (state.userBalances.sol - GAS_RESERVE);
    } else {
      return amountPayNum > state.userBalances.token;
    }
  }, [deferredAmountPay, state.payIsSol, state.userBalances]);

  const currentBalance = useMemo(() => {
    return state.payIsSol ? state.userBalances.sol : state.userBalances.token;
  }, [state.payIsSol, state.userBalances]);

  const handleAmountPayChange = useCallback((value: string) => {
    dispatch({ type: 'SET_AMOUNT_PAY', payload: value });

    if (value.trim() === '') {
      dispatch({ type: 'SET_AMOUNT_RECEIVE', payload: '' });
      return;
    }

    const amountPayNum = parseFloat(value);

    if (!state.baseReserve || !state.quoteReserve || isNaN(amountPayNum) || amountPayNum <= 0) {
      dispatch({ type: 'SET_AMOUNT_RECEIVE', payload: '' });
      return;
    }

    const k = state.baseReserve * state.quoteReserve;
    if (state.payIsSol) {
      const newQuote = state.quoteReserve + amountPayNum;
      const newBase = k / newQuote;
      const deltaBase = state.baseReserve - newBase;
      dispatch({ type: 'SET_AMOUNT_RECEIVE', payload: deltaBase.toFixed(4) });
    } else {
      const newBase = state.baseReserve + amountPayNum;
      const newQuote = k / newBase;
      const deltaQuote = state.quoteReserve - newQuote;
      dispatch({ type: 'SET_AMOUNT_RECEIVE', payload: deltaQuote.toFixed(4) });
    }
  }, [state.baseReserve, state.quoteReserve, state.payIsSol]);


  const handleBuyAndSell = useCallback(async () => {
    // Validation checks
    if (!publicKey) {
      toast.error("Please connect your wallet");
      return;
    }

    if (!state.amountPay || state.amountPay.trim() === '') {
      toast.error(`Please enter an amount to ${state.payIsSol ? 'buy' : 'sell'}`);
      return;
    }

    if (hasInsufficientBalance) {
      const assetName = state.payIsSol ? 'SOL' : token.symbol;
      toast.error(`Insufficient ${assetName} balance. You have ${formatBalance(currentBalance)} ${assetName}`);
      return;
    }

    const actionText = state.payIsSol ? "Buying" : "Selling";
    const toastId = toast.loading(`${actionText} ${token.symbol}...`);
    dispatch({ type: 'SET_IS_BUYING', payload: true });
    let createdTransactionId: string | null = null;

    try {
      const connection = new Connection(getRpcSOLEndpoint());
      const amountNum = parseFloat(state.amountPay.replace(/,/g, ''));

      const swapParams = {
        baseMint: address,
        signer: publicKey.toString(),
        amount: amountNum,
        slippageBps: SLIPPAGE_BPS,
        swapBaseForQuote: !state.payIsSol,
        computeUnitPriceMicroLamports: COMPUTE_UNIT_PRICE,
      };

      const result = await Swap(swapParams);

      if (result.success) {
        const serializedDeployTx = result.data.transaction;
        const swapTxBuffer = Buffer.from(serializedDeployTx, "base64");
        const swapTransaction = Transaction.from(swapTxBuffer);
        const signatureSwap = await sendTransaction(swapTransaction, connection, {
          skipPreflight: false,
          preflightCommitment: "processed",
        });

        try {
          const action: TransactionAction = state.payIsSol ? TransactionAction.BUY : TransactionAction.SELL;
          const baseToken = state.payIsSol ? "So11111111111111111111111111111111111111112" : address;
          const quoteToken = state.payIsSol ? address : "So11111111111111111111111111111111111111112";
          const amountIn = amountNum;
          const amountOutNum = state.amountReceive && state.amountReceive.trim() !== '' ? parseFloat(`${state.amountReceive}`) : 0;
          const pricePerToken = amountOutNum > 0 ? amountIn / amountOutNum : 0;

          const created = await createTransaction({
            userAddress: publicKey.toString(),
            txHash: signatureSwap,
            action,
            baseToken,
            quoteToken,
            amountIn,
            amountOut: amountOutNum,
            pricePerToken,
            slippageBps: SLIPPAGE_BPS,
            fee: 0,
            feeToken: "SOL",
            status: TransactionStatus.PENDING,
            chain: TransactionChain.SOLANA,
            poolAddress: address,
          });
          createdTransactionId = created.id;
        } catch (e) {
          console.error("Error creating transaction record:", e);
        }

        await connection.confirmTransaction(signatureSwap, "confirmed");

        if (createdTransactionId) {
          try {
            await updateTransactionStatus(createdTransactionId, TransactionStatus.SUCCESS, signatureSwap);
          } catch (e) {
            console.error("Error updating transaction status to success:", e);
          }
        }

        toast.dismiss(toastId);
        const receiveSymbol = state.payIsSol ? token.symbol : "SOL";
        toast.success(`Successfully ${state.payIsSol ? "bought" : "sold"} ${token.symbol}! Received ${state.amountReceive} ${receiveSymbol}`);
        console.log("Swap Transaction Signature:", signatureSwap);

        await Promise.all([fetchTokenData(), fetchUserBalances()]);
        dispatch({ type: 'RESET_AMOUNTS' });
      } else {
        toast.error("Swap failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during swap:", error);
      try {
        if (createdTransactionId) {
          await updateTransactionStatus(createdTransactionId, TransactionStatus.FAILED);
        }
      } catch (e) {
        console.error("Error updating transaction status to failed:", e);
      }
      toast.dismiss(toastId);
      toast.error(error instanceof Error ? error.message : "Failed to execute swap. Please try again.");
    } finally {
      dispatch({ type: 'SET_IS_BUYING', payload: false });
    }
  }, [publicKey, sendTransaction, address, state, hasInsufficientBalance, currentBalance, token, fetchTokenData, fetchUserBalances]);


  const phaseInfo = getPhaseInfo(state.tokenData.migrationProgress);

  // Get appropriate Tailwind classes based on phase color
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { dot: string; text: string }> = {
      orange: { dot: 'bg-orange-600', text: 'text-orange-600' },
      blue: { dot: 'bg-blue-700', text: 'text-blue-700' },
      green: { dot: 'bg-green-600', text: 'text-green-600' },
      purple: { dot: 'bg-purple-600', text: 'text-purple-600' },
      emerald: { dot: 'bg-emerald-600', text: 'text-emerald-600' },
      gray: { dot: 'bg-gray-600', text: 'text-gray-600' }
    };
    return colorMap[color] || colorMap.gray;
  };

  const colorClasses = getColorClasses(phaseInfo.color);

  return (
    <div className="border border-gray-200 rounded-lg relative block bg-[#F9FAFB] md:max-h-[950px]">
      <div className="flex flex-col gap-3 p-3 md:p-4 rounded-t-lg rounded-b-none">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2.5 h-2.5 rounded-full ${colorClasses.dot} animate-pulse`}></div>
          <span className={`font-medium ${colorClasses.text}`}>{phaseInfo.label}</span>
        </div>
        <div className="flex flex-col">
            <div className="text-3xl font-bold text-blue-600">
              {state.loading || isPending ? '...' : `$${formatNumberToCurrency(state.tokenData.marketCap)}`}
            </div>
            <div className="text-xs text-gray-500">Market Cap</div>
        </div>

        <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-10 w-full">
            <div>
                <div className="text-lg font-semibold">
                  {state.loading || isPending ? '...' : `$${formatTokenPrice(state.tokenData.price)}`}
                </div>
                <div className="text-sm text-gray-500">Current Price</div>
            </div>
            <div>
                <div className="text-lg font-semibold">
                  {state.loading || isPending ? '...' : state.tokenData.holders}
                </div>
                <div className="text-sm text-gray-500">Holders</div>
            </div>
            <div className="col-span-2 md:col-span-1">
                <div className="text-lg font-semibold">
                  {state.loading || isPending ? '...' : `$${formatNumberToCurrency(state.tokenData.targetRaise)}`}
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
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-500">You Pay</div>
                  {publicKey && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Wallet className="w-3 h-3" />
                      <span>
                        {state.loadingBalances ? '...' : `${formatBalance(currentBalance)} ${state.payIsSol ? 'SOL' : token.symbol}`}
                      </span>
                      <button
                        onClick={() => {
                          const maxAmount = state.payIsSol
                            ? Math.max(0, currentBalance - GAS_RESERVE)
                            : currentBalance;
                          if (maxAmount > 0) {
                            handleAmountPayChange(maxAmount.toString());
                          }
                        }}
                        className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-xs font-medium hover:bg-blue-200 transition-colors"
                      >
                        MAX
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={state.amountPay}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (/^\d*\.?\d*$/.test(raw)) {
                        handleAmountPayChange(raw);
                      }
                    }}
                    onBlur={() => {
                      if (state.amountPay) {
                        const formatted = parseFloat(state.amountPay).toLocaleString('en-US', {
                          maximumFractionDigits: MAX_FRACTION_DIGITS,
                        });
                        dispatch({ type: 'SET_AMOUNT_PAY', payload: formatted });
                      }
                    }}
                    inputMode="decimal"
                    className={`w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none ${
                      hasInsufficientBalance ? 'text-red-500' : ''
                    }`}
                    placeholder="0.00"
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-pointer">
                        <div className="w-6 h-6">
                          <img src={state.payIsSol ? "/logos/solana_light.svg" : process.env.NEXT_PUBLIC_IPFS_URL + token.metadata.tokenUri} alt={state.payIsSol ? "Solana" : token.symbol} className="w-full h-full rounded-full" />
                        </div>
                        <span>{state.payIsSol ? 'SOL' : token.symbol}</span>
                        <div className="relative w-4 h-4">
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        </div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      {tokenOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.name}
                          className="cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            dispatch({ type: 'SWITCH_TOKEN', payload: option.name === 'SOL' });
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <img src={option.name !== 'SOL' ? process.env.NEXT_PUBLIC_IPFS_URL + option.icon : '/logos/solana_light.svg'} alt={option.name} className="w-5 h-5 rounded-full" />
                            <span>{option.name}</span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {hasInsufficientBalance && (
                  <div className="text-xs text-red-500 mt-1">
                    Insufficient balance. You need {formatBalance(
                      Math.abs(currentBalance - parseFloat(state.amountPay.replace(/,/g, '') || '0') - (state.payIsSol ? GAS_RESERVE : 0))
                    )} more {state.payIsSol ? 'SOL' : token.symbol}
                  </div>
                )}
                {!hasInsufficientBalance && (
                  <div className="text-sm text-gray-500 mt-1">-</div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-500 mb-2">You Receive</div>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={state.amountReceive || ''}
                    className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none"
                    placeholder="0.00"
                    disabled
                  />
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 border border-gray-200 bg-white">
                    <div className="h-6 w-6">
                      <img src={state.payIsSol ? process.env.NEXT_PUBLIC_IPFS_URL + token.metadata.tokenUri : "/logos/solana_light.svg"} alt={state.payIsSol ? token.name : 'Solana'} className="w-6 h-6 rounded-full" />
                    </div>
                    <span className="text-lg">{state.payIsSol ? token.symbol : 'SOL'}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mt-1">-</div>
              </div>

              <Button
                onClick={handleBuyAndSell}
                disabled={state.isBuying || !publicKey || !state.amountPay || state.amountPay.trim() === '' || hasInsufficientBalance}
                className={`w-full ${
                  publicKey && !state.isBuying && !hasInsufficientBalance
                    ? "bg-red-500 hover:bg-red-600 cursor-pointer"
                    : "bg-red-300 hover:bg-red-200 cursor-not-allowed"
                } text-white font-medium py-6 rounded-lg mb-4`}
              >
                {!publicKey
                  ? 'Connect Wallet'
                  : hasInsufficientBalance
                    ? 'Insufficient Balance'
                    : state.payIsSol
                      ? `Buy ${token.symbol || 'POTLAUNCH'}`
                      : `Sell ${token.symbol || 'POTLAUNCH'}`
                }
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
                <div className="h-px w-full bg-gray-300 mt-2 mb-2"/>
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

      <div className="p-3 md:p-4 flex flex-col gap-2">
        <h1 className="text-lg font-bold">Trade on DEX</h1>
        
        {SOL_NETWORK !== 'mainnet' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
            <p className="text-sm text-amber-800">
              DEX trading is only available on mainnet. You're currently on {SOL_NETWORK}.
            </p>
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          <div
            className={`border border-gray-200 bg-white p-3 rounded-lg flex items-center justify-between ${
              SOL_NETWORK === 'mainnet' ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
            }`}
            onClick={() => {
              if (SOL_NETWORK === 'mainnet' && state.tokenData.poolAddress) {
                window.open(`https://app.meteora.ag/dlmm/${state.tokenData.poolAddress}`, "_blank");
              }
            }}
          >
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9">
                <img src="/logos/meteora.png" alt="Meteora" className="w-9 h-9 rounded-full" />
                <div className="absolute -bottom-1 right-0 w-4 h-4 rounded-sm bg-black flex items-center justify-center">
                  <img src="/logos/solana_light.svg" alt="Solana" className="w-3 h-3" />
                </div>
              </div>
              <span>Trade on Meteora</span>
              {SOL_NETWORK !== 'mainnet' && (
                <span className="text-xs text-gray-500">(Mainnet only)</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={`border border-gray-200 bg-white p-3 rounded-lg flex items-center justify-between transition-colors ${
                SOL_NETWORK === 'mainnet' ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
              }`}>
                <div className="flex items-center gap-2">
                  <span>Trade on other DEX</span>
                  {SOL_NETWORK !== 'mainnet' && (
                    <span className="text-xs text-gray-500">(Mainnet only)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-5 h-5" />
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white" align="start">
              <DropdownMenuGroup>
                <DropdownMenuItem 
                  className="flex items-center justify-between gap-3 p-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (SOL_NETWORK === 'mainnet') {
                      window.open(`https://jup.ag/swap/SOL-${address}`, "_blank");
                    }
                  }}
                  disabled={SOL_NETWORK !== 'mainnet'}
                >
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
                <DropdownMenuItem 
                  className="flex justify-between items-center gap-3 p-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (SOL_NETWORK === 'mainnet' && state.tokenData.poolAddress) {
                      window.open(`https://app.meteora.ag/dlmm/${state.tokenData.poolAddress}`, "_blank");
                    }
                  }}
                  disabled={SOL_NETWORK !== 'mainnet'}
                >
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
                <DropdownMenuItem 
                  className="flex justify-between items-center gap-3 p-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (SOL_NETWORK === 'mainnet') {
                      window.open(`https://axiom.trade/?inputMint=So11111111111111111111111111111111111111112&outputMint=${address}`, "_blank");
                    }
                  }}
                  disabled={SOL_NETWORK !== 'mainnet'}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                      <img src="/logos/axiom.svg" alt="Axiom" className="w-8 h-8 rounded-full" />
                      <div className="absolute -bottom-1 right-0 w-3 h-3 rounded-sm bg-black flex items-center justify-center">
                        <img src="/logos/solana_light.svg" alt="Solana" className="w-2 h-2" />
                      </div>
                    </div>
                    <span>Axiom</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex justify-between items-center gap-3 p-3 cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    if (SOL_NETWORK === 'mainnet') {
                      window.open(`https://photon-sol.tinyastro.io/en/lp/${address}`, "_blank");
                    }
                  }}
                  disabled={SOL_NETWORK !== 'mainnet'}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                      <img src="/logos/photon.svg" alt="Photon" className="w-8 h-8 rounded-full" />
                      <div className="absolute -bottom-1 right-0 w-3 h-3 rounded-sm bg-black flex items-center justify-center">
                        <img src="/logos/solana_light.svg" alt="Solana" className="w-2 h-2" />
                      </div>
                    </div>
                    <span>Photon</span>
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

export const TradingInterface = memo(TradingInterfaceComponent);
