/**
 * Centralized logging utility
 * Thay thế console.log với system có level và có thể disable ở production
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static instance: Logger;
  private currentLevel: LogLevel;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.currentLevel = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLevel(level: LogLevel) {
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatMessage(level: string, module: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${module}] ${message}`;
  }

  debug(module: string, message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', module, message), ...args);
    }
  }

  info(module: string, message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', module, message), ...args);
    }
  }

  warn(module: string, message: string, ...args: any[]) {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', module, message), ...args);
    }
  }

  error(module: string, message: string, error?: Error, ...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', module, message), error || '', ...args);
    }
  }

  // Performance logging
  time(module: string, label: string) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(`[${module}] ${label}`);
    }
  }

  timeEnd(module: string, label: string) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(`[${module}] ${label}`);
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions for common use cases
export const log = {
  debug: (module: string, message: string, ...args: any[]) => logger.debug(module, message, ...args),
  info: (module: string, message: string, ...args: any[]) => logger.info(module, message, ...args),
  warn: (module: string, message: string, ...args: any[]) => logger.warn(module, message, ...args),
  error: (module: string, message: string, error?: Error, ...args: any[]) => logger.error(module, message, error, ...args),
  time: (module: string, label: string) => logger.time(module, label),
  timeEnd: (module: string, label: string) => logger.timeEnd(module, label),
};