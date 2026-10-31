import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PurchaseCheckoutModal } from './PurchaseCheckoutModal';

const mocks = vi.hoisted(() => ({
  context: {},
  checkoutOptions: null,
  checkout: null,
  loadRazorpayCheckout: vi.fn(),
  getPurchaseQuote: vi.fn(),
  initiatePurchase: vi.fn(),
  verifyPurchase: vi.fn(),
}));

vi.mock('../context/DataContext', () => ({
  useData: () => mocks.context,
}));

vi.mock('../services/razorpay', () => ({
  loadRazorpayCheckout: mocks.loadRazorpayCheckout,
}));

const product = { id: 5, name: 'Cloud ERP' };
const plan = { id: 8, name: 'Growth Monthly', price: '4999.00', billing_period: 'monthly' };

describe('PurchaseCheckoutModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkoutOptions = null;
    mocks.checkout = { on: vi.fn(), open: vi.fn() };
    mocks.context = {
      isDemo: false,
      getPurchaseQuote: mocks.getPurchaseQuote,
      initiatePurchase: mocks.initiatePurchase,
      verifyPurchase: mocks.verifyPurchase,
      launchProductWeb: vi.fn(),
      launchProductDesktop: vi.fn(),
    };
    mocks.getPurchaseQuote.mockResolvedValue({
      pricing: {
        quantity: 1,
        unit_price: '4999.00',
        subtotal: '4999.00',
        discount: { applied: false },
        tax: { name: 'GST', rate: '18.00', amount: '899.82' },
        total_amount: '5898.82',
      },
    });
    mocks.initiatePurchase.mockResolvedValue({
      order: { id: 34 },
      payment_checkout: {
        key_id: 'rzp_test_example',
        order_id: 'order_purchase_123',
        amount: 589882,
        currency: 'INR',
        order_number: 'ORD-2026-000034',
        customer: { name: 'Test Customer', email: 'test@example.com' },
      },
    });
    mocks.verifyPurchase.mockResolvedValue({ status: 'success', subscription: { id: 56 } });
    mocks.loadRazorpayCheckout.mockResolvedValue(function RazorpayMock(options) {
      mocks.checkoutOptions = options;
      return mocks.checkout;
    });
  });

  it('uses the server order and verifies Razorpay response before confirming purchase', async () => {
    render(
      <PurchaseCheckoutModal
        product={product}
        plan={plan}
        onClose={vi.fn()}
      />
    );

    const payButton = await screen.findByRole('button', { name: /Pay securely with Razorpay/i });
    fireEvent.click(payButton);

    await waitFor(() => expect(mocks.checkout.open).toHaveBeenCalledOnce());
    expect(mocks.initiatePurchase).toHaveBeenCalledWith(expect.objectContaining({
      productId: product.id,
      planId: plan.id,
      paymentMethod: 'razorpay',
    }));
    expect(mocks.checkoutOptions.order_id).toBe('order_purchase_123');
    expect(mocks.checkoutOptions.amount).toBe(589882);

    await act(async () => {
      await mocks.checkoutOptions.handler({
        razorpay_order_id: 'order_purchase_123',
        razorpay_payment_id: 'pay_purchase_123',
        razorpay_signature: 'signed-response',
      });
    });

    expect(mocks.verifyPurchase).toHaveBeenCalledWith({
      orderId: 34,
      razorpayOrderId: 'order_purchase_123',
      razorpayPaymentId: 'pay_purchase_123',
      razorpaySignature: 'signed-response',
    });
    expect(await screen.findByText('Subscription Activated!')).toBeInTheDocument();
  });

  it('surfaces quote API errors instead of showing an offline price as purchasable', async () => {
    mocks.getPurchaseQuote.mockRejectedValueOnce(new Error('Product does not exist.'));

    render(
      <PurchaseCheckoutModal
        product={product}
        plan={plan}
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Product does not exist.');
    expect(screen.getByRole('button', { name: /Pay securely with Razorpay/i })).toBeDisabled();
  });
});
