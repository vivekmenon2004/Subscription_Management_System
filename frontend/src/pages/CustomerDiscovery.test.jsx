import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TrendingPlansCarousel } from '../components/TrendingPlansCarousel';
import { AvailableProductsSection } from '../components/AvailableProductsSection';
import { CustomerHomePage } from './CustomerHomePage';
import { DataProvider } from '../context/DataContext';

vi.mock('../services/api', () => ({
  apiRequest: vi.fn().mockResolvedValue([]),
  clearAuthTokens: vi.fn(),
  getAccessToken: vi.fn(() => null),
  getRefreshToken: vi.fn(() => null),
  saveAuthTokens: vi.fn(),
}));

const MOCK_PLANS = [
  {
    id: 1,
    name: 'Standard Monthly Plan',
    price: '4999.00',
    billing_period: 'monthly',
    is_trending: true,
    trending_badge: 'Trending',
    description: 'Core cloud ERP and invoicing tools.',
    features: ['General Ledger', 'Invoicing', '10 Users'],
    product: {
      id: 1,
      name: 'Brightloop Cloud ERP',
      type: 'Software',
      icon_url: 'https://example.com/icon.png'
    }
  },
  {
    id: 2,
    name: 'Enterprise Annual Plan',
    price: '49999.00',
    billing_period: 'yearly',
    is_trending: true,
    trending_badge: 'Popular',
    description: 'Complete enterprise grade operations.',
    features: ['All Pro Features', 'Dedicated Support'],
    product: {
      id: 1,
      name: 'Brightloop Cloud ERP',
      type: 'Software',
      icon_url: 'https://example.com/icon.png'
    }
  }
];

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Brightloop Cloud ERP',
    type: 'Software',
    sales_price: '1000.00',
    starting_price: '1000.00',
    plans_count: 2,
    description: 'Enterprise resource planning and ledger.',
    already_subscribed: true
  },
  {
    id: 2,
    name: '24/7 SLA Protection',
    type: 'Service',
    sales_price: '3000.00',
    starting_price: '3000.00',
    plans_count: 1,
    description: 'Guaranteed 1-hour engineering response.',
    already_subscribed: false
  }
];

describe('Customer Discovery & Trending Plans UI', () => {
  it('renders trending plans auto carousel with pricing and features', () => {
    const handleSelectPlan = vi.fn();
    render(
      <TrendingPlansCarousel
        plans={MOCK_PLANS}
        onSelectPlan={handleSelectPlan}
      />
    );

    expect(screen.getByText('Trending Subscription Plans')).toBeInTheDocument();
    expect(screen.getByText('Standard Monthly Plan')).toBeInTheDocument();
    expect(screen.getByText('Enterprise Annual Plan')).toBeInTheDocument();
    expect(screen.getByText('4,999')).toBeInTheDocument();
    expect(screen.getByText('49,999')).toBeInTheDocument();
    expect(screen.getByText('General Ledger')).toBeInTheDocument();

    const exploreButtons = screen.getAllByRole('button', { name: /Explore Plan/i });
    expect(exploreButtons.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(exploreButtons[0]);
    expect(handleSelectPlan).toHaveBeenCalled();
  });

  it('filters and searches available applications', () => {
    const handleViewPlans = vi.fn();
    render(
      <AvailableProductsSection
        products={MOCK_PRODUCTS}
        isLoading={false}
        onViewProductPlans={handleViewPlans}
      />
    );

    expect(screen.getByText('Available Applications & Services')).toBeInTheDocument();
    expect(screen.getByText('Brightloop Cloud ERP')).toBeInTheDocument();
    expect(screen.getByText('24/7 SLA Protection')).toBeInTheDocument();
    expect(screen.getByText('Subscribed')).toBeInTheDocument();

    // Search query test
    const searchInput = screen.getByPlaceholderText(/Search products/i);
    fireEvent.change(searchInput, { target: { value: 'SLA' } });

    expect(screen.queryByText('Brightloop Cloud ERP')).not.toBeInTheDocument();
    expect(screen.getByText('24/7 SLA Protection')).toBeInTheDocument();

    // Category filter test
    fireEvent.change(searchInput, { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Software' }));
    expect(screen.getByText('Brightloop Cloud ERP')).toBeInTheDocument();
    expect(screen.queryByText('24/7 SLA Protection')).not.toBeInTheDocument();
  });

  it('renders CustomerHomePage with the four mandatory sections in order', () => {
    render(
      <DataProvider>
        <CustomerHomePage />
      </DataProvider>
    );

    // Section 1: Header
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Welcome back/i);
    // Section 2: Trending Plans
    expect(screen.getByRole('region', { name: 'Trending Subscription Plans' })).toBeInTheDocument();
    // Section 3: Available Applications
    expect(screen.getByRole('region', { name: 'Available Applications and Products' })).toBeInTheDocument();
    // Section 4: My Subscription Summary
    expect(screen.getByRole('region', { name: 'Customer Subscription Summary and Shortcuts' })).toBeInTheDocument();
  });
});
