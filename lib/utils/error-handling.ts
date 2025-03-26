type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorLog {
  message: string;
  severity: ErrorSeverity;
  timestamp: string;
  details?: unknown;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private logs: ErrorLog[] = [];
  private readonly maxLogs = 100;

  private constructor() {}

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private log(severity: ErrorSeverity, message: string, details?: unknown) {
    const logEntry: ErrorLog = {
      message,
      severity,
      timestamp: new Date().toISOString(),
      details,
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // In development, also log to console
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = severity === 'error' ? 'error' : severity === 'warning' ? 'warn' : 'info';
      console[consoleMethod](message, details || '');
    }
  }

  error(message: string, details?: unknown) {
    this.log('error', message, details);
  }

  warning(message: string, details?: unknown) {
    this.log('warning', message, details);
  }

  info(message: string, details?: unknown) {
    this.log('info', message, details);
  }

  getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const errorLogger = ErrorLogger.getInstance(); 