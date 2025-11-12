import { PoolState } from "@/types/pool";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { toast } from "sonner";

export const formatNumberToCurrency = (x: number): string => {
    if (x >= 1_000_000_000_000) {
      return (x / 1_000_000_000_000).toFixed(2) + "T";
    }
    if (x >= 1_000_000_000) {
      return (x / 1_000_000_000).toFixed(2) + "B"; 
    }
    if (x >= 1_000_000) {
      return (x / 1_000_000).toFixed(2) + "M";
    }
    if (x >= 1_000) {
      return (x / 1_000).toFixed(2) + "K";
    }
    if (x >= 1) {
      return x.toFixed(2); 
    }
  
    if (x > 0 && x < 0.0001) {
      return x.toExponential(3);
    }
  
    return x.toFixed(5);
};

export function formatDecimal(num: number | string, maxDecimals: number = 10): string {
    let n = typeof num === "string" ? Number(num) : num;
    if (isNaN(n)) return "NaN";
  
    if (n === 0) return "0";
  
    if (Math.abs(n) < 1e-6) {
      return n.toFixed(maxDecimals);
    }
  
    let formatted = n.toFixed(maxDecimals);
  
    return formatted.replace(/\.?0+$/, "");
}


export const parseFormattedNumber = (value: string): number => {
    if (!value) return 0;
    const cleanValue = value.replace(/,/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
};

export function formatTinyPrice(num: number): string {
    if (num === 0) return "0";
  
    let str = num.toString();
    if (str.includes("e-")) {
      const [base, expStr] = str.split("e-");
      const exp = parseInt(expStr, 10);
      const digits = base.replace(".", "");
      str = "0." + "0".repeat(exp - 1) + digits;
    }
  
    const match = str.match(/^0\.0+/);
    if (match) {
      const zeroCount = match[0].length - 2;
      const rest = str.slice(match[0].length);
  
      const restFixed = rest.slice(0, 2);
      return `0.0{${zeroCount}}${restFixed}`;
    }
  
    const [intPart, decPart = ""] = str.split(".");
    return intPart + "." + decPart.slice(0, 1);
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap === 0) return '0';
  if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`;
  if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`;
  if (marketCap >= 1e3) return `$${(marketCap / 1e3).toFixed(2)}K`;
  return `$${marketCap.toFixed(2)}`;
}


export function formatTokenPrice(price: number): string {
  if (price === 0) return '0';
  if (price < 0.000001) return formatTinyPrice(price);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toFixed(2);
}

export const hexToNumber = (hex: string) => (!hex || hex === "00" ? 0 : parseInt(hex, 16));

export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
}

export function formatNumberWithCommas(value: string | number): string {
  // Handle undefined, null, or empty values
  if (value === undefined || value === null || value === '') {
    return '0';
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  return num.toLocaleString('en-US');
}

export function truncateAddress(address: string): string {
  if (!address) return '';
  if (address.length < 20) return address;
  return address.slice(0, 6) + '...' + address.slice(-6);
}

export function formatDateToReadable(dateString: string): string {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
      return 'Invalid date';
  }
  
  const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', options);
}

export function formatNumberInput(value: string): string {
  let cleaned = value.replace(/[^\d.]/g, '');
  
  const parts = cleaned.split('.');
  if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  if (!cleaned || cleaned === '.') return '';

  const [integerPart, decimalPart] = cleaned.split('.');

  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  return decimalPart !== undefined ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}

export function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000); // seconds

  if (diff < 60) return `${diff} second${diff !== 1 ? "s" : ""} ago`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}

export interface TokenPriceData {
  priceInSol: number;
  priceInUsd: number;
}

// Calculate token price from pool state
export function calculateTokenPrice(poolState: PoolState, decimals: number, solPrice: number): TokenPriceData {
  if (!poolState?.account) {
    return { priceInSol: 0, priceInUsd: 0 };
  }

  const quote = hexToNumber(poolState?.account?.quoteReserve) / LAMPORTS_PER_SOL;
  const base = hexToNumber(poolState?.account?.baseReserve) / Math.pow(10, decimals);

  const priceInSol = base > 0 ? quote / base : 0;
  const priceInUsd = priceInSol * solPrice;

  return { priceInSol, priceInUsd };
}

// Format percentage change with color indicator
export function formatPriceChange(change: number): string {
  if (change === 0) return '0%';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

// Calculate percentage change between two prices
export function calculatePriceChangePercentage(currentPrice: number, previousPrice: number): number {
  if (previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

