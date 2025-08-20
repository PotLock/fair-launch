import { NEAR_NETWORK } from "../configs/env.config";

const URL_API = "https://api.coingecko.com/api/v3/simple/price?ids=near&vs_currencies=usd";

interface PriceCache {
  price: number;
  timestamp: number;
}

let nearPriceCache: PriceCache | null = null;
const CACHE_DURATION = 5 * 60 * 1000; 

const getRpcNEAREndpoint = (): string => {  
  switch (NEAR_NETWORK) {
    case 'mainnet':
      return 'https://api.nearblocks.io/v1';
    case 'testnet':
      return 'https://api-testnet.nearblocks.io/v1';
    default:
      return 'https://api-testnet.nearblocks.io/v1';
  }
}

const getNearBalance = async (walletAddress: string) => {
  const accountRes = await fetch(`${getRpcNEAREndpoint()}/account/${walletAddress}`, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
      },
  });

  const accountInfo = await accountRes.json()

  const balance = accountInfo.account[0].amount

  return (Number(balance)/(10**24)).toFixed(5);
}

const getNearPrice = async (): Promise<number | null> => {
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


export {
  getNearBalance,
  getNearPrice,
  getRpcNEAREndpoint
}