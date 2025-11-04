import { Card } from "@/components/ui/card";
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

export const TransactionHistory = ({ transactions }: TransactionHistoryProps) => {

    return (
        <div className="flex-1">
            <Card className="bg-white border border-gray-200 rounded-xl shadow-none p-0">
                <div className="relative">
                    <Table className="border-separate border-spacing-y-0">
                        <TableHeader className="bg-gray-50 hover:bg-gray-50 rounded-t-xl">
                            <TableRow className="hover:bg-gray-50">
                                <TableHead className="text-xs font-medium text-gray-900">DATE &amp; TIME</TableHead>
                                <TableHead className="text-xs font-medium text-gray-900">ACTION</TableHead>
                                <TableHead className="text-xs font-medium text-gray-900">STATUS</TableHead>
                                <TableHead className="text-xs font-medium text-gray-900">TOKEN</TableHead>
                                <TableHead className="text-xs font-medium text-gray-900">AMOUNT</TableHead>
                                <TableHead className="text-xs font-medium text-gray-900 text-right">HASH</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.length === 0 ? (
                                <TableRow className="hover:bg-white">
                                    <TableCell colSpan={6} className="py-10">
                                        <div className="text-center">
                                            <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                                                <img src="/icons/empty.svg" alt="empty" className="w-full h-full" />
                                            </div>
                                            <p className="text-gray-500 text-lg">No transaction found</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableTx key={tx.id} transaction={tx} />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Card>
        </div>
    );
};
