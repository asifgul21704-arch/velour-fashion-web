import Stripe from 'stripe';
import {
  PaymentProvider,
  CreatePaymentParams,
  CreatePaymentResult,
  VerifyPaymentResult,
  WebhookResult,
  RefundPaymentParams,
  RefundPaymentResult,
  PaymentStatusResult
} from './provider.js';

export class StripePaymentProvider implements PaymentProvider {
  public readonly name = 'stripe';
  private stripeClient: Stripe | null = null;

  private getStripe(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key || !key.trim()) {
      throw new Error(
        'STRIPE_SECRET_KEY is not configured in the environment variables. Please provide your Stripe Secret Key.'
      );
    }
    if (!this.stripeClient) {
      this.stripeClient = new Stripe(key.trim(), {
        apiVersion: '2025-02-24.acacia' as any
      });
    }
    return this.stripeClient;
  }

  public isConfigured(): boolean {
    const key = process.env.STRIPE_SECRET_KEY;
    return Boolean(key && key.trim().startsWith('sk_'));
  }

  public async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const stripe = this.getStripe();
    const currency = (params.currency || process.env.CURRENCY || 'usd').toLowerCase();

    // Reconstruct verified line items for Stripe Checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = params.items.map(item => {
      const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = {
        price_data: {
          currency,
          product_data: {
            name: item.name,
            images: item.image && item.image.startsWith('http') ? [item.image] : [],
            metadata: {
              productId: item.productId
            }
          },
          unit_amount: Math.round(item.price * 100)
        },
        quantity: item.quantity
      };
      return lineItem;
    });

    // Add shipping as a line item if applicable
    if (params.shipping > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: {
            name: 'Atelier Courier Shipping',
            description: 'Direct courier dispatch from VELOUR Atelier'
          },
          unit_amount: Math.round(params.shipping * 100)
        },
        quantity: 1
      });
    }

    // Add tax as a line item if applicable
    if (params.tax > 0) {
      lineItems.push({
        price_data: {
          currency,
          product_data: {
            name: 'Estimated Sales Tax'
          },
          unit_amount: Math.round(params.tax * 100)
        },
        quantity: 1
      });
    }

    // If there is an applicable discount, apply Stripe discounts/coupons or adjust line item
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: lineItems,
      customer_email: params.userEmail,
      client_reference_id: params.orderId,
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        userId: params.userId,
        customerName: params.userName,
        discount: params.discount.toString()
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      clientSecret: session.client_secret || undefined,
      paymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : undefined,
      provider: this.name
    };
  }

  public async verifyPayment(sessionId: string): Promise<VerifyPaymentResult> {
    const stripe = this.getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    });

    const isPaid = session.payment_status === 'paid';
    const paymentIntent = typeof session.payment_intent === 'object' && session.payment_intent !== null
      ? (session.payment_intent as Stripe.PaymentIntent)
      : null;
    const paymentIntentId = paymentIntent
      ? paymentIntent.id
      : typeof session.payment_intent === 'string'
      ? session.payment_intent
      : undefined;

    const transactionId = paymentIntent?.latest_charge
      ? typeof paymentIntent.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : (paymentIntent.latest_charge as Stripe.Charge).id
      : paymentIntentId;

    let status: 'Pending' | 'Processing' | 'Paid' | 'Failed' | 'Cancelled' = 'Pending';
    if (isPaid) {
      status = 'Paid';
    } else if (session.status === 'expired') {
      status = 'Cancelled';
    } else if (session.status === 'open') {
      status = 'Processing';
    }

    const amountPaid = session.amount_total ? session.amount_total / 100 : undefined;
    const currency = session.currency?.toUpperCase();

    return {
      isPaid,
      status,
      paymentIntentId,
      transactionId,
      amountPaid,
      currency,
      customerEmail: session.customer_details?.email || session.customer_email || undefined,
      paidAt: isPaid ? new Date().toISOString() : undefined,
      metadata: (session.metadata as Record<string, string>) || {}
    };
  }

  public async handleWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookResult> {
    const stripe = this.getStripe();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret || !webhookSecret.trim()) {
      throw new Error(
        'STRIPE_WEBHOOK_SECRET is not configured in environment variables. Webhook signature verification cannot proceed.'
      );
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret.trim());
    } catch (err: any) {
      throw new Error(`Stripe webhook signature verification failed: ${err.message}`);
    }

    const eventId = event.id;
    const eventType = event.type;

    if (eventType === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const isPaid = session.payment_status === 'paid';
      const orderId = session.metadata?.orderId || session.client_reference_id || undefined;
      const orderNumber = session.metadata?.orderNumber;
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : undefined;

      return {
        received: true,
        eventId,
        eventType,
        orderId,
        orderNumber,
        isPaid,
        status: isPaid ? 'Paid' : 'Processing',
        paymentIntentId,
        transactionId: paymentIntentId,
        amount: session.amount_total ? session.amount_total / 100 : undefined,
        currency: session.currency?.toUpperCase()
      };
    }

    if (eventType === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      const orderNumber = intent.metadata?.orderNumber;

      return {
        received: true,
        eventId,
        eventType,
        orderId,
        orderNumber,
        isPaid: true,
        status: 'Paid',
        paymentIntentId: intent.id,
        transactionId: intent.id,
        amount: intent.amount ? intent.amount / 100 : undefined,
        currency: intent.currency?.toUpperCase()
      };
    }

    if (eventType === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      const orderNumber = intent.metadata?.orderNumber;

      return {
        received: true,
        eventId,
        eventType,
        orderId,
        orderNumber,
        isPaid: false,
        status: 'Failed',
        paymentIntentId: intent.id,
        transactionId: intent.id,
        amount: intent.amount ? intent.amount / 100 : undefined,
        currency: intent.currency?.toUpperCase()
      };
    }

    if (eventType === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : undefined;

      return {
        received: true,
        eventId,
        eventType,
        isPaid: false,
        status: 'Refunded',
        paymentIntentId,
        transactionId: charge.id,
        refundAmount: charge.amount_refunded ? charge.amount_refunded / 100 : undefined,
        refundId: charge.refunds?.data?.[0]?.id
      };
    }

    return {
      received: true,
      eventId,
      eventType,
      isPaid: false,
      status: 'Ignored'
    };
  }

  public async refundPayment(params: RefundPaymentParams): Promise<RefundPaymentResult> {
    const stripe = this.getStripe();
    if (!params.paymentIntentId && !params.transactionId) {
      throw new Error('paymentIntentId or transactionId is required to issue a refund through Stripe.');
    }

    const refundParams: Stripe.RefundCreateParams = {};
    if (params.paymentIntentId) {
      refundParams.payment_intent = params.paymentIntentId;
    } else if (params.transactionId) {
      refundParams.charge = params.transactionId;
    }

    if (params.amount && params.amount > 0) {
      refundParams.amount = Math.round(params.amount * 100);
    }
    if (params.reason) {
      refundParams.metadata = { reason: params.reason };
    }

    const refund = await stripe.refunds.create(refundParams);

    return {
      success: refund.status === 'succeeded' || refund.status === 'pending',
      refundId: refund.id,
      amountRefunded: refund.amount / 100,
      status: refund.status
    };
  }

  public async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatusResult> {
    const stripe = this.getStripe();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const isPaid = intent.status === 'succeeded';
    return {
      status: intent.status,
      isPaid,
      amount: intent.amount / 100,
      currency: intent.currency.toUpperCase(),
      transactionId: intent.id
    };
  }
}
