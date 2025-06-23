import { exchanges } from "../lib/exchanges";

export const getExchangeDisplay = (exchange: string) => {
    const exchangeData = exchanges.find(e => e.value === exchange);
    return exchangeData?.title || exchange.charAt(0).toUpperCase() + exchange.slice(1);
};

// Function to format numbers with comma separators
export function formatNumberWithCommas(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return value.toString();
    
    return num.toLocaleString('en-US');
}
