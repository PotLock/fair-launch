import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupBitteWallet } from "@near-wallet-selector/bitte-wallet";
import { setupLedger } from "@near-wallet-selector/ledger";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupIntearWallet } from "@near-wallet-selector/intear-wallet";
import type { SetupParams } from "@near-wallet-selector/react-hook";
import { NEAR_NETWORK } from "./env.config";


export const nearWalletConfig: SetupParams = {
    network: NEAR_NETWORK as any,
    modules: [
        setupMeteorWallet(),
        setupBitteWallet(),
        setupLedger(),
        setupNightly(),
        setupIntearWallet(),
    ],
    languageCode: "en",
    debug: true,
    createAccessKeyFor:{
        contractId: "v1.social08.testnet",
        methodNames: []
    },
}; 