// API client for Brightloop Subscription Management System
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const getAuthHeaders = () => {
  const token = localStorage.getItem('brightloop_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export async function apiRequest(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: getAuthHeaders(),
      ...(body ? { body: JSON.stringify(body) } : {})
    };
    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || errData.error || errData.message || `API Error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[API] Backend request failed (${endpoint}):`, err.message);
    throw err;
  }
}
