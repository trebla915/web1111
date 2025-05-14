"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRequiredEnvVar = exports.validateEnvVar = exports.checkRequiredEnvVars = void 0;
const error_handling_1 = require("./error-handling");
const checkRequiredEnvVars = (requiredVars) => {
    const missingVars = requiredVars.filter((envVar) => !process.env[envVar]);
    if (missingVars.length > 0) {
        error_handling_1.errorLogger.error('Missing required environment variables', { missingVars });
        return false;
    }
    return true;
};
exports.checkRequiredEnvVars = checkRequiredEnvVars;
const validateEnvVar = (envVar, validator) => {
    const value = process.env[envVar];
    if (!value) {
        error_handling_1.errorLogger.error(`Missing environment variable: ${envVar}`);
        return false;
    }
    if (!validator(value)) {
        error_handling_1.errorLogger.error(`Invalid value for environment variable: ${envVar}`);
        return false;
    }
    return true;
};
exports.validateEnvVar = validateEnvVar;
const getRequiredEnvVar = (envVar) => {
    const value = process.env[envVar];
    if (!value) {
        error_handling_1.errorLogger.error(`Missing required environment variable: ${envVar}`);
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
    return value;
};
exports.getRequiredEnvVar = getRequiredEnvVar;
