import { exchanges } from "../lib/exchanges";

export const getExchangeDisplay = (exchange: string) => {
    const exchangeData = exchanges.find(e => e.value === exchange);
    return exchangeData?.title || exchange.charAt(0).toUpperCase() + exchange.slice(1);
};