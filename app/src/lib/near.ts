import { NEAR_NETWORK, TATUM_API_KEY } from "../configs/env.config";
import { formatDecimal } from "@/utils";

const URL_API = "https://api.binance.com/api/v3/ticker/price?symbol=NEARUSDT";
const FALLBACK_URL_API = "https://api.kucoin.com/api/v1/market/orderbook/level1?symbol=NEAR-USDT";

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
    const price = parseFloat(data.price);
    
    nearPriceCache = {
      price,
      timestamp: Date.now()
    };
    
    return price;
  } catch (primaryError) {
    try {
      const fallbackRes = await fetch(FALLBACK_URL_API);
      if (!fallbackRes.ok) throw new Error(`HTTP error! status: ${fallbackRes.status}`);
      const fallbackData = await fallbackRes.json();
      const price = parseFloat(fallbackData?.data?.price);

      if (Number.isNaN(price)) {
        throw new Error('Fallback price parsing failed');
      }

      nearPriceCache = {
        price,
        timestamp: Date.now()
      };

      return price;
    } catch (fallbackError) {
      console.error('Error fetching NEAR price:', primaryError, fallbackError);
    }
    
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

    const rawResult = data?.result?.result;
    if (!rawResult) {
      throw new Error('RPC response missing result payload');
    }

    let decodedResult: string;
    if (typeof rawResult === 'string') {
      decodedResult = Buffer.from(rawResult, 'base64').toString();
    } else if (Array.isArray(rawResult)) {
      decodedResult = Buffer.from(rawResult).toString();
    } else if (rawResult instanceof ArrayBuffer) {
      decodedResult = Buffer.from(new Uint8Array(rawResult)).toString();
    } else {
      throw new Error('Unsupported result payload format');
    }

    const result = JSON.parse(decodedResult);
  
    const balance = Number(result) / (10**24)

    return formatDecimal(balance);
  } catch (error) {
    console.error('Error getting token balance:', error);
    throw error;
  }
}

export const getAllTokenOnNear = async(walletAddress: string) => {
  const inventoryRes = await fetch(`${getApiNEAREndpoint()}/account/${walletAddress}/inventory`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const res = await inventoryRes.json()
  const inventory = res.inventory.fts
  return inventory
}

export const formatBalanceNear = (amount: string) =>{
  return formatDecimal(Number(amount) / (10**24));
}


