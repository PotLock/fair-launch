
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