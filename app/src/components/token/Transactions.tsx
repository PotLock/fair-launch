"use client"

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { copyToClipboard, timeAgo } from "@/utils";
import { Button } from "../ui/button";
import Link from "next/link";
import { useTransactions } from "@/hooks/useSWR";
import { TransactionAction } from "@/types/api";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TransactionsProps {
    tokenAddress: string;
    tokenSymbol: string;
    solPrice: number;
}

export default function Transactions({ tokenAddress, tokenSymbol, solPrice }: TransactionsProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const { transactions, isLoading, error } = useTransactions(tokenAddress);

    // Truncate address from the middle
    const truncateAddress = (address: string, startChars = 6, endChars = 4) => {
        if (address.length <= startChars + endChars) return address;
        return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [tokenAddress]);

    // Filter out BRIDGE and DEPLOY transactions, only show BUY and SELL
    const filteredTransactions = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];
        return transactions.filter(
            tx => tx.action === TransactionAction.BUY || tx.action === TransactionAction.SELL
        );
    }, [transactions]);

    const totalPages = Math.ceil((filteredTransactions?.length || 0) / itemsPerPage) || 1;

    const paginatedTransactions = useMemo(() => {
        if (!filteredTransactions || filteredTransactions.length === 0) return [];
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredTransactions.slice(startIndex, endIndex);
    }, [filteredTransactions, currentPage, itemsPerPage]);

    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredTransactions?.length || 0);

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(1, prev - 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
    };

    return (
        <Card className="w-full max-w-7xl mx-auto p-5 flex flex-col gap-5 shadow-none">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-medium mb-4">Transactions</h2>
                <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1 || isLoading}
                    className="text-slate-500 hover:text-slate-700 disabled:text-slate-300"
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <span className="text-sm font-medium text-slate-600 min-w-20 text-center">
                    {currentPage} / {totalPages}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages || isLoading}
                    className="text-slate-500 hover:text-slate-700 disabled:text-slate-300"
                >
                    <ChevronRight className="w-5 h-5" />
                </Button>
                </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-4 text-left">
                            <div className="flex items-center gap-2 text-slate-600 text-xs font-medium uppercase tracking-wider">
                            <span>HASH</span>
                            </div>
                        </th>
                        <th className="px-4 py-4 text-left relative">
                            <div className="flex items-center gap-2 text-slate-600 text-xs font-medium uppercase tracking-wider">
                            <span>TIME</span>
                            </div>
                        </th>
                        <th className="px-4 py-4 text-left">
                            <div className="flex items-center gap-2 text-slate-600 text-xs font-medium uppercase tracking-wider">
                            <span>ACTION</span>
                            </div>
                        </th>
                        <th className="px-4 py-4 text-left">
                            <div className="flex items-center gap-2 text-slate-600 text-xs font-medium uppercase tracking-wider">
                            <span>By</span>
                            </div>
                        </th>
                        <th className="px-4 py-4 text-left">
                            <div className="flex items-center gap-2 text-slate-600 text-xs font-medium uppercase tracking-wider">
                            <span>AMOUNT</span>
                            </div>
                        </th>
                        <th className="px-4 py-4 text-left">
                            <div className="flex items-center gap-2 text-slate-600 text-xs font-medium uppercase tracking-wider">
                            <span>USD</span>
                            </div>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {isLoading ? (
                        <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                Loading transactions...
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-red-500">
                                Error loading transactions
                            </td>
                        </tr>
                    ) : paginatedTransactions.length > 0 ? (
                        paginatedTransactions.map((transfer) => (
                        <tr key={transfer.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4">
                                <Link 
                                    href={`https://solscan.io/tx/${transfer.txHash}?cluster=devnet`} 
                                    target="_blank" 
                                    className="text-blue-600 font-mono text-xs hover:underline"
                                    title={transfer.txHash}
                                >
                                    {truncateAddress(transfer.txHash, 8, 8)}
                                </Link>
                            </td>
                            <td className="px-4 py-4">
                                <span className="text-slate-700 font-mono text-xs font-medium">{timeAgo(transfer.createdAt)}</span>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                    <span className={`${transfer.action === TransactionAction.BUY ? 'text-green-600' : 'text-red-600'} font-mono text-sm font-medium`}>{transfer.action}</span>
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link 
                                                href={`https://solscan.io/address/${transfer.userAddress}?cluster=devnet`} 
                                                target="_blank" 
                                                className="text-blue-600 font-mono text-xs hover:underline"
                                            >
                                                {truncateAddress(transfer.userAddress)}
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent className="border border-slate-200/70">
                                            <p className="font-mono text-xs">{transfer.userAddress}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => copyToClipboard(transfer.userAddress)}
                                                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="border border-slate-200/70">
                                            <p className="text-xs">Copy address</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <span className="text-slate-900 font-mono text-xs font-medium">{Number(transfer.amountIn).toFixed(3)} {transfer.action === TransactionAction.BUY ? "SOL" : tokenSymbol}</span>
                            </td>
                            <td className="px-4 py-4">
                                <span className="text-slate-900 font-mono text-xs font-medium">${transfer.action === TransactionAction.BUY ? (Number(transfer.amountIn) * solPrice).toFixed(3) : (Number(transfer.amountOut) * solPrice).toFixed(3)}</span>
                            </td>
                        </tr>
                    ))
                    ) : (
                        <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                                No transfers match the selected filters
                            </td>
                        </tr>
                    )}
                </tbody>
                </table>
            </div>

            <div className="mt-6 text-xs text-slate-500 flex items-center justify-between">
                <span>
                    {filteredTransactions?.length > 0 ? (
                        `Showing ${startIndex} - ${endIndex} of ${filteredTransactions.length} transfers`
                    ) : (
                        "No transfers found"
                    )}
                </span>
                <span>
                    Page {currentPage} of {totalPages}
                </span>
            </div>
        </Card>
    );
}