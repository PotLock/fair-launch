import { HELIUS_API_KEY, SOL_NETWORK } from "../configs/env.config";

export const getRpcSOLEndpoint = (): string => {  
    switch (SOL_NETWORK) {
      case 'mainnet':
        return `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
      case 'testnet':
        return `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
      default:
        return `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
    }
}