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


// Token price calculation utilities
export function calculateTokenPrice(sqrtPrice: string): number {
  try {
    // Validate input
    if (!sqrtPrice || sqrtPrice === "00" || sqrtPrice === "0") {
      return 0;
    }

    // Convert hex string to decimal
    const sqrtPriceDecimal = parseInt(sqrtPrice, 16);
    
    // Check if conversion was successful
    if (isNaN(sqrtPriceDecimal) || sqrtPriceDecimal === 0) {
      return 0;
    }
    
    // Apply the DBC formula: price = (sqrtPrice / 2^64)^2
    const price = Math.pow(sqrtPriceDecimal / Math.pow(2, 64), 2);
    
    // Handle edge cases
    if (!isFinite(price) || price < 0) {
      return 0;
    }
    
    return price;
  } catch (error) {
    console.error('Error calculating token price:', error);
    return 0;
  }
}

export function formatTokenPrice(price: number): string {
  if (price === 0) return '0';
  if (price < 0.000001) return price.toExponential(2);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toFixed(2);
}

export function calculateMarketCap(price: number, totalSupply: string, decimals: number): number {
  try {
    const supply = parseFloat(totalSupply);
    
    // Calculate market cap
    const marketCap = price * supply;
    
    // Handle edge cases
    if (!isFinite(marketCap) || marketCap < 0) {
      return 0;
    }
    
    return marketCap;
  } catch (error) {
    console.error('Error calculating market cap:', error);
    return 0;
  }
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
