import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { FC } from "react";
import { IconWallet } from "@tabler/icons-react";
import { useWallet } from "@solana/wallet-adapter-react";

function truncateAddress(address?: string) {
    if (!address) return "Connect Wallet";
    return address.slice(0, 6) + "..." + address.slice(-4);
}

export const WalletButton: FC = () => {
    const { publicKey } = useWallet();
    const address = publicKey?.toBase58();
    return (
        <WalletMultiButton
            className="flex items-center h-8 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition space-x-3 shadow-sm !justify-between !gap-3 !font-medium !text-sm"
        >
            {
                !address && (
                    <IconWallet className="h-5 w-5" />
                )
            }
            <span className="flex-1 text-gray-900 text-ellipsis overflow-hidden whitespace-nowrap text-center">
                {truncateAddress(address)}
            </span>
        </WalletMultiButton>
    );
};