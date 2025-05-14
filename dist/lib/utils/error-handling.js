"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorLogger = void 0;
class ErrorLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;
    }
    static getInstance() {
        if (!ErrorLogger.instance) {
            ErrorLogger.instance = new ErrorLogger();
        }
        return ErrorLogger.instance;
    }
    log(severity, message, details) {
        const logEntry = {
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
    error(message, details) {
        this.log('error', message, details);
    }
    warning(message, details) {
        this.log('warning', message, details);
    }
    info(message, details) {
        this.log('info', message, details);
    }
    getLogs() {
        return [...this.logs];
    }
    clearLogs() {
        this.logs = [];
    }
}
exports.errorLogger = ErrorLogger.getInstance();
