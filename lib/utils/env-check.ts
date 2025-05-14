import { errorLogger } from './error-handling';

export const checkRequiredEnvVars = (requiredVars: string[]): boolean => {
  if (!requiredVars || !Array.isArray(requiredVars) || requiredVars.length === 0) {
    errorLogger.error('Invalid or empty required environment variables list');
    return false;
  }

  const missingVars = requiredVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingVars.length > 0) {
    errorLogger.error('Missing required environment variables', {
      missingVars,
      message: `The following environment variables are required but missing: ${missingVars.join(', ')}`
    });
    return false;
  }

  return true;
};

export const validateEnvVar = (envVar: string, validator: (value: string) => boolean): boolean => {
  const value = process.env[envVar];
  
  if (!value) {
    errorLogger.error(`Missing environment variable: ${envVar}`);
    return false;
  }

  if (!validator(value)) {
    errorLogger.error(`Invalid value for environment variable: ${envVar}`);
    return false;
  }

  return true;
};

export const getRequiredEnvVar = (envVar: string): string => {
  const value = process.env[envVar];
  
  if (!value) {
    errorLogger.error(`Missing required environment variable: ${envVar}`);
    throw new Error(`Missing required environment variable: ${envVar}`);
  }

  return value;
}; 