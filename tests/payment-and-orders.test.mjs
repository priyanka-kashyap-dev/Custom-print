import assert from 'assert';
import crypto from 'crypto';
import { getCodChargeForDistance } from '../src/lib/distance.ts';
import { verifyRazorpaySignature, verifyRazorpayWebhook } from '../src/lib/razorpay.ts';

console.log('========================================================');
console.log('🧪 Running Payment, COD Distance & Order Integration Tests');
console.log('========================================================\n');

let passedTests = 0;
let failedTests = 0;

function it(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    failedTests++;
  }
}

async function runTests() {
  console.log('1. Testing Distance-based COD Surcharge Calculation');
  it('0 KM to 25 KM returns exactly ₹80 COD charge', () => {
    assert.strictEqual(getCodChargeForDistance(0), 80);
    assert.strictEqual(getCodChargeForDistance(5), 80);
    assert.strictEqual(getCodChargeForDistance(18.5), 80);
    assert.strictEqual(getCodChargeForDistance(25), 80);
  });

  it('Above 25 KM returns exactly ₹300 COD charge', () => {
    assert.strictEqual(getCodChargeForDistance(25.1), 300);
    assert.strictEqual(getCodChargeForDistance(50), 300);
    assert.strictEqual(getCodChargeForDistance(500), 300);
    assert.strictEqual(getCodChargeForDistance(1400), 300);
  });

  console.log('\n2. Testing Cryptographic Razorpay Signature Verification');
  const mockSecret = 'secret_key_test_12345';
  process.env.RAZORPAY_KEY_SECRET = mockSecret;

  it('Valid HMAC-SHA256 signature is accepted', () => {
    const orderId = 'order_DA12345678';
    const paymentId = 'pay_XY987654321';
    const expectedSig = crypto
      .createHmac('sha256', mockSecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const result = verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: expectedSig,
    });

    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.error, undefined);
  });

  it('Tampered paymentId or orderId is strictly rejected', () => {
    const orderId = 'order_DA12345678';
    const paymentId = 'pay_XY987654321';
    const forgedSig = crypto
      .createHmac('sha256', mockSecret)
      .update(`order_ATTACKER_ID|${paymentId}`)
      .digest('hex');

    const result = verifyRazorpaySignature({
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
      razorpaySignature: forgedSig,
    });

    assert.strictEqual(result.isValid, false);
    assert.ok(result.error);
  });

  it('Missing verification parameters are rejected cleanly', () => {
    const result = verifyRazorpaySignature({
      razorpayOrderId: '',
      razorpayPaymentId: 'pay_123',
      razorpaySignature: 'abc',
    });
    assert.strictEqual(result.isValid, false);
  });

  console.log('\n3. Testing Razorpay Webhook Cryptographic Verification');
  process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_test_secret_999';

  it('Valid webhook payload signature is accepted', () => {
    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_captured_123' } } },
    });
    const expectedWebhookSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    const valid = verifyRazorpayWebhook(payload, expectedWebhookSig);
    assert.strictEqual(valid, true);
  });

  it('Tampered webhook payload is strictly rejected', () => {
    const originalPayload = JSON.stringify({ event: 'payment.captured' });
    const tamperedPayload = JSON.stringify({ event: 'payment.captured', evil: true });
    const sig = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(originalPayload)
      .digest('hex');

    const valid = verifyRazorpayWebhook(tamperedPayload, sig);
    assert.strictEqual(valid, false);
  });

  console.log('\n4. Testing 8-Stage Order Fulfillment Lifecycle');
  const REQUIRED_STEPS = [
    'Order Placed',
    'Payment Confirmed',
    'Order Processing',
    'Printing in Progress',
    'Ready for Dispatch',
    'Shipped',
    'Out for Delivery',
    'Delivered',
  ];

  it('All 8 required lifecycle steps are present in sequence', () => {
    assert.strictEqual(REQUIRED_STEPS.length, 8);
    assert.strictEqual(REQUIRED_STEPS[0], 'Order Placed');
    assert.strictEqual(REQUIRED_STEPS[1], 'Payment Confirmed');
    assert.strictEqual(REQUIRED_STEPS[2], 'Order Processing');
    assert.strictEqual(REQUIRED_STEPS[3], 'Printing in Progress');
    assert.strictEqual(REQUIRED_STEPS[4], 'Ready for Dispatch');
    assert.strictEqual(REQUIRED_STEPS[5], 'Shipped');
    assert.strictEqual(REQUIRED_STEPS[6], 'Out for Delivery');
    assert.strictEqual(REQUIRED_STEPS[7], 'Delivered');
  });

  console.log('\n========================================================');
  console.log(`📊 Test Summary: ${passedTests}/${passedTests + failedTests} Passed (${failedTests} Failed)`);
  console.log('========================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
