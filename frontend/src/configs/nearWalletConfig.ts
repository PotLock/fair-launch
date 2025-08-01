import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupNightly } from "@near-wallet-selector/nightly";
import { NEAR_NETWORK } from "./env.config";

export const nearWalletConfig = {
  network: (NEAR_NETWORK || 'testnet') as 'mainnet' | 'testnet',
  modules: [
    setupHereWallet(),
    setupMeteorWallet(),
    setupSender(),
    setupNightly()
  ],
  createAccessKeyFor: {
    contractId: "v1.social08.testnet",
    methodNames: [],
  },
}; 