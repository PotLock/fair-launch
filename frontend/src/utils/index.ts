import { exchanges } from "../lib/exchanges";
import { toast } from "react-hot-toast";

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

export function truncateAddress(address: string): string {
    if (!address) return '';
    return address.slice(0, 8) + '...' + address.slice(-8);
}

export function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
}

export function calculateTimeSinceCreation(createdOn: string, currentTime?: Date): string {
    const createdDate = new Date(createdOn);
    const now = currentTime || new Date();
    const diffInMs = now.getTime() - createdDate.getTime();
    
    if (diffInMs < 0) {
        return "-";
    }
    
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    const days = diffInDays % 30;
    const hours = diffInHours % 24;
    const minutes = diffInMinutes % 60;
    const seconds = diffInSeconds % 60;
    
    return `${days}d | ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
}