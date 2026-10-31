const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'
).replace(/\/$/, '');
const ACCESS_TOKEN_KEY = 'brightloop_token';
const REFRESH_TOKEN_KEY = 'brightloop_refresh_token';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getToken(key) {
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

export function getAccessToken() {
  return getToken(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
  return getToken(REFRESH_TOKEN_KEY);
}

export function saveAuthTokens({ access, refresh }, rememberMe = false) {
  clearAuthTokens();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, access);
  storage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

export const getAuthHeaders = (token = getAccessToken()) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {})
});

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.detail
      || data.error
      || data.non_field_errors?.[0]
      || Object.values(data).find(value => Array.isArray(value))?.[0]
      || `API request failed (${response.status})`;
    throw new ApiError(String(message), response.status, data);
  }
  return data;
}

async function sendRequest(endpoint, method, body, token) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: getAuthHeaders(token),
    ...(body === null ? {} : { body: JSON.stringify(body) })
  });
  return parseResponse(response);
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  try {
    const tokens = await sendRequest('/auth/refresh', 'POST', { refresh }, null);
    const persistent = Boolean(localStorage.getItem(REFRESH_TOKEN_KEY));
    const nextRefresh = tokens.refresh || refresh;
    saveAuthTokens({ access: tokens.access, refresh: nextRefresh }, persistent);
    return tokens.access;
  } catch (error) {
    clearAuthTokens();
    console.warn('[API] Token refresh failed:', error.message);
    return null;
  }
}

export async function apiRequest(endpoint, method = 'GET', body = null, { auth = true } = {}) {
  try {
    return await sendRequest(endpoint, method, body, auth ? getAccessToken() : null);
  } catch (error) {
    if (!auth || error.status !== 401 || endpoint === '/auth/refresh') {
      console.warn(`[API] Backend request failed (${endpoint}):`, error.message);
      throw error;
    }

    const access = await refreshAccessToken();
    if (!access) {
      console.warn(`[API] Backend request failed (${endpoint}):`, error.message);
      throw error;
    }
    return sendRequest(endpoint, method, body, access);
  }
}
