import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { FC } from "react";
import { IconWallet } from "@tabler/icons-react";

export const WalletButton: FC = () => {
    return (
        <div className="w-[180px]">
        <WalletMultiButton startIcon={<IconWallet className="h-5 w-5" />} />
        </div>
    );
};