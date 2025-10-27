"use client"

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { copyToClipboard, timeAgo } from "@/utils";
import { Button } from "../ui/button";
import Link from "next/link";
import { useTransactions } from "@/hooks/useSWR";

interface TransactionsProps {
    tokenAddress: string;
    tokenSymbol: string;
    tokenImage: string;
    solPrice: number;
}

export default function Transactions({ tokenAddress, tokenSymbol, tokenImage, solPrice }: TransactionsProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const { transactions, isLoading, error } = useTransactions(tokenAddress);

    // Calculate pagination
    const totalPages = Math.ceil(transactions.length / itemsPerPage);

    return (
        <Card className="w-full max-w-7xl mx-auto p-5 flex flex-col gap-5 shadow-none">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-medium mb-4">Transactions</h2>
                <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    disabled={currentPage === 1}
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
                    disabled={currentPage === totalPages}
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
                            <span>TOKEN</span>
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
                    {transactions.length > 0 ? (
                        transactions.map((transfer) => (
                        <tr key={transfer.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4">
                                <Link href={`https://solscan.io/tx/${transfer.txHash}?cluster=devnet`} target="_blank" className="text-blue-600 font-mono text-xs truncate max-w-xs">{transfer.txHash.slice(0, 10)+'...'}</Link>
                            </td>
                            <td className="px-4 py-4">
                                <span className="text-slate-700 font-mono text-xs font-medium">{timeAgo(transfer.createdAt)}</span>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                <span className="text-slate-700 font-mono text-xs truncate max-w-xs">{transfer.userAddress.slice(0, 10)+'...'}</span>
                                <button
                                    onClick={() => copyToClipboard(transfer.userAddress)}
                                    className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                >
                                    <Copy className="w-3 h-3" />
                                </button>
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <span className="text-slate-900 font-mono text-xs font-medium">{Number(transfer.amountIn).toFixed(5)} SOL</span>
                            </td>
                            <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full overflow-hidden">
                                        <img src={tokenImage} alt={tokenSymbol} className="w-full h-full rounded-full" />
                                    </div>
                                    <span className="text-slate-900 text-xs font-medium">{tokenSymbol}</span>
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <span className="text-slate-900 font-mono text-xs font-medium">${(Number(transfer.amountIn) * solPrice).toFixed(3)}</span>
                            </td>
                        </tr>
                    ))
                    ) : (
                    <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        No transfers match the selected filters
                        </td>
                    </tr>
                    )}
                </tbody>
                </table>
            </div>

            <div className="mt-6 text-xs text-slate-500 flex items-center justify-between">
                <span>
                    Showing {transactions.length} of {transactions.length} transfers
                </span>
                <span>
                    Page {currentPage} of {totalPages}
                </span>
            </div>
        </Card>
    );
}