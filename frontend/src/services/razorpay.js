let checkoutScriptPromise;

export function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);

  if (!checkoutScriptPromise) {
    checkoutScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        if (window.Razorpay) {
          resolve(window.Razorpay);
        } else {
          reject(new Error('Razorpay Checkout could not be initialized.'));
        }
      };
      script.onerror = () => reject(new Error('Razorpay Checkout could not be loaded.'));
      document.body.appendChild(script);
    }).catch(error => {
      checkoutScriptPromise = null;
      throw error;
    });
  }

  return checkoutScriptPromise;
}
