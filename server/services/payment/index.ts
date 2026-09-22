import { PaymentProvider } from './provider.js';
import { StripePaymentProvider } from './stripe.js';

let defaultProvider: PaymentProvider | null = null;

export function getPaymentProvider(name?: string): PaymentProvider {
  const providerName = name || process.env.PAYMENT_PROVIDER || 'stripe';

  if (providerName.toLowerCase() === 'stripe') {
    if (!defaultProvider) {
      defaultProvider = new StripePaymentProvider();
    }
    return defaultProvider;
  }

  // Fallback to Stripe by default
  if (!defaultProvider) {
    defaultProvider = new StripePaymentProvider();
  }
  return defaultProvider;
}

export * from './provider.js';
export * from './stripe.js';
