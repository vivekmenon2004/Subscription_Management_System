import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecordPaymentModal } from './RecordPaymentModal';

const mocks = vi.hoisted(() => ({
  context: {},
  checkoutOptions: null,
  checkout: null,
  loadRazorpayCheckout: vi.fn(),
  createRazorpayOrder: vi.fn(),
  verifyRazorpayPayment: vi.fn(),
  recordPayment: vi.fn(),
}));

vi.mock('../context/DataContext', () => ({
  useData: () => mocks.context,
}));

vi.mock('../services/razorpay', () => ({
  loadRazorpayCheckout: mocks.loadRazorpayCheckout,
}));

const invoice = {
  id: 12,
  number: 'INV-2026-000012',
  outstanding_balance: '1000.00',
};

describe('RecordPaymentModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkoutOptions = null;
    mocks.checkout = { on: vi.fn(), open: vi.fn() };
    mocks.context = {
      currentUser: { role: 'customer', name: 'Test Customer', email: 'customer@example.com' },
      isDemo: false,
      createRazorpayOrder: mocks.createRazorpayOrder,
      verifyRazorpayPayment: mocks.verifyRazorpayPayment,
      recordPayment: mocks.recordPayment,
    };
    mocks.createRazorpayOrder.mockResolvedValue({
      key_id: 'rzp_test_example',
      order_id: 'order_test_123',
      amount: 100000,
      currency: 'INR',
      invoice_number: invoice.number,
      customer: { name: 'Test Customer', email: 'customer@example.com' },
    });
    mocks.verifyRazorpayPayment.mockResolvedValue({});
    mocks.loadRazorpayCheckout.mockResolvedValue(function RazorpayMock(options) {
      mocks.checkoutOptions = options;
      return mocks.checkout;
    });
  });

  it('creates a server order and verifies the Razorpay checkout response', async () => {
    const onClose = vi.fn();
    render(<RecordPaymentModal invoice={invoice} onClose={onClose} />);

    expect(screen.queryByLabelText('Amount (₹)')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Continue to Razorpay' }));

    await waitFor(() => expect(mocks.checkout.open).toHaveBeenCalledOnce());
    expect(mocks.createRazorpayOrder).toHaveBeenCalledWith(invoice.id);
    expect(mocks.checkoutOptions.order_id).toBe('order_test_123');

    await act(async () => {
      await mocks.checkoutOptions.handler({
        razorpay_order_id: 'order_test_123',
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'signed-response',
      });
    });

    expect(mocks.verifyRazorpayPayment).toHaveBeenCalledWith({
      razorpay_order_id: 'order_test_123',
      razorpay_payment_id: 'pay_test_123',
      razorpay_signature: 'signed-response',
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps staff payments on the existing manual flow', () => {
    mocks.context.currentUser = { role: 'staff' };
    mocks.context.isDemo = false;
    render(<RecordPaymentModal invoice={invoice} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Payment' }));

    expect(mocks.recordPayment).toHaveBeenCalledWith({
      invoiceId: invoice.id,
      method: 'upi',
      amount: 1000,
      note: '',
    });
    expect(mocks.createRazorpayOrder).not.toHaveBeenCalled();
  });
});
