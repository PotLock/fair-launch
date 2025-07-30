import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupWalletConnect } from "@near-wallet-selector/wallet-connect";
import { NEAR_NETWORK, NEAR_WALLET_CONNECT_PROJECT_ID } from "./env.config";

export const nearWalletConfig = {
  network: (NEAR_NETWORK || 'testnet') as 'mainnet' | 'testnet',
  modules: [
    setupMyNearWallet(),
    setupHereWallet(),
    setupMeteorWallet(),
    setupSender(),
    setupNightly(),
    setupWalletConnect({
      projectId: NEAR_WALLET_CONNECT_PROJECT_ID,
      metadata: {
        name: "POTLAUNCH",
        url: typeof window !== 'undefined' ? window.location.hostname : '',
        icons: [
          "https://raw.githubusercontent.com/Shitzu-Apes/brand-kit/main/logo/shitzu.webp",
        ],
        description: "POTLAUNCH",
      },
    }),
  ],
  createAccessKeyFor: {
    contractId: "v1.social08.testnet",
    methodNames: [],
  },
}; 