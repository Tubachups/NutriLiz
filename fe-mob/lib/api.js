const DEFAULT_API_BASE_URL = 'https://nutriliz-be-a8351183c68f.herokuapp.com';
const DEFAULT_API_FALLBACK_URL = 'http://192.168.100.69:5000';

const normalizeBaseUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.trim().replace(/\/+$/, '');
};

export const API_BASE_URL =
  normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL) || DEFAULT_API_BASE_URL;

export const API_FALLBACK_BASE_URL =
  normalizeBaseUrl(process.env.EXPO_PUBLIC_API_FALLBACK_URL) || DEFAULT_API_FALLBACK_URL;

const API_BASE_URLS =
  API_FALLBACK_BASE_URL && API_FALLBACK_BASE_URL !== API_BASE_URL
    ? [API_BASE_URL, API_FALLBACK_BASE_URL]
    : [API_BASE_URL];

const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

const normalizePath = (path) => {
  const rawPath = String(path || '').trim();
  if (!rawPath) return '';
  return rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
};

const buildApiUrl = (baseUrl, path) => `${baseUrl}${normalizePath(path)}`;

export const apiFetch = async (path, options = {}) => {
  let lastError = null;

  for (let i = 0; i < API_BASE_URLS.length; i += 1) {
    const baseUrl = API_BASE_URLS[i];
    const isLastAttempt = i === API_BASE_URLS.length - 1;

    try {
      const response = await fetch(buildApiUrl(baseUrl, path), options);
      const shouldRetry = RETRYABLE_STATUS_CODES.has(response.status);

      if (!shouldRetry || isLastAttempt) {
        return response;
      }
    } catch (error) {
      lastError = error;
      if (isLastAttempt) {
        throw error;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('Unable to reach API server.');
};
