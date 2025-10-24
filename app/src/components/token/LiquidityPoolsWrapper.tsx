"use client"

import { useState } from "react";
import { LiquidityPools } from "./LiquidityPools";
import { Token } from "@/types/api";

interface LiquidityPoolsWrapperProps {
    token: Token;
}

export function LiquidityPoolsWrapper({ token }: LiquidityPoolsWrapperProps) {
    const [showAddLiquidityModal, setShowAddLiquidityModal] = useState(false);

    const handleAddLiquidity = (isOpen: boolean) => {
        setShowAddLiquidityModal(isOpen);
        // Here you can add additional logic for opening the modal
        console.log('Add liquidity modal:', isOpen);
    };

    return (
        <LiquidityPools 
            onAddLiquidity={handleAddLiquidity}
            token={token}
        />
    );
}
