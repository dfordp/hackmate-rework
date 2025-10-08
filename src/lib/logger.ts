/**
 * Logger utility for consistent logging across the application
 * Replaces console.log statements with proper logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

type LogContext = Record<string, unknown>;

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
}

// Sensitive keys that should be redacted from logs
const SENSITIVE_KEYS = [
  'password', 'passwd', 'pwd', 'secret', 'token', 'key', 'apiKey', 'api_key',
  'auth', 'authorization', 'bearer', 'jwt', 'session', 'cookie', 'ssn', 'social',
  'credit', 'card', 'cvv', 'pin', 'otp', 'verification', 'private', 'confidential',
  'sensitive', 'personal', 'email', 'phone', 'address', 'dob', 'birth', 'ssn',
  'tax', 'financial', 'bank', 'account', 'routing', 'swift', 'iban', 'crypto',
  'wallet', 'seed', 'mnemonic', 'privateKey', 'private_key', 'secretKey', 'secret_key'
];

// Recursively scrub sensitive data from objects
function scrubSensitiveData(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) {
    return '[MAX_DEPTH_REACHED]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Check if the string itself looks like sensitive data
    if (obj.length > 50 && /^[A-Za-z0-9+/=]+$/.test(obj)) {
      return '[POTENTIAL_ENCODED_DATA]';
    }
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => scrubSensitiveData(item, depth + 1));
  }

  const scrubbed: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive patterns
    const isSensitive = SENSITIVE_KEYS.some(sensitiveKey => 
      lowerKey.includes(sensitiveKey) || sensitiveKey.includes(lowerKey)
    );

    if (isSensitive) {
      scrubbed[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      scrubbed[key] = scrubSensitiveData(value, depth + 1);
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context && { context: scrubSensitiveData(context) as LogContext }),
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // In production, only log warnings and errors
    return level === 'warn' || level === 'error';
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatMessage(level, message, context);
    
    if (this.isDevelopment) {
      // In development, use console with colors
      const colors = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      };
      const reset = '\x1b[0m';
      
      console.log(`${colors[level]}[${level.toUpperCase()}]${reset} ${message}`, 
        context ? context : '');
    } else {
      // In production, use structured logging
      console.log(JSON.stringify(logEntry));
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  // Convenience methods for common use cases
  apiRequest(method: string, url: string, statusCode?: number, duration?: number): void {
    this.info(`API ${method} ${url}`, {
      method,
      url: this.sanitizeUrl(url),
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  // Sanitize URLs to remove sensitive query parameters
  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth', 'session'];
      
      sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      });
      
      return urlObj.toString();
    } catch {
      // If URL parsing fails, return as-is
      return url;
    }
  }

  databaseQuery(query: string, duration?: number): void {
    this.debug(`Database query executed`, {
      query: query.substring(0, 100) + (query.length > 100 ? '...' : ''),
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  userAction(userId: string, action: string, context?: LogContext): void {
    this.info(`User action: ${action}`, {
      userId,
      action,
      ...context,
    });
  }

  redisOperation(operation: string, key?: string, success?: boolean): void {
    this.debug(`Redis ${operation}`, {
      operation,
      key: key ? this.sanitizeRedisKey(key) : undefined,
      success,
    });
  }

  // Sanitize Redis keys to remove sensitive data
  private sanitizeRedisKey(key: string): string {
    // Remove or mask sensitive patterns in Redis keys
    return key.replace(/(password|secret|token|key|auth|session)=[^:&]+/gi, '$1=[REDACTED]');
  }

  // Security-specific logging method
  securityEvent(event: string, userId?: string, details?: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      event,
      userId: userId || 'unknown',
      timestamp: new Date().toISOString(),
      ...details,
    });
  }

  // Performance monitoring
  performanceMetric(operation: string, duration: number, threshold: number = 1000): void {
    const level = duration > threshold ? 'warn' : 'debug';
    this.log(level, `Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      threshold: `${threshold}ms`,
      slow: duration > threshold,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export the class for testing
export { Logger };
