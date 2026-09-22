export interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: Array<{
    productId: string;
    name: string;
    price: number; // in unit currency (e.g. dollars)
    quantity: number;
    image?: string;
  }>;
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentResult {
  sessionId: string;
  checkoutUrl: string | null;
  paymentIntentId?: string;
  clientSecret?: string;
  provider: string;
}

export interface VerifyPaymentResult {
  isPaid: boolean;
  status: 'Pending' | 'Processing' | 'Paid' | 'Failed' | 'Cancelled';
  paymentIntentId?: string;
  transactionId?: string;
  amountPaid?: number;
  currency?: string;
  customerEmail?: string;
  paidAt?: string;
  metadata?: Record<string, string>;
}

export interface WebhookResult {
  received: boolean;
  duplicate?: boolean;
  eventType: string;
  eventId: string;
  orderId?: string;
  orderNumber?: string;
  isPaid: boolean;
  paymentIntentId?: string;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status: 'Paid' | 'Failed' | 'Refunded' | 'Cancelled' | 'Ignored';
  refundAmount?: number;
  refundId?: string;
}

export interface RefundPaymentParams {
  paymentIntentId?: string;
  transactionId?: string;
  amount?: number; // In main currency units (e.g. 50.00)
  currency?: string;
  reason?: string;
}

export interface RefundPaymentResult {
  success: boolean;
  refundId: string;
  amountRefunded: number;
  status: string;
}

export interface PaymentStatusResult {
  status: string;
  isPaid: boolean;
  amount: number;
  currency: string;
  transactionId?: string;
}

export interface PaymentProvider {
  readonly name: string;
  isConfigured(): boolean;
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  verifyPayment(sessionId: string): Promise<VerifyPaymentResult>;
  handleWebhook(rawBody: string | Buffer, signature: string): Promise<WebhookResult>;
  refundPayment(params: RefundPaymentParams): Promise<RefundPaymentResult>;
  getPaymentStatus(paymentIntentId: string): Promise<PaymentStatusResult>;
}
