import { ethers } from "ethers";
import { ALCHEMY_API_KEY, ETHERSCAN_API_KEY, EVM_NETWORK } from "../configs/env.config";

const URL_API = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd";
const SEPOLIA_ETHERSCAN_API_URL = "https://api-sepolia.etherscan.io/api";

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

export interface UserToken {
  address: string;
  name: string;
  symbol: string;
  balance: string;
  decimals: number;
  logo?: string;
}

interface TokenTransfer {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  blockHash: string;
  from: string;
  contractAddress: string;
  to: string;
  value: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  transactionIndex: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  cumulativeGasUsed: string;
  input: string;
  confirmations: string;
}

interface EtherscanResponse<T> {
  status: string;
  message: string;
  result: T;
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

/**
 * Format token balance with proper decimals
 * @param balance - Balance in smallest decimal representation
 * @param decimals - Number of decimal places
 * @returns Formatted balance string
 */
const formatTokenBalance = (balance: bigint, decimals: number): string => {
  if (balance === 0n) {
    return '0';
  }
  
  const divisor = BigInt(10) ** BigInt(decimals);
  const wholePart = balance / divisor;
  const fractionalPart = balance % divisor;
  
  if (fractionalPart === 0n) {
    return wholePart.toString();
  }
  
  const fractionalString = fractionalPart.toString().padStart(decimals, '0');
  // Remove trailing zeros
  const trimmedFractional = fractionalString.replace(/0+$/, '');
  
  return `${wholePart.toString()}.${trimmedFractional}`;
};

/**
 * Get all tokens in user wallet with complete information
 * @param address - The wallet address to query
 * @returns Array of user tokens with name, symbol, balance, and logo
 */
export const getAllTokens = async (address: string): Promise<UserToken[]> => {
  try {
    if (!ETHERSCAN_API_KEY) {
      throw new Error('Etherscan API key is required');
    }

    // Get all token transfers for the address
    const tokenTransfers = await getTokenTransfers(address);
    
    // Calculate balances from transfer events
    const tokenBalances = calculateTokenBalances(tokenTransfers, address);
    
    // Convert to UserToken array
    const userTokens: UserToken[] = [];
    
    for (const [contractAddress, tokenData] of tokenBalances) {
      // Only include tokens with non-zero balance
      if (tokenData.balance > 0n) {
        try {
          const formattedBalance = formatTokenBalance(tokenData.balance, tokenData.decimals);
          
          userTokens.push({
            address: contractAddress,
            name: tokenData.name || 'Unknown Token',
            symbol: tokenData.symbol || 'UNKNOWN',
            balance: formattedBalance,
            decimals: tokenData.decimals,
            logo: undefined // You can add logo URL logic here if available
          });
        } catch (error) {
          console.warn(`Error processing token ${contractAddress}:`, error);
          // Include basic info even if detailed info fails
          const formattedBalance = formatTokenBalance(tokenData.balance, tokenData.decimals);
          
          userTokens.push({
            address: contractAddress,
            name: tokenData.name || 'Unknown Token',
            symbol: tokenData.symbol || 'UNKNOWN',
            balance: formattedBalance,
            decimals: tokenData.decimals,
            logo: undefined
          });
        }
      }
    }
    
    return userTokens;
  } catch (error) {
    console.error('Error fetching user tokens:', error);
    throw error;
  }
};

/**
 * Get all ERC20 token transfer events for a wallet address
 * @param address - The wallet address to query
 * @param page - Page number for pagination (default: 1)
 * @param offset - Number of records per page (default: 100)
 * @returns Array of token transfer events
 */
const getTokenTransfers = async (
  address: string,
  page: number = 1,
  offset: number = 100
): Promise<TokenTransfer[]> => {
  try {
    if (!ETHERSCAN_API_KEY) {
      throw new Error('Etherscan API key is required');
    }
    
    const params = new URLSearchParams({
      module: 'account',
      action: 'tokentx',
      address: address,
      startblock: '0',
      endblock: '99999999',
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc',
      apikey: ETHERSCAN_API_KEY
    });

    const response = await fetch(`${SEPOLIA_ETHERSCAN_API_URL}?${params}`);
    const data: EtherscanResponse<TokenTransfer[]> = await response.json();

    if (data.status === '1') {
      return data.result;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching token transfers:', error);
    throw error;
  }
};

/**
 * Calculate token balances from transfer events
 * @param transfers - Array of token transfer events
 * @param address - The wallet address to calculate balances for
 * @returns Map of token contract addresses to their balances
 */
const calculateTokenBalances = (transfers: TokenTransfer[], address: string): Map<string, { balance: bigint, decimals: number, name: string, symbol: string }> => {
  const balances = new Map<string, { balance: bigint, decimals: number, name: string, symbol: string }>();
  
  for (const transfer of transfers) {
    const contractAddress = transfer.contractAddress.toLowerCase();
    const value = BigInt(transfer.value);
    const decimals = parseInt(transfer.tokenDecimal);
    
    if (!balances.has(contractAddress)) {
      balances.set(contractAddress, {
        balance: 0n,
        decimals,
        name: transfer.tokenName,
        symbol: transfer.tokenSymbol
      });
    }
    
    const currentBalance = balances.get(contractAddress)!;
    
    // If the address is the recipient, add the tokens
    if (transfer.to.toLowerCase() === address.toLowerCase()) {
      currentBalance.balance += value;
    }
    
    // If the address is the sender, subtract the tokens
    if (transfer.from.toLowerCase() === address.toLowerCase()) {
      currentBalance.balance -= value;
    }
  }
  
  return balances;
};