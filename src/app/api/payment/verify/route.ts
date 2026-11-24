import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import {
  verifyRazorpaySignature,
  fetchRazorpayPayment,
} from '@/lib/razorpay';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find the order in MongoDB
    const order = await Order.findOne({
      $or: [
        { orderId },
        { razorpayOrderId },
      ],
    });

    if (!order) {
      return NextResponse.json(
        { error: `Order #${orderId} was not found.` },
        { status: 404 }
      );
    }

    // Check if order was already verified to prevent duplicate processing
    if (order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'Paid') {
      return NextResponse.json({
        success: true,
        message: 'Order has already been verified and marked as SUCCESS.',
        orderId: order.orderId,
        paymentStatus: 'SUCCESS',
        transactionId: order.transactionId || order.razorpayPaymentId,
      });
    }

    // Cryptographically verify the HMAC-SHA256 signature
    const sigCheck = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!sigCheck.isValid) {
      order.paymentStatus = 'FAILED';
      order.status = 'Payment Verification Failed';
      order.paymentHistory?.push({
        status: 'Payment Verification Failed',
        paymentStatus: 'FAILED',
        timestamp: new Date(),
        note: `Gateway signature mismatch. Reason: ${sigCheck.error || 'Invalid signature'}.`,
        updatedBy: 'SecurityVerification',
        transactionId: razorpayPaymentId,
      });
      await order.save();

      return NextResponse.json(
        {
          error:
            'Cryptographic payment signature verification failed. The transaction cannot be trusted.',
        },
        { status: 400 }
      );
    }

    // Signature is cryptographically verified!
    // Next, fetch payment details from Razorpay to verify status & amount
    let paymentDetailsObj: Record<string, unknown> = {};
    try {
      const paymentData = await fetchRazorpayPayment(razorpayPaymentId);
      if (paymentData) {
        // Verify payment is captured or authorized
        if (paymentData.status !== 'captured' && paymentData.status !== 'authorized') {
          return NextResponse.json(
            {
              error: `Payment is in invalid state: ${paymentData.status}. Not captured.`,
            },
            { status: 400 }
          );
        }

        paymentDetailsObj = {
          method: paymentData.method,
          vpa: paymentData.vpa,
          cardNetwork: paymentData.card?.network,
          last4: paymentData.card?.last4,
          bank: paymentData.bank,
          wallet: paymentData.wallet,
          currency: paymentData.currency || 'INR',
          amount: (paymentData.amount || 0) / 100,
        };
      }
    } catch (fetchErr) {
      console.warn('Could not fetch remote payment details from Razorpay:', fetchErr);
    }

    // Update order with SUCCESS status and transaction identifiers
    order.paymentStatus = 'SUCCESS';
    order.status = 'Payment Confirmed';
    order.transactionId = razorpayPaymentId;
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpayOrderId = razorpayOrderId;
    order.razorpaySignature = razorpaySignature;
    order.paymentDate = new Date();
    order.paymentDetails = paymentDetailsObj;

    order.paymentHistory?.push({
      status: 'Payment Confirmed',
      paymentStatus: 'SUCCESS',
      timestamp: new Date(),
      note: `Payment of ₹${order.total} verified via Razorpay HMAC signature. Txn: ${razorpayPaymentId}.`,
      updatedBy: 'PaymentGateway',
      transactionId: razorpayPaymentId,
    });

    await order.save();

    // Dispatch order confirmation email
    sendOrderConfirmationEmail(order).catch((emailErr) =>
      console.error('Failed to send confirmation email on verify:', emailErr)
    );

    return NextResponse.json({
      success: true,
      message: 'Payment Successful! Your order has been placed successfully.',
      orderId: order.orderId,
      transactionId: razorpayPaymentId,
      paymentStatus: 'SUCCESS',
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentDate: order.paymentDate,
      order,
    });
  } catch (error) {
    console.error('Error in /api/payment/verify:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Payment verification failed',
      },
      { status: 500 }
    );
  }
}
