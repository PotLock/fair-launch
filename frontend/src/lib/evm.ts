import { ethers } from "ethers";
import { ALCHEMY_API_KEY, EVM_NETWORK } from "../configs/env.config";

const URL_API = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

interface PriceCache {
  price: number;
  timestamp: number;
}

let ethPriceCache: PriceCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

const getRpcEVMEndpoint = ():string => {  
    switch (EVM_NETWORK) {
      case 'mainnet':
        return `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
      case 'sepolia':
        return `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    case 'holesky':
        return 'https://ethereum-holesky.publicnode.com';
      default:
        return `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`;
    }
}


const getBalanceEVM = async (address: string) =>{
    const provider = new ethers.JsonRpcProvider(getRpcEVMEndpoint());
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
}

const getEthPrice = async (): Promise<number | null> => {
    try {
        const res = await fetch(URL_API);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const price = data.ethereum.usd;
        
        // Update cache with new price
        ethPriceCache = {
        price,
        timestamp: Date.now()
        };
        
        return price;
    } catch (err) {
        if (ethPriceCache && (Date.now() - ethPriceCache.timestamp) < CACHE_DURATION) {
        return ethPriceCache.price;
        }
        
        return null;
    }
}

export {
    getBalanceEVM,
    getEthPrice,
    getRpcEVMEndpoint
}