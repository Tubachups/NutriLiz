const DEFAULT_API_BASE_URL = 'https://nutriliz-backend-93d928b7d5d6.herokuapp.com/';

const normalizeBaseUrl = (value) => {
  if (!value || typeof value !== 'string') return '';
  return value.trim().replace(/\/+$/, '');
};

export const API_BASE_URL =
  normalizeBaseUrl(process.env.EXPO_PUBLIC_API_BASE_URL) || DEFAULT_API_BASE_URL;

const normalizePath = (path) => {
  const rawPath = String(path || '').trim();
  if (!rawPath) return '';
  return rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
};

const buildApiUrl = (baseUrl, path) => `${baseUrl}${normalizePath(path)}`;

export const apiFetch = async (path, options = {}) => {
  try {
    const response = await fetch(buildApiUrl(API_BASE_URL, path), options);
    return response;
  } catch (error) {
    throw error;
  }
};