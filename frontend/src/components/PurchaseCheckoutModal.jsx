import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  CreditCard,
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ExternalLink,
  Laptop,
  FileText
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { loadRazorpayCheckout } from '../services/razorpay';

export function PurchaseCheckoutModal({ 
  product, 
  plan, 
  variant, 
  onClose,
  onOpenInvoice,
  onGoToSubscriptions
}) {
  const { 
    isDemo,
    getPurchaseQuote, 
    initiatePurchase, 
    verifyPurchase,
    launchProductWeb,
    launchProductDesktop
  } = useData();

  const [quantity, setQuantity] = useState(plan?.min_quantity || 1);
  
  // Checkout Steps: 'review' -> 'processing' -> 'success'
  const [step, setStep] = useState('review');
  const [isQuoting, setIsQuoting] = useState(true);
  const [quoteData, setQuoteData] = useState(null);
  const [quoteError, setQuoteError] = useState(null);

  // Completed purchase result
  const [purchaseResult, setPurchaseResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  // Web / Desktop launch states
  const [launchingType, setLaunchingType] = useState(null);
  const idempotencyKeyRef = useRef(null);

  // Fetch quote whenever quantity changes
  useEffect(() => {
    let active = true;
    const fetchQuote = async () => {
      try {
        setIsQuoting(true);
        setQuoteError(null);
        const res = await getPurchaseQuote({
          productId: product.id,
          planId: plan.id,
          variantId: variant?.id || null,
          quantity
        });
        if (active) {
          setQuoteData(res);
        }
      } catch (err) {
        if (active) {
          setQuoteError(err.message || 'Failed to calculate purchase quote.');
        }
      } finally {
        if (active) setIsQuoting(false);
      }
    };

    fetchQuote();
    return () => {
      active = false;
    };
  }, [getPurchaseQuote, product?.id, plan?.id, variant?.id, quantity]);

  const handleConfirmPurchase = async () => {
    try {
      setStep('processing');
      setVerifyError(null);

      if (!idempotencyKeyRef.current) {
        idempotencyKeyRef.current = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }
      const initRes = await initiatePurchase({
        productId: product.id,
        planId: plan.id,
        variantId: variant?.id || null,
        quantity,
        paymentMethod: 'razorpay',
        idempotencyKey: idempotencyKeyRef.current
      });

      if (isDemo) {
        const demoResult = await verifyPurchase({ orderId: initRes.order.id });
        setPurchaseResult(demoResult);
        setStep('success');
        return;
      }

      const checkoutOptions = initRes?.payment_checkout;
      if (!initRes?.order?.id || !checkoutOptions?.order_id || !checkoutOptions?.amount) {
        throw new Error('The server did not return a valid Razorpay checkout order.');
      }

      const RazorpayCheckout = await loadRazorpayCheckout();
      const checkout = new RazorpayCheckout({
        key: checkoutOptions.key_id,
        amount: checkoutOptions.amount,
        currency: checkoutOptions.currency,
        name: 'Brightloop Software',
        description: `${product.name} - ${plan.name}`,
        order_id: checkoutOptions.order_id,
        prefill: checkoutOptions.customer,
        notes: {
          order_number: checkoutOptions.order_number,
          product_name: product.name,
        },
        theme: { color: '#714B67' },
        handler: async response => {
          try {
            const result = await verifyPurchase({
              orderId: initRes.order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setPurchaseResult(result);
            setStep('success');
          } catch (verificationError) {
            setVerifyError(
              `Payment confirmation failed: ${verificationError.message}. ` +
              'Do not retry if your bank shows a charge; contact support.'
            );
            setStep('review');
          }
        },
        modal: {
          ondismiss: () => setStep('review'),
        },
      });
      checkout.on('payment.failed', response => {
        setVerifyError(response.error?.description || 'Razorpay could not complete this payment.');
        setStep('review');
      });
      checkout.open();
    } catch (err) {
      setVerifyError(err.message || 'Payment verification failed. Please try again or use another payment method.');
      setStep('review');
    }
  };

  const handleLaunchWeb = async () => {
    try {
      setLaunchingType('web');
      const subId = purchaseResult?.subscription?.id;
      const res = await launchProductWeb(product.id, subId);
      if (res?.launch_url) {
        window.open(res.launch_url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      alert(`Launch error: ${err.message}`);
    } finally {
      setLaunchingType(null);
    }
  };

  const handleLaunchDesktop = async () => {
    try {
      setLaunchingType('desktop');
      const subId = purchaseResult?.subscription?.id;
      const res = await launchProductDesktop(product.id, subId);
      if (res?.protocol_url) {
        window.location.href = res.protocol_url;
      }
    } catch (err) {
      alert(`Launch error: ${err.message}`);
    } finally {
      setLaunchingType(null);
    }
  };

  const pricing = quoteData?.pricing;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#25232A]/70 backdrop-blur-xs overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#714B67] via-[#8C3A73] to-[#25232A] p-6 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/70 block">
              Secure Subscription Checkout
            </span>
            <h2 id="checkout-title" className="text-xl sm:text-2xl font-bold">
              {step === 'success' ? 'Purchase Confirmed!' : `Subscribe to ${product?.name}`}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout modal"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors focus:outline-hidden"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* STEP 1: REVIEW & PAYMENT SELECTION */}
          {step === 'review' && (
            <>
              {verifyError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{verifyError}</span>
                </div>
              )}

              {quoteError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5" role="alert">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{quoteError}</span>
                </div>
              )}

              {/* Order Summary Card */}
              <div className="bg-[#F7F6F8] rounded-2xl p-5 border border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#25232A]">
                      {product?.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {plan?.name} • {plan?.billing_period} billing {variant ? `(${variant.attribute}: ${variant.value})` : ''}
                    </p>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="checkout-qty" className="text-xs text-gray-500 font-medium">
                      Qty:
                    </label>
                    <select
                      id="checkout-qty"
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="text-xs font-semibold bg-white border border-gray-200 rounded-lg px-2.5 py-1 text-[#25232A] focus:outline-hidden focus:ring-2 focus:ring-[#714B67]"
                    >
                      {[1, 2, 3, 5, 10, 25].filter(q => q >= (plan?.min_quantity || 1)).map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Server-Calculated Price Breakdown */}
                {isQuoting ? (
                  <div className="py-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#714B67]" aria-hidden="true" />
                    <span>Calculating verified prices and tax rules…</span>
                  </div>
                ) : (
                  <div className="pt-3 border-t border-gray-200/70 space-y-2 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({pricing?.quantity || quantity} × ₹{pricing?.unit_price || plan?.price})</span>
                      <span className="font-semibold text-[#25232A] tabular-nums">₹{pricing?.subtotal || '0.00'}</span>
                    </div>

                    {/* Applied Discount */}
                    {pricing?.discount?.applied && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Discount ({pricing.discount.name})</span>
                        </span>
                        <span className="tabular-nums">-₹{pricing.discount.amount}</span>
                      </div>
                    )}

                    {/* Tax */}
                    <div className="flex justify-between text-gray-600">
                      <span>{pricing?.tax?.name || 'Tax'} ({pricing?.tax?.rate || '18'}% {pricing?.tax?.is_inclusive ? 'Incl.' : 'Excl.'})</span>
                      <span className="font-semibold text-[#25232A] tabular-nums">+₹{pricing?.tax?.amount || '0.00'}</span>
                    </div>

                    {/* Final Total */}
                    <div className="flex justify-between items-baseline pt-2 border-t border-gray-200 text-sm font-bold text-[#25232A]">
                      <span>Total Due Today</span>
                      <span className="text-xl font-extrabold text-[#714B67] tabular-nums">
                        ₹{pricing?.total_amount || '0.00'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-[#F7F6F8] p-4">
                <CreditCard className="w-5 h-5 text-[#714B67]" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-[#25232A]">Secure payment by Razorpay</p>
                  <p className="text-[11px] text-gray-500">Choose UPI, card, or net banking in the secure checkout.</p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isQuoting || !pricing || step === 'processing'}
                  onClick={handleConfirmPurchase}
                  className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#714B67] to-[#8C3A73] hover:from-[#5C3D54] hover:to-[#74305F] shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-[#714B67] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                  <span>{isDemo ? 'Confirm Demo Purchase' : `Pay securely with Razorpay (₹${pricing?.total_amount || '0.00'})`}</span>
                </button>
                <p className="text-[11px] text-center text-gray-400 mt-2">
                  Your subscription activates only after the server verifies the Razorpay payment.
                </p>
              </div>
            </>
          )}

          {/* STEP 2: PROCESSING */}
          {step === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#714B67]/10 text-[#714B67] mx-auto flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-[#25232A]">
                Verifying Payment & Activating Subscription…
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Communicating with the billing engine, generating verified invoice, and provisioning product entitlements.
              </p>
            </div>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION & DIRECT LAUNCH */}
          {step === 'success' && purchaseResult && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#25232A]">
                  Subscription Activated!
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Thank you! Your subscription to <strong>{product?.name}</strong> has been provisioned and is active.
                </p>
              </div>

              {/* Receipt Details Card */}
              <div className="bg-[#F7F6F8] rounded-2xl p-4 border border-gray-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subscription Number:</span>
                  <span className="font-bold text-[#25232A]">{purchaseResult.subscription?.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Invoice Number:</span>
                  <span className="font-bold text-[#25232A]">{purchaseResult.invoice?.number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment Status:</span>
                  <span className="font-bold text-emerald-600">PAID (₹{purchaseResult.order?.total_amount || pricing?.total_amount})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Billing Interval:</span>
                  <span className="font-medium text-[#25232A] capitalize">{plan?.billing_period}</span>
                </div>
              </div>

              {/* Instant Launch Action Shortcuts */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                  Access Your Software Immediately
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Button A: Open in Web */}
                  <button
                    type="button"
                    disabled={launchingType === 'web'}
                    onClick={handleLaunchWeb}
                    className="py-3 px-4 rounded-xl font-bold text-xs bg-[#714B67] hover:bg-[#5C3D54] text-white flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
                  >
                    {launchingType === 'web' ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>Open in Web</span>
                  </button>

                  {/* Button B: Open in Windows Desktop App */}
                  <button
                    type="button"
                    disabled={launchingType === 'desktop'}
                    onClick={handleLaunchDesktop}
                    className="py-3 px-4 rounded-xl font-bold text-xs bg-gray-900 hover:bg-black text-white flex items-center justify-center gap-2 shadow-xs transition-all disabled:opacity-50"
                  >
                    {launchingType === 'desktop' ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Laptop className="w-4 h-4" aria-hidden="true" />
                    )}
                    <span>Open in Desktop App</span>
                  </button>
                </div>
              </div>

              {/* Navigation Shortcuts */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onGoToSubscriptions) onGoToSubscriptions();
                  }}
                  className="text-xs font-semibold text-[#714B67] hover:underline"
                >
                  View in My Subscriptions →
                </button>

                {purchaseResult.invoice && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenInvoice) onOpenInvoice(purchaseResult.invoice);
                    }}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>View Invoice PDF</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
