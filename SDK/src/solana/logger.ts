import { LogLevel } from './types';

export class Logger {
  constructor(private level: LogLevel = LogLevel.INFO) { }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level <= this.level) {
      const timestamp = new Date().toISOString();
      const levelStr = LogLevel[level];
      const contextStr = context ? ` ${JSON.stringify(context)}` : '';
      console.log(`[${timestamp}] ${levelStr}: ${message}${contextStr}`);
    }
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const logger = new Logger(LogLevel.INFO);
