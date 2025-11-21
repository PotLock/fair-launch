/**
 * Simple logging utility for performance tracking
 */

interface LogContext {
  endpoint?: string;
  mintAddress?: string;
  tokenId?: string;
  rpcCalls?: number;
  cacheHit?: boolean;
  duration?: number | string;
  tokenCount?: number;
  limit?: number;
  holderCount?: number;
  [key: string]: any; // Allow additional properties
}

/**
 * Log performance metrics
 */
export function logPerformance(message: string, context: LogContext = {}) {
  const timestamp = new Date().toISOString();
  const contextStr = Object.entries(context)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ');
  
  console.log(`[PERF] ${timestamp} ${message} ${contextStr}`);
}

/**
 * Log endpoint request start
 */
export function logRequestStart(endpoint: string, params?: Record<string, any>) {
  logPerformance(`Request started: ${endpoint}`, { endpoint, ...params });
}

/**
 * Log endpoint request end with duration
 */
export function logRequestEnd(endpoint: string, duration: number, success: boolean = true, context?: LogContext) {
  logPerformance(`Request ${success ? 'completed' : 'failed'}: ${endpoint}`, {
    endpoint,
    duration: duration,
    ...context,
  });
}

/**
 * Log RPC call
 */
export function logRpcCall(operation: string, mintAddress?: string, cacheHit: boolean = false) {
  logPerformance(`RPC call: ${operation}`, {
    rpcCalls: 1,
    mintAddress,
    cacheHit,
  });
}

/**
 * Log cache hit/miss
 */
export function logCache(cacheKey: string, hit: boolean) {
  logPerformance(`Cache ${hit ? 'HIT' : 'MISS'}: ${cacheKey}`, {
    cacheHit: hit,
  });
}

/**
 * Log error with context
 */
export function logError(message: string, error: Error, context?: LogContext) {
  const timestamp = new Date().toISOString();
  console.error(`[ERROR] ${timestamp} ${message}`, {
    error: error.message,
    stack: error.stack,
    ...context,
  });
}

