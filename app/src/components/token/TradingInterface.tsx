"use client"

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Token, TransactionAction, TransactionStatus, TransactionChain } from "@/types/api";
import { formatNumberToCurrency, formatTokenPrice } from "@/utils";
import { ChevronDown, Copy, Download, ExternalLink, Wallet, Loader2, CheckCircle2, XCircle, Clock, Info } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useReducer, useTransition, useDeferredValue, memo, useRef } from "react";
import { getTokenHolders, getPoolStateByMint, getPoolConfigByMint, Swap } from "@/lib/api";
import { getRpcSOLEndpoint, getSolPrice, getSolBalance, getTokenBalanceOnSOL } from "@/lib/sol";
import { calculateDbcSwapQuote, approximateSwapQuote } from "@/lib/meteora";
import { useWallet } from "@solana/wallet-adapter-react";
import { toast } from "sonner";
import { Connection, Transaction } from "@solana/web3.js";
import { createTransaction, updateTransactionStatus } from "@/lib/api";
import { SOL_NETWORK } from "@/configs/env.config";
import { getIpfsUrl } from "@/lib/utils";
import { useNearIntents } from "@/hooks/useNearIntents";
import { useWalletSelector } from "@near-wallet-selector/react-hook";
import { QRCodeSVG } from "qrcode.react";

// Convert NEAR to yoctoNEAR: 1 NEAR = 10^24 yoctoNEAR
const parseNearAmount = (amount: string): string => {
  if (!amount || parseFloat(amount) <= 0) return "0";
  const amountNum = parseFloat(amount);
  return (amountNum * Math.pow(10, 24)).toFixed(0);
};

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
const TOTAL_FEE_PERCENT = 0.003; // 0.3% total fee (protocol + partner + creator)

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

// Deposit workflow state interface
interface DepositState {
  depositAmount: string;
  depositAddress: string | null;
  depositMemo: string | null;
  purchaseInfo: any | null;
  swapStatus: any | null;
  isGeneratingAddress: boolean;
  isSettling: boolean;
  isLoadingPurchaseInfo: boolean;
}

function TradingInterfaceComponent({ token, address }: TradingInterfaceProps) {
  const { publicKey, sendTransaction } = useWallet()
  const { signedAccountId } = useWalletSelector();
  const nearIntents = useNearIntents();

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

  // Deposit workflow state
  const [depositState, setDepositState] = useState<DepositState>({
    depositAmount: '',
    depositAddress: null,
    depositMemo: null,
    purchaseInfo: null,
    swapStatus: null,
    isGeneratingAddress: false,
    isSettling: false,
    isLoadingPurchaseInfo: false,
  });

  const [isPending, startTransition] = useTransition();
  const statusPollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const deferredAmountPay = useDeferredValue(state.amountPay);
  const quoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (quoteTimeoutRef.current) {
        clearTimeout(quoteTimeoutRef.current);
      }
    };
  }, []);

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

    // Clear any pending quote calculation
    if (quoteTimeoutRef.current) {
      clearTimeout(quoteTimeoutRef.current);
    }

    if (value.trim() === '') {
      dispatch({ type: 'SET_AMOUNT_RECEIVE', payload: '' });
      return;
    }

    const amountPayNum = parseFloat(value);

    if (!state.baseReserve || !state.quoteReserve || isNaN(amountPayNum) || amountPayNum <= 0) {
      dispatch({ type: 'SET_AMOUNT_RECEIVE', payload: '' });
      return;
    }

    // Debounce the API call by 300ms
    quoteTimeoutRef.current = setTimeout(async () => {
      try {
        // Use Meteora SDK for accurate DBC quote calculation
        const connection = new Connection(getRpcSOLEndpoint());
        const outputAmount = await calculateDbcSwapQuote(
          connection,
          state.tokenData.poolAddress,
          amountPayNum,
          !state.payIsSol, // swapBaseForQuote: true when selling tokens (payIsSol=false)
          token.decimals,
          SLIPPAGE_BPS
        );

        dispatch({ type: 'SET_AMOUNT_RECEIVE', payload: outputAmount.toFixed(MAX_FRACTION_DIGITS) });
      } catch (error) {
        console.error('Error calculating DBC quote, using approximation:', error);

        // Fallback to approximation if SDK call fails
        const outputAmount = approximateSwapQuote(
          state.baseReserve,
          state.quoteReserve,
          amountPayNum,
          !state.payIsSol,
          TOTAL_FEE_PERCENT
        );

        dispatch({ type: 'SET_AMOUNT_RECEIVE', payload: outputAmount.toFixed(MAX_FRACTION_DIGITS) });
      }
    }, 300);
  }, [state.baseReserve, state.quoteReserve, state.payIsSol, state.tokenData.poolAddress, token.decimals]);


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

  // ============================================================================
  // DEPOSIT WORKFLOW FUNCTIONS
  // ============================================================================

  // Fetch purchase information when user enters amount
  const fetchPurchaseInfo = useCallback(async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0 || !signedAccountId || !publicKey) {
      setDepositState(prev => ({ ...prev, purchaseInfo: null }));
      return;
    }

    try {
      setDepositState(prev => ({ ...prev, isLoadingPurchaseInfo: true }));
      
      // Convert NEAR amount to yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
      const amountInYoctoNEAR = parseNearAmount(amount) || "0";
      
      const purchaseInfo = await nearIntents.getPurchaseInfo({
        originAsset: "wNEAR",
        destinationAsset: token.symbol,
        amount: amountInYoctoNEAR,
        senderAddress: signedAccountId,
        recipientAddress: publicKey.toString(),
      });

      setDepositState(prev => ({ ...prev, purchaseInfo, isLoadingPurchaseInfo: false }));
    } catch (error) {
      console.error("Error fetching purchase info:", error);
      setDepositState(prev => ({ ...prev, purchaseInfo: null, isLoadingPurchaseInfo: false }));
    }
  }, [signedAccountId, publicKey, token.symbol, nearIntents]);

  // Poll for swap status
  const startStatusPolling = useCallback((depositAddress: string) => {
    // Clear any existing interval
    if (statusPollIntervalRef.current) {
      clearInterval(statusPollIntervalRef.current);
    }

    // Poll every 5 seconds
    statusPollIntervalRef.current = setInterval(async () => {
      try {
        const detailedStatus = await nearIntents.getDetailedSwapStatus(depositAddress);
        setDepositState(prev => ({ ...prev, swapStatus: detailedStatus }));

        // Stop polling if swap is complete
        if (detailedStatus.isComplete) {
          if (statusPollIntervalRef.current) {
            clearInterval(statusPollIntervalRef.current);
            statusPollIntervalRef.current = null;
          }

          if (detailedStatus.isSuccess) {
            toast.success(`Successfully received ${token.symbol} tokens!`);
            await fetchUserBalances();
          } else if (detailedStatus.isFailed) {
            toast.error("Swap failed. Please contact support.");
          }
        }
      } catch (error) {
        console.error("Error polling swap status:", error);
      }
    }, 5000);
  }, [nearIntents, token.symbol, fetchUserBalances]);

  // Generate deposit address
  const handleGenerateDepositAddress = useCallback(async () => {
    if (!depositState.depositAmount || parseFloat(depositState.depositAmount) <= 0) {
      toast.error("Please enter an amount to deposit");
      return;
    }

    if (!signedAccountId) {
      toast.error("Please connect your NEAR wallet");
      return;
    }

    if (!publicKey) {
      toast.error("Please connect your Solana wallet");
      return;
    }

    try {
      setDepositState(prev => ({ ...prev, isGeneratingAddress: true }));
      
      // Convert NEAR amount to yoctoNEAR (1 NEAR = 10^24 yoctoNEAR)
      const amountInYoctoNEAR = parseNearAmount(depositState.depositAmount) || "0";
      
      const { depositAddress, depositMemo, quote } = await nearIntents.generateDepositAddress({
        senderAddress: signedAccountId,
        recipientAddress: publicKey.toString(),
        originAsset: "wNEAR",
        destinationAsset: token.symbol,
        amount: amountInYoctoNEAR,
      });

      setDepositState(prev => ({
        ...prev,
        depositAddress,
        depositMemo: depositMemo || null,
        purchaseInfo: quote || prev.purchaseInfo,
        isGeneratingAddress: false,
      }));

      // Start polling for status
      startStatusPolling(depositAddress);
      
      toast.success("Deposit address generated! Send NEAR to this address.");
    } catch (error) {
      console.error("Error generating deposit address:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate deposit address");
      setDepositState(prev => ({ ...prev, isGeneratingAddress: false }));
    }
  }, [depositState.depositAmount, signedAccountId, publicKey, token.symbol, nearIntents, startStatusPolling]);

  // Settle deposit after user confirms deposit
  const handleSettleDeposit = useCallback(async (txHash?: string) => {
    if (!depositState.depositAddress) {
      toast.error("No deposit address found");
      return;
    }

    try {
      setDepositState(prev => ({ ...prev, isSettling: true }));
      
      const status = await nearIntents.settleDeposit({
        depositAddress: depositState.depositAddress,
        txHash,
        depositMemo: depositState.depositMemo || undefined,
        waitForSettlement: true,
      });

      setDepositState(prev => ({ ...prev, swapStatus: status, isSettling: false }));

      if (status.status === "SUCCESS") {
        toast.success(`Successfully received ${token.symbol} tokens!`);
        // Refresh balances
        await fetchUserBalances();
      } else if (status.status === "FAILED") {
        toast.error("Swap failed. Please contact support.");
      } else if (status.status === "REFUNDED") {
        toast.info("Deposit was refunded. Please try again.");
      }
    } catch (error) {
      console.error("Error settling deposit:", error);
      toast.error(error instanceof Error ? error.message : "Failed to settle deposit");
      setDepositState(prev => ({ ...prev, isSettling: false }));
    }
  }, [depositState.depositAddress, depositState.depositMemo, token.symbol, nearIntents, fetchUserBalances]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (statusPollIntervalRef.current) {
        clearInterval(statusPollIntervalRef.current);
      }
    };
  }, []);

  // Handle deposit amount change
  const handleDepositAmountChange = useCallback((value: string) => {
    const raw = value.replace(/,/g, '');
    if (/^\d*\.?\d*$/.test(raw)) {
      setDepositState(prev => ({ ...prev, depositAmount: raw }));
      // Fetch purchase info when amount changes
      if (raw && parseFloat(raw) > 0) {
        fetchPurchaseInfo(raw);
      } else {
        setDepositState(prev => ({ ...prev, purchaseInfo: null }));
      }
    }
  }, [fetchPurchaseInfo]);

  // Copy deposit address to clipboard
  const handleCopyDepositAddress = useCallback(() => {
    if (depositState.depositAddress) {
      navigator.clipboard.writeText(depositState.depositAddress);
      toast.success("Deposit address copied to clipboard");
    }
  }, [depositState.depositAddress]);

  // Format address for display
  const formatAddress = useCallback((address: string | null) => {
    if (!address) return "";
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  }, []);

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

        <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center gap-4 xl:gap-10 w-full">
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
                          <img src={state.payIsSol ? "/logos/solana_light.svg" : getIpfsUrl(token.metadata.tokenUri)} alt={state.payIsSol ? "Solana" : token.symbol} className="w-full h-full rounded-full" />
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
                            <img src={option.name !== 'SOL' ? getIpfsUrl(option.icon) : '/logos/solana_light.svg'} alt={option.name} className="w-5 h-5 rounded-full" />
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
                    value={state.amountReceive ? parseFloat(state.amountReceive).toLocaleString('en-US', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: MAX_FRACTION_DIGITS,
                    }) : ''}
                    className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none"
                    placeholder="0.00"
                    disabled
                  />
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 border border-gray-200 bg-white">
                    <div className="h-6 w-6">
                      <img src={state.payIsSol ? getIpfsUrl(token.metadata.tokenUri) : "/logos/solana_light.svg"} alt={state.payIsSol ? token.name : 'Solana'} className="w-6 h-6 rounded-full" />
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
                    value={depositState.depositAmount}
                    onChange={(e) => handleDepositAmountChange(e.target.value)}
                    onBlur={() => {
                      if (depositState.depositAmount) {
                        const formatted = parseFloat(depositState.depositAmount).toLocaleString('en-US', {
                          maximumFractionDigits: MAX_FRACTION_DIGITS,
                        });
                        setDepositState(prev => ({ ...prev, depositAmount: formatted }));
                      }
                    }}
                    className="w-full text-3xl font-semibold bg-transparent border-none focus:ring-0 focus:ring-offset-0 focus:border-none focus:outline-none"
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                  <button className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    <img src="/logos/near.svg" alt="NEAR" className="w-5 h-5" />
                    <span className="mr-5">NEAR</span>
                  </button>
                </div>
                {depositState.isLoadingPurchaseInfo ? (
                  <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Loading purchase info...</span>
                  </div>
                ) : depositState.purchaseInfo ? (
                  <div className="text-sm text-gray-500 mt-1">
                    You will receive approximately {formatBalance(parseFloat(depositState.purchaseInfo.expectedOut || "0"), 4)} {token.symbol}
                    {depositState.purchaseInfo.minAmountOut && (
                      <span className="block text-xs text-gray-400 mt-1">
                        Minimum: {formatBalance(parseFloat(depositState.purchaseInfo.minAmountOut || "0"), 4)} {token.symbol}
                      </span>
                    )}
                    {depositState.purchaseInfo.timeEstimate && (
                      <span className="block text-xs text-gray-400 mt-1">
                        Estimated time: {depositState.purchaseInfo.timeEstimate} seconds
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-gray-500 mt-1">-</span>
                )}
              </div>

              {depositState.depositAddress ? (
                <>
                  <Card className="shadow-none p-3 py-4 space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold">Use this deposit address</h3>
                      <p className="text-xs font-extralight text-gray-700">Always double-check your deposit address — it may change without notice.</p>
                    </div>
                    <div className="h-px w-full bg-gray-300 mt-2 mb-2"/>
                    <div className="flex flex-col space-y-5 justify-center items-center">
                      <div className="border border-gray-200 p-1 rounded-lg bg-white">
                        <QRCodeSVG value={depositState.depositAddress} size={160} level="M" />
                      </div>
                      <div className="p-1 flex justify-between items-center px-2 w-full bg-neutral-100 rounded-lg">
                        <span className="text-sm font-mono">{formatAddress(depositState.depositAddress)}</span>
                        <Button 
                          onClick={handleCopyDepositAddress}
                          className="bg-neutral-100 shadow-none border-none hover:bg-neutral-200 p-1 px-2"
                        >
                          <Copy className="w-3 h-3 text-gray-600" />
                        </Button>
                      </div>
                    </div>
                    <div className="pt-3">
                      <div className="p-3 flex flex-col space-y-1 border border-orange-300 bg-orange-50 rounded-lg">
                        <h3 className="text-sm font-medium text-orange-500">Only deposit NEAR from the NEAR network</h3>
                        <p className="text-xs font-extralight text-orange-400">Depositing other assets or using a different network will result in loss of funds.</p>
                      </div>
                    </div>
                  </Card>

                  {/* Swap Status Display */}
                  {depositState.swapStatus && (
                    <Card className="shadow-none p-3 space-y-3 w-full">
                      <div className="flex items-center gap-2 mb-2">
                        {depositState.swapStatus.isComplete ? (
                          depositState.swapStatus.isSuccess ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )
                        ) : (
                          <Clock className="w-5 h-5 text-blue-500 animate-pulse" />
                        )}
                        <h3 className="text-sm font-semibold">
                          {depositState.swapStatus.isComplete
                            ? depositState.swapStatus.isSuccess
                              ? "Swap Completed"
                              : "Swap Failed"
                            : "Processing Swap"}
                        </h3>
                      </div>
                      {depositState.swapStatus.status && (
                        <div className="text-xs text-gray-600">
                          Status: <span className="font-medium">{depositState.swapStatus.status}</span>
                        </div>
                      )}
                      {depositState.swapStatus.swapDetails && (
                        <div className="space-y-1 text-xs text-gray-600">
                          {depositState.swapStatus.swapDetails.amountIn && (
                            <div>Amount In: {depositState.swapStatus.swapDetails.amountIn}</div>
                          )}
                          {depositState.swapStatus.swapDetails.amountOut && (
                            <div>Amount Out: {depositState.swapStatus.swapDetails.amountOut}</div>
                          )}
                        </div>
                      )}
                    </Card>
                  )}

                  <Button
                    onClick={() => handleSettleDeposit()}
                    disabled={depositState.isSettling || depositState.swapStatus?.isComplete}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-6 rounded-lg"
                  >
                    {depositState.isSettling ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                        Settling Deposit...
                      </>
                    ) : depositState.swapStatus?.isComplete ? (
                      depositState.swapStatus.isSuccess ? "Swap Completed" : "Try Again"
                    ) : (
                      "Check Status"
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <Card className="shadow-none p-3 space-y-4 w-full">
                    <div className="flex justify-between w-full items-center text-xs text-gray-500">
                      <span>Minimum Deposit</span>
                      <span>0.001 NEAR</span>
                    </div>
                    <div className="flex justify-between w-full items-center text-xs text-gray-500">
                      <span>Processing Time</span>
                      <span>~5 mins</span>
                    </div>
                    {depositState.purchaseInfo?.slippageBps && (
                      <div className="flex justify-between w-full items-center text-xs text-gray-500">
                        <span>Slippage Tolerance</span>
                        <span>{(depositState.purchaseInfo.slippageBps / 100).toFixed(2)}%</span>
                      </div>
                    )}
                  </Card>
                  <Button
                    onClick={handleGenerateDepositAddress}
                    disabled={!depositState.depositAmount || parseFloat(depositState.depositAmount) <= 0 || depositState.isGeneratingAddress || !signedAccountId || !publicKey}
                    className={`w-full ${
                      depositState.depositAmount && parseFloat(depositState.depositAmount) > 0 && signedAccountId && publicKey && !depositState.isGeneratingAddress
                        ? "bg-blue-500 hover:bg-blue-600 cursor-pointer"
                        : "bg-gray-300 hover:bg-gray-300 cursor-not-allowed"
                    } text-white font-medium py-6 rounded-lg`}
                  >
                    {depositState.isGeneratingAddress ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                        Generating Address...
                      </>
                    ) : !signedAccountId ? (
                      "Connect NEAR Wallet"
                    ) : !publicKey ? (
                      "Connect Solana Wallet"
                    ) : (
                      `Buy ${token.symbol} with NEAR`
                    )}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-3 md:p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">Trade on DEX</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>DBC is a virtual pool bonding curve. DEX trading is only available on mainnet via Jupiter, Photon, and Axiom.</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex flex-col gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="border border-gray-200 bg-white p-3 rounded-lg flex items-center justify-between opacity-50 cursor-not-allowed">
                <div className="flex items-center gap-2">
                  <div className="relative w-9 h-9">
                    <img src="/logos/meteora.png" alt="Meteora" className="w-9 h-9 rounded-full" />
                    <div className="absolute -bottom-1 right-0 w-4 h-4 rounded-sm bg-black flex items-center justify-center">
                      <img src="/logos/solana_light.svg" alt="Solana" className="w-3 h-3" />
                    </div>
                  </div>
                  <span>Trade on Meteora</span>
                </div>
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm border border-gray-200">
              <p>Meteora DLMM pools are not compatible with DBC virtual pools. Use Jupiter, Photon, or Axiom instead.</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className={`border border-gray-200 bg-white p-3 rounded-lg flex items-center justify-between transition-colors ${
                    SOL_NETWORK === 'mainnet' ? 'hover:bg-gray-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span>Trade on another DEX</span>
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
            </TooltipTrigger>
            {SOL_NETWORK !== 'mainnet' && (
              <TooltipContent>
                <p>DEX trading is only available on mainnet. You're currently on {SOL_NETWORK}.</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

export const TradingInterface = memo(TradingInterfaceComponent);
