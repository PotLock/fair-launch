import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import { setupSender } from "@near-wallet-selector/sender";
import { setupNightly } from "@near-wallet-selector/nightly";
import { setupIntearWallet } from "@near-wallet-selector/intear-wallet";
import { NEAR_NETWORK } from "./env.config";
import type { SetupParams } from "@near-wallet-selector/react-hook";


export const nearWalletConfig: SetupParams = {
  network: (NEAR_NETWORK || 'testnet') as 'mainnet' | 'testnet',
  modules: [
    setupHereWallet(),
    setupMeteorWallet(),
    setupSender(),
    setupNightly(),
    setupIntearWallet()
  ],
  languageCode: "en",
  debug: true
}; 