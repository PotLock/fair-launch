import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { FC, useEffect, useState } from "react";
import { IconWallet } from "@tabler/icons-react";
import { useWallet } from "@solana/wallet-adapter-react";

function truncateAddress(address?: string) {
    if (!address) return "Connect Wallet";
    return address.slice(0, 6) + "..." + address.slice(-4);
}

export const WalletButton: FC = () => {
    const { publicKey, connect, disconnect } = useWallet();
    const address = publicKey?.toBase58();
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (isMobile) {
        return (
            <button
                className="flex items-center h-8 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition space-x-3 shadow-sm justify-between gap-3 font-medium text-sm w-full"
                onClick={address ? () => disconnect() : () => connect()}
            >
                <IconWallet className="h-5 w-5" />
                <span className="flex-1 text-gray-900 text-ellipsis overflow-hidden whitespace-nowrap text-center">
                    {truncateAddress(address)}
                </span>
            </button>
        );
    }

    return (
        <WalletMultiButton
            className="flex items-center h-8 px-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition space-x-3 shadow-sm !justify-between !gap-3 !font-medium !text-sm"
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