"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Transaction } from "@/types/bridge.types";
import { TableTx } from "./TableTx";

interface TransactionHistoryProps {
    transactions: Transaction[];
}

const ITEMS_PER_PAGE = 10;

export const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentTransactions = transactions.slice(startIndex, endIndex);

    const handlePreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };

    const handlePageClick = (page: number) => {
        setCurrentPage(page);
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                pages.push(currentPage - 1);
                pages.push(currentPage);
                pages.push(currentPage + 1);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="flex-1 w-full">
            <div className="bg-white border border-gray-200 rounded-xl shadow-none p-0">
                <div className="relative overflow-x-auto">
                    <Table className="border-separate border-spacing-y-0 min-w-[768px]">
                        <TableHeader className="bg-gray-50 hover:bg-gray-50 rounded-t-xl">
                            <TableRow className="hover:bg-gray-50">
                                <TableHead className="text-xs font-medium text-gray-900" style={{paddingLeft: "20px"}}>DATE &amp; TIME</TableHead>
                                <TableHead className="text-xs font-medium text-gray-900">ACTION</TableHead>
                                <TableHead className="text-xs font-medium text-gray-900">STATUS</TableHead>
                                <TableHead className="text-xs font-medium text-gray-900">TOKEN</TableHead>
                                <TableHead className="text-xs font-medium text-gray-900">AMOUNT</TableHead>
                                <TableHead className="text-xs font-medium text-gray-900 text-right" style={{paddingRight: "20px"}}>HASH</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow className="hover:bg-white">
                                    <TableCell colSpan={6} className="py-10" style={{padding: "20px"}}>
                                        <div className="text-center">
                                            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                                                <img src="/icons/empty.svg" alt="empty" className="w-full h-full" />
                                            </div>
                                            <p className="text-gray-500 text-lg">No transaction found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentTransactions.map((tx) => (
                                    <TableTx key={tx.id} transaction={tx} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                {transactions.length > 0 && totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6 py-4 border-t border-gray-200">
                        <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
                            <span className="font-medium">{Math.min(endIndex, transactions.length)}</span> of{" "}
                            <span className="font-medium">{transactions.length}</span> transactions
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            <button
                                onClick={handlePreviousPage}
                                disabled={currentPage === 1}
                                className="h-8 px-2 sm:px-3 text-xs sm:text-sm font-medium border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Previous
                            </button>
                            <div className="flex items-center gap-1">
                                {getPageNumbers().map((page, index) => (
                                    typeof page === 'number' ? (
                                        <button
                                            key={index}
                                            onClick={() => handlePageClick(page)}
                                            className={`h-7 w-7 sm:h-8 sm:w-8 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                                                currentPage === page
                                                    ? 'bg-red-500 text-white hover:bg-red-600'
                                                    : 'border border-gray-300 bg-white hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    ) : (
                                        <span key={index} className="px-1 sm:px-2 text-xs sm:text-sm text-gray-500">
                                            {page}
                                        </span>
                                    )
                                ))}
                            </div>
                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="h-8 px-2 sm:px-3 text-xs sm:text-sm font-medium border border-gray-300 rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
