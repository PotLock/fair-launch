import { ethers } from "ethers";
import { ALCHEMY_API_KEY, EVM_NETWORK } from "../configs/env.config";

const URL_API = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";

const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  }
];

interface PriceCache {
  price: number;
  timestamp: number;
}


let ethPriceCache: PriceCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000;

export const getRpcEVMEndpoint = ():string => {  
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


export const getBalanceEVM = async (address: string) =>{
    const provider = new ethers.JsonRpcProvider(getRpcEVMEndpoint());
    const balance = await provider.getBalance(address);
    return ethers.formatEther(balance);
}

export const getEthPrice = async (): Promise<number | null> => {
  try {
    const res = await fetch(URL_API);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    const price = data.ethereum.usd;

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

/**
 * Get ERC20 token balance for a specific token and user address
 * @param tokenAddress - The ERC20 token contract address
 * @param userAddress - The user's wallet address
 * @returns Token balance information including formatted balance
 */
export const getTokenBalanceOnEVM = async (
  tokenAddress: string,
  userAddress: string
): Promise<string | null> => {
  try {
    const provider = new ethers.JsonRpcProvider(getRpcEVMEndpoint());
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    const [balance, decimals] = await Promise.all([
      tokenContract.balanceOf(userAddress),
      tokenContract.decimals()
    ]);
    
    const formattedBalance = ethers.formatUnits(balance, decimals);
    
    return formattedBalance.toString()
  } catch (error) {
    console.error('Error getting token balance:', error);
    return null;
  }
};
