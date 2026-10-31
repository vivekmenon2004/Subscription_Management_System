import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import LandingPage from './LandingPage';

function renderLandingPage() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LandingPage />
    </MemoryRouter>
  );
}

describe('Brightloop landing page', () => {
  it('presents the public landing page and account entry points', () => {
    renderLandingPage();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Recurring revenue,\s*without the busywork/);
    expect(screen.getAllByRole('link', { name: 'Sign in', exact: true })[0]).toHaveAttribute('href', '/login');
    expect(screen.getAllByRole('link', { name: /Start free trial/ })[0]).toHaveAttribute('href', '/register');
    expect(screen.getByRole('heading', { name: /From “did anyone remember\?”/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Know where your\s*revenue stands/ })).toBeInTheDocument();
  });

  it('updates plan prices when switching to annual billing', () => {
    renderLandingPage();

    expect(screen.getByText('₹2,499')).toBeInTheDocument();
    expect(screen.getByText('₹6,999')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Annual' }));

    expect(screen.getByText('₹1,999')).toBeInTheDocument();
    expect(screen.getByText('₹5,599')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Annual' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('changes the workspace preview when selecting a different role', () => {
    renderLandingPage();
    const roleTabs = screen.getByRole('tablist', { name: 'Workspace role' });
    fireEvent.click(within(roleTabs).getByRole('tab', { name: 'Customer' }));

    expect(screen.getByRole('tabpanel')).toHaveTextContent('A better experience after checkout.');
    expect(within(roleTabs).getByRole('tab', { name: 'Customer' })).toHaveAttribute('aria-selected', 'true');
  });

  it('allows exploring subscription lifecycle states', () => {
    renderLandingPage();
    fireEvent.click(screen.getByRole('button', { name: 'Set subscription status to Quotation' }));

    const preview = screen.getByLabelText('Interactive subscription management preview');
    expect(preview).toHaveTextContent('SUB-000412');
    expect(preview.querySelector('.hero-product__heading .status-chip')).toHaveTextContent('Quotation');
    expect(screen.getByRole('button', { name: 'Set subscription status to Quotation' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('opens the compact navigation menu when requested', () => {
    renderLandingPage();
    const menuButton = screen.getByRole('button', { name: 'Open navigation' });

    fireEvent.click(menuButton);

    expect(screen.getByRole('button', { name: 'Close navigation' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Main navigation' }).className).toContain('is-open');
  });
});
