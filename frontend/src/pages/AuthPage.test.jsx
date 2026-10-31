import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthPage } from './AuthPage';
import { getPasswordRuleResults, registerSchema } from './authValidation';

const authActions = vi.hoisted(() => ({
  login: vi.fn(),
  registerAccount: vi.fn(),
  startDemo: vi.fn()
}));

vi.mock('../context/DataContext', () => ({
  useData: () => ({ ...authActions, isAuthenticated: false })
}));

function AuthRouteHarness() {
  const { pathname } = useLocation();
  return (
    <>
      <AuthPage mode={pathname === '/register' ? 'register' : 'login'} />
      <output data-testid="current-path">{pathname}</output>
    </>
  );
}

function renderAuth(path = '/login') {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="*" element={<AuthRouteHarness />} />
      </Routes>
    </MemoryRouter>
  );
}

function validRegistration(overrides = {}) {
  return {
    fullName: 'Alex Morgan',
    companyName: '',
    role: 'customer',
    email: 'alex@example.com',
    password: 'Abcdefgh1!',
    confirmPassword: 'Abcdefgh1!',
    acceptedTerms: true,
    ...overrides
  };
}

describe('Brightloop auth page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authActions.login.mockResolvedValue({ role: 'customer' });
    authActions.registerAccount.mockResolvedValue({ role: 'customer' });
  });

  it('uses the same password rules for the live checklist and signup schema', () => {
    const missingSpecial = validRegistration({ password: 'Abcdefgh1', confirmPassword: 'Abcdefgh1' });
    const tooShort = validRegistration({ password: 'Abcdef1!', confirmPassword: 'Abcdef1!' });
    const valid = validRegistration();

    const missingSpecialResult = registerSchema.safeParse(missingSpecial);
    expect(missingSpecialResult.success).toBe(false);
    expect(missingSpecialResult.error.issues.some(issue => issue.message === 'One special character')).toBe(true);
    const tooShortResult = registerSchema.safeParse(tooShort);
    expect(tooShortResult.success).toBe(false);
    expect(tooShortResult.error.issues.some(issue => issue.message === '9 or more characters')).toBe(true);
    expect(registerSchema.safeParse(valid).success).toBe(true);
    expect(registerSchema.safeParse(validRegistration({ password: 'Abcdefg1!', confirmPassword: 'Abcdefg1!' })).success).toBe(true);
    expect(getPasswordRuleResults('Abcdefgh1', 'Abcdefgh1').find(rule => rule.id === 'special').passed).toBe(false);
    expect(getPasswordRuleResults('Abcdefgh1!', 'Abcdefgh1!').every(rule => rule.passed)).toBe(true);
    expect(getPasswordRuleResults('Abcdef1!', 'Abcdef1!').find(rule => rule.id === 'length').passed).toBe(false);
  });

  it('updates the password checklist and progress while typing', async () => {
    renderAuth('/register');

    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Abcdefgh1' } });
    expect(screen.getByRole('progressbar', { name: 'Password requirements met' })).toHaveAttribute('aria-valuenow', '3');
    expect(screen.getByLabelText('One special character: not met')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Abcdefgh1' } });
    expect(screen.getByRole('progressbar', { name: 'Password requirements met' })).toHaveAttribute('aria-valuenow', '4');
    expect(screen.getByLabelText('Passwords match: met')).toBeInTheDocument();
  });

  it('switches auth tabs with arrow keys and keeps the selected tab focused', async () => {
    renderAuth('/login');
    const signInTab = screen.getByRole('tab', { name: 'Sign in' });
    signInTab.focus();
    fireEvent.keyDown(signInTab, { key: 'ArrowRight' });

    const registerTab = await screen.findByRole('tab', { name: 'Create account' });
    await waitFor(() => expect(registerTab).toHaveFocus());
    expect(registerTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('current-path')).toHaveTextContent('/register');
  });

  it('shows an inline duplicate email error for an existing demo account', async () => {
    authActions.registerAccount.mockRejectedValueOnce({
      message: 'An account with this email already exists.',
      data: { email: ['An account with this email already exists.'] }
    });
    renderAuth('/register');
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Alex Morgan' } });
    fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'admin@brightloop.io' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Abcdefgh1!' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Terms of Service/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Create your account' }));

    expect(await screen.findByText('An account with this email already exists.')).toBeInTheDocument();
    expect(screen.getByLabelText('Work email')).toHaveAttribute('aria-invalid', 'true');
    expect(authActions.registerAccount).toHaveBeenCalledWith({
      email: 'admin@brightloop.io',
      password: 'Abcdefgh1!',
      name: 'Alex Morgan',
      companyName: '',
      role: 'customer'
    });
  });

  it('starts the selected seeded demo role from a role chip', () => {
    renderAuth('/login');
    fireEvent.click(screen.getByRole('button', { name: /Staff: Work with customers/ }));

    expect(authActions.startDemo).toHaveBeenCalledWith('staff');
    expect(screen.getByTestId('current-path')).toHaveTextContent('/app');
  });

  it('submits sign-in credentials and enters the authenticated app', async () => {
    renderAuth('/login');
    fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in to Brightloop' }));

    await waitFor(() => expect(authActions.login).toHaveBeenCalledWith({
      email: 'alex@example.com',
      password: 'Password123!',
      rememberMe: false
    }));
    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/app'));
  });

  it('registers new account details with the backend auth action', async () => {
    renderAuth('/register');
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Alex Morgan' } });
    fireEvent.change(screen.getByLabelText('Work email'), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Abcdefgh1!' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Terms of Service/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Create your account' }));

    await waitFor(() => expect(authActions.registerAccount).toHaveBeenCalledWith({
      email: 'alex@example.com',
      password: 'Abcdefgh1!',
      name: 'Alex Morgan',
      companyName: '',
      role: 'customer'
    }));
    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/app'));
  });

  it('requires administrator provisioning for a staff account', async () => {
    renderAuth('/register');
    fireEvent.click(screen.getByRole('radio', { name: /Staff/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Create your account' }));

    expect(await screen.findByText(/Staff accounts must be created by an administrator/)).toBeInTheDocument();
    expect(authActions.registerAccount).not.toHaveBeenCalled();
    expect(screen.getByTestId('current-path')).toHaveTextContent('/register');
  });
});
