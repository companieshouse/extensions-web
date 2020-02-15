/**
 * Get's an environment variable. If the env var is not set and a default value is not
 * provided, then it is assumed it is a mandatory requirement and an error will be
 * thrown.
 */
const getEnvironmentValue = (key: string, defaultValue?: any): string => {
  const isMandatory: boolean = !defaultValue;
  const value: string = process.env[key] || "";

  if (!value && isMandatory) {
    throw new Error(`Please set the environment variable "${key}"`);
  }

  return value || defaultValue as string;
};

export const DEFAULT_SESSION_EXPIRATION = getEnvironmentValue("DEFAULT_SESSION_EXPIRATION");

export const COOKIE_SECRET = getEnvironmentValue("COOKIE_SECRET");

export const CACHE_SERVER = getEnvironmentValue("CACHE_SERVER");

export const COOKIE_NAME = getEnvironmentValue("COOKIE_NAME");

export const COOKIE_DOMAIN = getEnvironmentValue("COOKIE_DOMAIN", ".companieshouse.gov.uk");

export const COOKIE_SECURE_ONLY = getEnvironmentValue("COOKIE_SECURE_ONLY", "0") === "1";

export const PIWIK_URL = getEnvironmentValue("PIWIK_URL");

export const PIWIK_SITE_ID = getEnvironmentValue("PIWIK_SITE_ID");

export const API_URL  = getEnvironmentValue("API_LOCAL_URL");

export const EXTENSIONS_API_URL = getEnvironmentValue("EXTENSIONS_API_URL");

export const EXTENSIONS_PROCESSOR_API_URL = getEnvironmentValue("EXTENSIONS_PROCESSOR_API_URL");

export const MAXIMUM_EXTENSION_REQUESTS_PER_DAY = getEnvironmentValue("MAXIMUM_EXTENSION_REQUESTS_PER_DAY");

export const FEATURE_REQUEST_COUNT = getEnvironmentValue("FEATURE_REQUEST_COUNT");

export const MAX_FILE_SIZE_BYTES = getEnvironmentValue("MAX_FILE_SIZE_BYTES");
