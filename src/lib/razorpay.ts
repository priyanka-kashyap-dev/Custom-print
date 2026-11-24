import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Returns Razorpay instance configured from environment variables.
 */
export function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  try {
    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  } catch (error) {
    console.error('Error initializing Razorpay client:', error);
    return null;
  }
}

/**
 * Verify cryptographic payment signature from Razorpay checkout.
 * Formula: HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
 */
export function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): { isValid: boolean; error?: string } {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return { isValid: false, error: 'Missing required signature verification parameters.' };
  }

  if (!keySecret) {
    // If running in development without a secret configured yet, warn explicitly
    console.warn('RAZORPAY_KEY_SECRET is not configured in environment variables.');
    return {
      isValid: false,
      error: 'Payment gateway secret is not configured on the server.',
    };
  }

  try {
    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    const isValid = expectedSignature.toLowerCase() === razorpaySignature.toLowerCase();

    return {
      isValid,
      ...(!isValid && { error: 'Cryptographic signature mismatch.' }),
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Signature verification error.',
    };
  }
}

/**
 * Verify Razorpay Webhook signature against webhook secret.
 */
export function verifyRazorpayWebhook(
  rawBody: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret || !signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature.toLowerCase() === signature.toLowerCase();
  } catch (err) {
    console.error('Failed to verify Razorpay webhook signature:', err);
    return false;
  }
}

/**
 * Fetches verified payment information directly from Razorpay.
 */
export async function fetchRazorpayPayment(paymentId: string) {
  const client = getRazorpayClient();
  if (!client) {
    throw new Error('Razorpay client not configured');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client.payments as any).fetch(paymentId);
}

/**
 * Initiates a refund through Razorpay.
 */
export async function refundRazorpayPayment(
  paymentId: string,
  amountInPaise?: number,
  notes?: Record<string, string>
) {
  const client = getRazorpayClient();
  if (!client) {
    throw new Error('Razorpay client not configured');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client.payments as any).refund(paymentId, {
    ...(amountInPaise && { amount: amountInPaise }),
    notes: notes || {},
  });
}
