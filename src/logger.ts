/**
 * Logger interface definition
 */

export interface Logger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  success?: (message: string, ...args: unknown[]) => void;
}

/**
 * Default logger implementation
 */
const defaultLogger: Logger = console;

// The current logger instance (starts with default implementation)
let currentLogger: Logger = defaultLogger;

/**
 * Get the current logger instance
 */
export const logger: Logger = {
  debug: (message: string, ...args: unknown[]) => currentLogger.debug(message, ...args),
  info: (message: string, ...args: unknown[]) => currentLogger.info(message, ...args),
  error: (message: string, ...args: unknown[]) => currentLogger.error(message, ...args),
  warn: (message: string, ...args: unknown[]) => currentLogger.warn(message, ...args),
  success: (message: string, ...args: unknown[]) => (currentLogger.success || currentLogger.info)(message, ...args),
};

/**
 * Set a custom logger implementation
 * @param customLogger The custom logger implementation to use
 */
export const setLogger = (customLogger: Logger): void => {
  currentLogger = customLogger;
};

/**
 * Reset to the default logger implementation
 */
export const resetLogger = (): void => {
  currentLogger = defaultLogger;
};
