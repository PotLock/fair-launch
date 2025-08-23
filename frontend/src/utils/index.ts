import { exchanges } from "../lib/exchanges";
import { toast } from "react-hot-toast";
import { tokenTemplates } from "../lib/templates";
import dayjs from 'dayjs';
import { pricingOptions } from "../lib/pricings";

export const getExchangeDisplay = (exchange: string) => {
  const exchangeData = exchanges.find(e => e.value === exchange);
  return exchangeData?.title || exchange.charAt(0).toUpperCase() + exchange.slice(1);
};

export const getTemplateDisplay = (template: string) => {
  const templateData = tokenTemplates.find(t => t.key === template);
  return templateData?.label || template.charAt(0).toUpperCase() + template.slice(1);
};

export const getPricingDisplay = (pricing: string) => {
  const pricingData = pricingOptions.find(p => p.key === pricing);
  return pricingData?.title || pricing.charAt(0).toUpperCase() + pricing.slice(1);
};

export function formatNumberWithCommas(value: string | number): string {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return value.toString();
    
    return num.toLocaleString('en-US');
}

export function truncateAddress(address: string): string {
    if (!address) return '';
    if (address.length < 20) return address;
    return address.slice(0, 6) + '...' + address.slice(-6);
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

export function getVestingData(allocation: any): Array<Record<string, any>> {
  const {
    vesting: {
      startTimeDate,
      cliffEndDate,
      endDate,
      interval,
    } = {},
    totalTokens,
    wallet,
  } = allocation || {};
  if (!startTimeDate || !cliffEndDate || !endDate || !interval || !totalTokens) return [];
  const start = dayjs(startTimeDate);
  const cliff = dayjs(cliffEndDate);
  const end = dayjs(endDate);
  // interval là số giây, convert sang ms
  const intervalMs = Number(interval) * 1000;
  const total = Number(totalTokens);
  if (!intervalMs || !total) return [];
  let data: Array<Record<string, any>> = [];
  for (let t = start; t.isBefore(end) || t.isSame(end); t = t.add(intervalMs, 'ms')) {
    let unlocked = 0;
    if (t.isAfter(cliff) || t.isSame(cliff)) {
      unlocked = total * (t.valueOf() - cliff.valueOf()) / (end.valueOf() - cliff.valueOf());
      if (unlocked > total) unlocked = total;
    }
    data.push({
      time: t.format('YYYY-MM-DD'),
      [wallet]: Math.floor(unlocked),
    });
  }
  return data;
}

export function mergeVestingData(allocations: any[]): Array<Record<string, any>> {
  const allDates = new Set<string>();
  const dataByWallet: Record<string, Record<string, number>> = {};
  allocations.forEach((a: any) => {
    const arr = getVestingData(a);
    if (!a.wallet) return;
    dataByWallet[a.wallet] = {};
    arr.forEach((d: Record<string, any>) => {
      allDates.add(d.time);
      dataByWallet[a.wallet][d.time] = d[a.wallet];
    });
  });
  const sortedDates = Array.from(allDates).sort();
  return sortedDates.map((date: string) => {
    const row: Record<string, any> = { time: date };
    allocations.forEach((a: any) => {
      if (!a.wallet) return;
      row[a.wallet] = dataByWallet[a.wallet][date] ?? 0;
    });
    return row;
  });
}

export function formatVestingInfo(vesting: any, percentage: number) {
    if (!vesting) return '-';
    // Convert seconds to days
    const cliffDays = Math.floor(Number(vesting.cliffPeriod) / (86400 * 1000));
    const durationDays = Math.floor(Number(vesting.duration) / (86400 * 1000));
    const intervalDays = Math.floor(Number(vesting.interval) / (86400 * 1000));
    let result = '';
    if (cliffDays === 0) {
        result += `${percentage}% at TGE`;
    } else {
        result += `${cliffDays} day cliff, then `;
    }
    if (intervalDays > 0 && durationDays > 0) {
        // Calculate how many intervals
        const intervals = Math.floor(durationDays / intervalDays);
        let intervalLabel = 'monthly';
        if (intervalDays >= 90 && intervalDays < 120) intervalLabel = 'quarterly';
        else if (intervalDays >= 28 && intervalDays < 32) intervalLabel = 'monthly';
        else if (intervalDays >= 7 && intervalDays < 10) intervalLabel = 'weekly';
        else if (intervalDays >= 365) intervalLabel = 'yearly';
        result += `then ${(percentage / intervals).toFixed(2)}% ${intervalLabel}`;
    }
    return result;
}

export const formatNumberToCurrency = (x: number) => {
  switch (true) {
    case x >= 1000:
      const kValue = x / 1000;
      return `${kValue.toFixed(3)}K`;
    case x >= 1000000:
      const mValue = x / 1000;
      return `${mValue}M`;
    case x >= 1000000000:
      const bValue = x / 1000;
      return `${bValue}B`;
    default:
      return x.toFixed(3);
  }
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