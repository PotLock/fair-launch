import { NEAR_NETWORK, TATUM_API_KEY } from "../configs/env.config";
import { formatDecimal } from "../utils";

const URL_API = "https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd";

interface PriceCache {
  price: number;
  timestamp: number;
}

let nearPriceCache: PriceCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; 

export const getRpcNEAREndpoint = (): string => {  
  switch (NEAR_NETWORK) {
    case 'mainnet':
      return 'https://near-mainnet.gateway.tatum.io/';
    case 'testnet':
      return 'https://near-testnet.gateway.tatum.io/';
    default:
      return 'https://near-testnet.gateway.tatum.io/';
  }
}

export const getApiNEAREndpoint = (): string => {  
  switch (NEAR_NETWORK) {
    case 'mainnet':
      return 'https://api.nearblocks.io/v1';
    case 'testnet':
      return 'https://api-testnet.nearblocks.io/v1';
    default:
      return 'https://api-testnet.nearblocks.io/v1';
  }
}

export const getNearBalance = async (walletAddress: string) => {
  const accountRes = await fetch(`${getApiNEAREndpoint()}/account/${walletAddress}`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
  });

  const accountInfo = await accountRes.json()

  const balance = accountInfo.account[0].amount

  return (Number(balance)/(10**24)).toFixed(5);
}

export const getNearPrice = async (): Promise<number | null> => {
  try {
    const res = await fetch(URL_API);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    const price = data.near.usd;
    
    nearPriceCache = {
      price,
      timestamp: Date.now()
    };
    
    return price;
  } catch (err) {
    if (nearPriceCache && (Date.now() - nearPriceCache.timestamp) < CACHE_DURATION) {
      return nearPriceCache.price;
    }
    
    return null;
  }
}

export const getTokenBalanceOnNEAR = async (
  tokenContractId: string, 
  userAccountId: string
): Promise<string> => {
  try {
    const response = await fetch(`${getRpcNEAREndpoint()}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization' : `bearer ${TATUM_API_KEY}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'dontcare',
        method: 'query',
        params: {
          request_type: 'call_function',
          finality: 'final',
          account_id: tokenContractId,
          method_name: 'ft_balance_of',
          args_base64: Buffer.from(JSON.stringify({ account_id: userAccountId })).toString('base64')
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC error: ${data.error.message}`);
    }

    const result = JSON.parse(Buffer.from(data.result.result, 'base64').toString());
  
    const balance = Number(result) / (10**24)

    return formatDecimal(balance);
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw error;
  }
}


