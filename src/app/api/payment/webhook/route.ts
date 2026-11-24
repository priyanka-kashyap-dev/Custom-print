import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Order from '@/models/Order';
import { verifyRazorpayWebhook } from '@/lib/razorpay';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature header' },
        { status: 400 }
      );
    }

    const isValid = verifyRazorpayWebhook(rawBody, signature);
    if (!isValid) {
      console.warn('Rejected webhook: invalid signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    await connectToDatabase();

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payment?.entity;
      const orderIdFromNotes = paymentEntity?.notes?.orderId;
      const rzpOrderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      const order = await Order.findOne({
        $or: [
          ...(orderIdFromNotes ? [{ orderId: orderIdFromNotes }] : []),
          ...(rzpOrderId ? [{ razorpayOrderId: rzpOrderId }] : []),
        ],
      });

      if (order && order.paymentStatus !== 'SUCCESS') {
        order.paymentStatus = 'SUCCESS';
        order.status = 'Payment Confirmed';
        order.transactionId = paymentId;
        order.razorpayPaymentId = paymentId;
        order.paymentDate = new Date();
        order.paymentDetails = {
          method: paymentEntity.method,
          vpa: paymentEntity.vpa,
          cardNetwork: paymentEntity.card?.network,
          last4: paymentEntity.card?.last4,
          bank: paymentEntity.bank,
          wallet: paymentEntity.wallet,
          currency: paymentEntity.currency,
          amount: (paymentEntity.amount || 0) / 100,
        };

        order.paymentHistory?.push({
          status: 'Payment Confirmed',
          paymentStatus: 'SUCCESS',
          timestamp: new Date(),
          note: `Webhook verified payment capture. Event: ${eventType}. Payment ID: ${paymentId}.`,
          updatedBy: 'RazorpayWebhook',
          transactionId: paymentId,
        });

        await order.save();
        sendOrderConfirmationEmail(order).catch((err) =>
          console.error('Webhook confirmation email error:', err)
        );
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      const orderIdFromNotes = paymentEntity?.notes?.orderId;

      const order = await Order.findOne({
        $or: [
          ...(orderIdFromNotes ? [{ orderId: orderIdFromNotes }] : []),
          ...(rzpOrderId ? [{ razorpayOrderId: rzpOrderId }] : []),
        ],
      });

      if (order && order.paymentStatus !== 'SUCCESS') {
        order.paymentStatus = 'FAILED';
        order.status = 'Payment Failed';
        order.paymentHistory?.push({
          status: 'Payment Failed',
          paymentStatus: 'FAILED',
          timestamp: new Date(),
          note: `Payment failed. Reason: ${paymentEntity.error_description || 'Gateway failure'}.`,
          updatedBy: 'RazorpayWebhook',
          transactionId: paymentEntity.id,
        });
        await order.save();
      }
    } else if (eventType === 'refund.processed') {
      const refundEntity = payload.refund?.entity;
      const paymentId = refundEntity?.payment_id;

      const order = await Order.findOne({
        $or: [{ transactionId: paymentId }, { razorpayPaymentId: paymentId }],
      });

      if (order) {
        order.paymentStatus = 'REFUNDED';
        order.refundDetails = {
          refundId: refundEntity.id,
          amount: (refundEntity.amount || 0) / 100,
          reason: refundEntity.notes?.reason || 'Refund processed via gateway',
          refundedAt: new Date(),
        };
        order.paymentHistory?.push({
          status: order.status,
          paymentStatus: 'REFUNDED',
          timestamp: new Date(),
          note: `Refund of ₹${(refundEntity.amount || 0) / 100} processed. Refund ID: ${refundEntity.id}.`,
          updatedBy: 'RazorpayWebhook',
          transactionId: refundEntity.id,
        });
        await order.save();
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 500 }
    );
  }
}
