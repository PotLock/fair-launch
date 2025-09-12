import { useCallback, useEffect, useMemo, useState } from 'react';
import { 
    Dialog, 
    DialogContent,
    DialogTitle,
    DialogClose
} from './ui/dialog';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { ChevronDown, ArrowUpDown, Terminal } from 'lucide-react';
import { formatNumberToCurrency, formatNumberWithCommas } from '../utils';
import { Pool, Token } from '../types';
import { toast } from 'react-hot-toast';
import useAnchorProvider from '../hook/useAnchorProvider';
import { PublicKey } from '@solana/web3.js';
import { getSolBalance, getSolPrice, getTokenBalanceOnSOL } from '../lib/sol';
import useAddLiquidity from '../hook/useAddLiquidity';
import { NATIVE_MINT } from '@solana/spl-token';
 

interface AddLiquidityModalProps {
    isOpen: boolean;
    onClose: () => void;
    tokenInfo: Token;
    listPools: Pool[];
    tokenPrice: number
}

export function AddLiquidityModal({ isOpen, onClose, tokenInfo, listPools, tokenPrice }: AddLiquidityModalProps) {
    const [slippageTolerance, setSlippageTolerance] = useState('0.5');
    const [slippageDialogOpen, setSlippageDialogOpen] = useState(false);
    const [customSlippage, setCustomSlippage] = useState<string>('');
    const [riskAccepted, setRiskAccepted] = useState(false);
    const [fromAmount, setFromAmount] = useState<string>('0');
    const [toAmount, setToAmount] = useState<string>('0');
    const [displayFromAmount, setDisplayFromAmount] = useState<string>('0');
    const [displayToAmount, setDisplayToAmount] = useState<string>('0');
    const [balanceToken, setBalanceToken] = useState<number>(0)
    const [balanceSOL, setBalanceSOL] = useState<number>(0) 
    const [solPrice, setSolPrice] = useState<number>(0)

    const anchorProvider = useAnchorProvider();
    const { createPool } = useAddLiquidity();

    const publicKey = useMemo(
        () => anchorProvider?.providerProgram?.publicKey?.toBase58() ?? "",
        [anchorProvider?.providerProgram?.publicKey]
    );
    
    const fetchBalances = useCallback(async () => {
        if (!publicKey) return;
    
        const [tokenBalance, solBalance, price] = await Promise.all([
            getTokenBalanceOnSOL(tokenInfo.mintAddress, publicKey),
            getSolBalance(publicKey),
            getSolPrice(),
        ]);
    
        setBalanceToken(tokenBalance);
        setBalanceSOL(solBalance);
        setSolPrice(price || 0);
    }, [publicKey, tokenInfo.mintAddress]);
    
    useEffect(() => {
        fetchBalances();
    }, [fetchBalances]);
    

    const dexOptions = [
        { name: 'PumpSwap', icon: '/logos/pumpfun.png'},
        { name: 'Raydium', icon: '/logos/raydium-logo.png' },
        { name: 'Meteora', icon: 'https://www.meteora.ag/icons/logo.svg' }
    ];

    // Slippage helpers
    const presetSlippages = useMemo(() => ['0.1', '0.5', '1'], []);
    const chosenSlippage = customSlippage === '' ? slippageTolerance : customSlippage;
    const chosenSlippageNum = useMemo(() => Number(chosenSlippage), [chosenSlippage]);
    const isAggressiveSlippage = !Number.isNaN(chosenSlippageNum) && chosenSlippageNum <= 0.1;

    const handleCustomSlippageChange = (rawValue: string) => {
        const sanitized = rawValue.replace(/[^0-9.]/g, '');
        const parts = sanitized.split('.');
        if (parts.length > 2) return;
        if (sanitized === '' || /^\d*(?:\.\d*)?$/.test(sanitized)) {
            setCustomSlippage(sanitized);
        }
    };

    const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const cleanValue = inputValue.replace(/[^0-9.]/g, '');
        
        const parts = cleanValue.split('.');
        if (parts.length > 2) return;
        
        if (parts[1] && parts[1].length > 2) return;
        
        if (cleanValue === '' || /^[0-9]*\.?[0-9]*$/.test(cleanValue)) {
            const parsedAmount = parseFloat(cleanValue) || 0;
            setFromAmount(parsedAmount.toString());
            setDisplayFromAmount(formatNumberWithCommas(parsedAmount));
        }
    };

    const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const cleanValue = inputValue.replace(/[^0-9.]/g, '');
        
        const parts = cleanValue.split('.');
        if (parts.length > 2) return;
        
        if (parts[1] && parts[1].length > 2) return;
        
        if (cleanValue === '' || /^[0-9]*\.?[0-9]*$/.test(cleanValue)) {
            const parsedAmount = parseFloat(cleanValue) || 0;
            setToAmount(parsedAmount.toString());
            setDisplayToAmount(formatNumberWithCommas(parsedAmount));
        }
    };

    const handleAddLiquidity = () => {
        if (!riskAccepted) {
            return;
        }
        // Handle deposit logic here
        console.log('Depositing liquidity...');
        onClose();
    };

    const handleCreatePool = async () => {
        if(!anchorProvider?.providerProgram) {
            toast.error('Please connect your wallet');
            return;
        }

        if (!riskAccepted) {
            return;
        }

        if(Number(fromAmount) == 0 || Number(toAmount) == 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        console.log("creating pool...")
        console.log("amountTokenA", fromAmount)
        console.log("amountTokenB", toAmount)
        try{
            const tokenA = {
                mint: new PublicKey(tokenInfo.mintAddress),
                decimals: tokenInfo.decimals
            }

            const tokenB = {
                mint: new PublicKey(NATIVE_MINT),
                decimals: 9
            }

            const result = await createPool({tokenA,tokenB,amountTokenA:fromAmount,amountTokenB:toAmount})

            console.log("result", result)
            onClose();
        }catch(error){
            console.error(error)
            toast.error('Failed to create pool');
        }

    }

    const isDisable = !riskAccepted || Number(fromAmount) == 0 || Number(toAmount) == 0;

    return (
        <>
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl bg-white rounded-2xl p-0 border-0 shadow-none max-h-[90vh] overflow-y-auto">
                <div className="flex flex-col items-center gap-1.5 p-6">
                    <div className="flex items-center gap-[-13px] -space-x-3">
                        <div className="w-[59.51px] h-[59.51px] rounded-full flex items-center justify-center shadow-lg">
                            <img src={tokenInfo.avatarUrl} alt={tokenInfo.name} className='rounded-full'/>
                        </div>
                        <div className="w-[59.51px] h-[59.51px] rounded-full flex items-center justify-center">
                            <img src="/chains/solana-dark.svg" alt="Sol" className='rounded-full w-full h-full' />
                        </div>
                    </div>
                    <h2 className="text-3xl font-semibold text-gray-900">{listPools.length == 0 ? "Create Pool" : "Add Liquidity"}</h2>
                    <p className="text-base text-gray-600">{listPools.length == 0 ? `Create a pool to provide liquidity for ${tokenInfo.name} and start earning rewards.` : `Provide liquidity for ${tokenInfo.name} and start earning rewards.`}</p>
                </div>

                <div className="flex gap-3 p-6">
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                        <div className="space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <h3 className="text-base font-medium text-gray-700">You're adding</h3>
                                <div className="bg-gray-100 border border-gray-300 rounded-lg p-5">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                                <img src={tokenInfo.avatarUrl} alt={tokenInfo.name} className='rounded-full'/>
                                            </div>
                                            <span className="text-xl font-semibold text-gray-900">{tokenInfo.symbol}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <input
                                                type="text"
                                                value={displayFromAmount}
                                                onChange={handleFromAmountChange}
                                                className="text-2xl font-semibold text-gray-900 bg-transparent border-none outline-none text-right md:w-40 w-24"
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                    <div className='flex justify-between items-center mt-2'>
                                        <span className="text-xs text-gray-500 ml-2">{formatNumberToCurrency(balanceToken)} {tokenInfo.symbol}</span>
                                        <span className="text-xs text-gray-500">${formatNumberToCurrency(Number(fromAmount) * (tokenPrice*solPrice))}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center relative pt-5">
                                <button className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors absolute top-1/2 transform -translate-y-1/2">
                                    <ArrowUpDown className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-base font-medium text-gray-700">and</h3>
                                <div className="bg-gray-100 border border-gray-300 rounded-lg p-5">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center">
                                                <img src="/chains/solana-dark.svg" alt="Sol" className='rounded-full w-full h-full' />
                                            </div>
                                            <span className="text-lg font-semibold text-gray-900">SOL</span>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <input
                                                type="text"
                                                value={displayToAmount}
                                                onChange={handleToAmountChange}
                                                className="text-2xl font-semibold text-gray-900 bg-transparent border-none outline-none text-right md:w-40 w-24"
                                                placeholder="0"
                                            />
                                            
                                        </div>
                                    </div>
                                    <div className='flex justify-between items-center mt-2'>
                                        <span className="text-xs text-gray-500 ml-2">{formatNumberToCurrency(balanceSOL)} SOL</span>
                                        <span className="text-xs text-gray-500">${formatNumberToCurrency(Number(toAmount) * (solPrice))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {
                            listPools.length != 0 && (
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setCustomSlippage('');
                                        setSlippageDialogOpen(true);
                                    }}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3"
                                >
                                    <div className="flex justify-between items-end">
                                        <div className='space-y-2 flex flex-col text-left'>
                                            <span className="text-sm font-medium text-gray-600">Slippage Tolerance</span>
                                            <span className="text-2xl font-semibold text-gray-900">{slippageTolerance}%</span>
                                        </div>
                                        <ChevronDown className="w-6 h-6 text-gray-900" />
                                    </div>
                                </button>
                            )
                        }

                        <div className="space-y-4">
                            <div className="flex items-start gap-1.5">
                                <Checkbox 
                                    id="risk-acceptance"
                                    checked={riskAccepted}
                                    onCheckedChange={(checked) => setRiskAccepted(checked as boolean)}
                                    className="mt-0.5"
                                />
                                <label 
                                    htmlFor="risk-acceptance" 
                                    className="text-xs text-gray-600 leading-relaxed"
                                >
                                    I understand and accept the risks involved in trading in this pool and wish to proceed.
                                </label>
                            </div>

                            <Button 
                                onClick={listPools.length == 0 ? handleCreatePool : handleAddLiquidity}
                                disabled={isDisable}
                                className="text-base w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {listPools.length == 0 ? "Create Pool": "Deposit LP"}
                            </Button>
                        </div>
                        </div>
                    </div>

                    <div className="md:w-[423px] w-full space-y-3">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-5">Pool Information</h3>
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900">Pool</span>
                                    <span className="text-sm text-gray-600">{tokenInfo.symbol}/SOL</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900">DEX</span>
                                    <div className="flex items-center gap-1">
                                        <img src={dexOptions[1].icon} alt={dexOptions[1].name} className='w-6 h-6 rounded-full' />
                                        <span className="text-sm text-gray-600">{dexOptions[1].name}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900">TVL</span>
                                    <span className="text-sm text-gray-600">$0</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900">APR</span>
                                    <span className="text-sm text-gray-600">0%</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                            <div className="flex gap-3">
                                <Terminal className="w-4 h-4 text-orange-600 mt-0.5" />
                                <div>
                                <h4 className="text-orange-800 font-medium mb-1">Heads up!</h4>
                                <p className="text-orange-700 text-sm">
                                    Adding liquidity will mint LP tokens representing your share of the pool. You can remove liquidity at any time.
                                </p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-900 mb-5">Position Preview</h3>
                            <div className="space-y-2.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900">{tokenInfo.symbol} Amount</span>
                                    <span className="text-sm text-gray-600">{displayFromAmount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900">SOL Amount</span>
                                    <span className="text-sm text-gray-600">{displayToAmount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900">Pool Share</span>
                                    <span className="text-sm text-gray-600">0%</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-900">Est. Value</span>
                                    <span className="text-sm text-gray-600">$0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        {/* Slippage dialog */}
        <Dialog open={slippageDialogOpen} onOpenChange={setSlippageDialogOpen}>
            <DialogContent className="max-w-md bg-white">
                <DialogTitle className="text-xl font-semibold text-gray-900">Swap slippage tolerance</DialogTitle>
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        {presetSlippages.map((opt) => {
                            const isActive = (customSlippage === '' ? slippageTolerance : customSlippage) === opt;
                            return (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => {
                                        setSlippageTolerance(opt);
                                        setCustomSlippage('');
                                    }}
                                    className={`h-10 rounded-full border text-sm font-medium ${isActive ? 'bg-red-500 text-white border-red-400' : 'bg-gray-100 text-gray-900 border-gray-300'}`}
                                >
                                    {opt}%
                                </button>
                            );
                        })}
                    </div>
                    {isAggressiveSlippage ? (
                        <div className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-md px-3 py-2">
                            Your transaction may fail
                        </div>
                    ) : null}
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-sm text-gray-600">Custom</span>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                inputMode="decimal"
                                value={customSlippage}
                                onChange={(e) => handleCustomSlippageChange(e.target.value)}
                                placeholder="0.5"
                                className="w-24 h-10 rounded-md border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-200"
                            />
                            <span className="text-sm text-gray-900">%</span>
                        </div>
                    </div>
                    <div className="pt-2">
                        <Button
                            type="button"
                            className="w-full h-11 bg-red-500 hover:bg-red-700 text-white font-semibold rounded-full"
                            onClick={() => {
                                if (Number.isNaN(chosenSlippageNum) || chosenSlippageNum < 0) return;
                                setSlippageTolerance(chosenSlippageNum.toString());
                                setSlippageDialogOpen(false);
                            }}
                        >
                            Save
                        </Button>
                    </div>
                </div>
                <DialogClose className="hidden" />
            </DialogContent>
        </Dialog>
        </>
    );
};
