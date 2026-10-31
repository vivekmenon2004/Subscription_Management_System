import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  apiRequest,
  clearAuthTokens,
  getAccessToken,
  saveAuthTokens
} from './api';

const jsonResponse = (status, data) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data
});

function createStorage() {
  const entries = new Map();
  return {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: key => entries.delete(key),
    clear: () => entries.clear()
  };
}

describe('JWT API client', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorage());
    vi.stubGlobal('sessionStorage', createStorage());
    vi.stubGlobal('fetch', vi.fn());
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('stores tokens persistently only when remember-me is selected', () => {
    saveAuthTokens({ access: 'persistent-access', refresh: 'persistent-refresh' }, true);
    expect(localStorage.getItem('brightloop_token')).toBe('persistent-access');
    expect(sessionStorage.getItem('brightloop_token')).toBeNull();

    saveAuthTokens({ access: 'session-access', refresh: 'session-refresh' });
    expect(localStorage.getItem('brightloop_token')).toBeNull();
    expect(sessionStorage.getItem('brightloop_token')).toBe('session-access');
    clearAuthTokens();
    expect(getAccessToken()).toBeNull();
  });

  it('refreshes an expired access token and retries the original request', async () => {
    saveAuthTokens({ access: 'expired-access', refresh: 'valid-refresh' });
    fetch
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Token is invalid or expired' }))
      .mockResolvedValueOnce(jsonResponse(200, {
        access: 'new-access',
        refresh: 'rotated-refresh'
      }))
      .mockResolvedValueOnce(jsonResponse(200, { id: 8 }));

    const response = await apiRequest('/auth/me');

    expect(response).toEqual({ id: 8 });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer expired-access');
    expect(fetch.mock.calls[1][1].headers.Authorization).toBeUndefined();
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer new-access');
    expect(sessionStorage.getItem('brightloop_refresh_token')).toBe('rotated-refresh');
  });

  it('clears tokens and surfaces the original authorization error when refresh fails', async () => {
    saveAuthTokens({ access: 'expired-access', refresh: 'expired-refresh' });
    fetch
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Not authenticated' }))
      .mockResolvedValueOnce(jsonResponse(401, { detail: 'Refresh token is invalid' }));

    await expect(apiRequest('/auth/me')).rejects.toMatchObject({
      message: 'Not authenticated',
      status: 401
    });
    expect(getAccessToken()).toBeNull();
  });

  it('keeps API validation details available to the auth form', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(400, {
      email: ['An account with this email already exists.']
    }));

    await expect(
      apiRequest('/auth/register', 'POST', {}, { auth: false })
    ).rejects.toMatchObject({
      message: 'An account with this email already exists.',
      status: 400,
      data: { email: ['An account with this email already exists.'] }
    });
  });
});
