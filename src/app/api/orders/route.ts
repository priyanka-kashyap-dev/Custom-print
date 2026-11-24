import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Order, { IOrderItem, OrderStatus, PaymentMethod, PaymentStatus } from '@/models/Order';
import { sendOrderStatusUpdateEmail, sendOrderConfirmationEmail } from '@/lib/email';
import { calculateDeliveryDistance, getCodChargeForDistance } from '@/lib/distance';
import { refundRazorpayPayment } from '@/lib/razorpay';
import mongoose from 'mongoose';

interface OrderRequestBody {
  items?: Array<{
    id?: string | number;
    productId?: string | number;
    title: string;
    price: number;
    quantity?: number;
    image?: string;
    imageColor?: string;
    customDesign?: {
      text?: string;
      textColor?: string;
      fontFamily?: string;
      fontSize?: number;
      uploadedImage?: string;
    };
  }>;
  subtotal?: number;
  codCharge?: number;
  total?: number;
  paymentMethod?: string;
  transactionId?: string;
  shippingAddress?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

/**
 * GET /api/orders
 * Returns orders for the authenticated user, or all orders if admin.
 */
export async function GET(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to view your orders.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const url = new URL(req.url);
    const filterMethod = url.searchParams.get('method');
    const filterStatus = url.searchParams.get('paymentStatus');
    const search = url.searchParams.get('search');

    let query: Record<string, unknown> = {};
    if (session.role === 'admin') {
      // Admin view
      query = {};
      if (filterMethod && filterMethod !== 'all') {
        query.paymentMethod = filterMethod;
      }
      if (filterStatus && filterStatus !== 'all') {
        if (filterStatus === 'SUCCESS') {
          query.paymentStatus = { $in: ['SUCCESS', 'Paid', 'COD Collected'] };
        } else if (filterStatus === 'PENDING') {
          query.paymentStatus = { $in: ['PENDING', 'Pending', 'COD Pending', 'Verification Pending'] };
        } else if (filterStatus === 'FAILED') {
          query.paymentStatus = { $in: ['FAILED', 'Failed'] };
        } else if (filterStatus === 'REFUNDED') {
          query.paymentStatus = { $in: ['REFUNDED', 'Refunded', 'Refund Requested'] };
        } else {
          query.paymentStatus = filterStatus;
        }
      }
      if (search) {
        const regex = new RegExp(search.trim(), 'i');
        query.$or = [
          { orderId: regex },
          { customerName: regex },
          { customerEmail: regex },
          { transactionId: regex },
          { razorpayPaymentId: regex },
        ];
      }
    } else {
      // Regular customer
      query = {
        $or: [
          ...(mongoose.Types.ObjectId.isValid(session.id)
            ? [{ user: new mongoose.Types.ObjectId(session.id) }]
            : []),
          { customerEmail: session.email.toLowerCase() },
        ],
      };
    }

    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch orders';
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Direct order creation (used for COD or fallback flows)
 */
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in before placing an order.' },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as OrderRequestBody;
    const { items, paymentMethod, transactionId, shippingAddress } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cannot place an empty order. Cart items are required.' },
        { status: 400 }
      );
    }

    if (!paymentMethod || !['UPI', 'Card', 'COD'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method. Allowed: UPI, Card, COD.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Calculate subtotal securely
    const subtotal = items.reduce((acc, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      return acc + price * qty;
    }, 0);

    let codCharge = 0;
    let distanceKm = 0;
    let durationText = '';

    if (paymentMethod === 'COD') {
      const distRes = await calculateDeliveryDistance(shippingAddress || {});
      distanceKm = distRes.distanceKm;
      durationText = distRes.durationText;
      codCharge = getCodChargeForDistance(distanceKm);
    }

    const total = subtotal + codCharge;

    // Generate unique order ID
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `CP-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const paymentStatus: PaymentStatus =
      paymentMethod === 'COD' ? 'PENDING' : 'PENDING';

    const mappedItems: IOrderItem[] = items.map((item) => ({
      productId: item.id || item.productId,
      title: item.title,
      price: Number(item.price),
      quantity: Number(item.quantity) || 1,
      image: item.image,
      imageColor: item.imageColor || '#fdfbfb',
      customDesign: item.customDesign,
    }));

    const newOrder = await Order.create({
      orderId,
      user: mongoose.Types.ObjectId.isValid(session.id) ? session.id : undefined,
      customerName: session.name || shippingAddress?.fullName || 'Customer',
      customerEmail: session.email.toLowerCase(),
      customerPhone: shippingAddress?.phone,
      items: mappedItems,
      subtotal,
      deliveryCharge: 0,
      codCharge,
      total,
      status: 'Order Placed',
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus,
      transactionId: transactionId || undefined,
      deliveryDistanceKm: distanceKm,
      deliveryDurationText: durationText,
      shippingAddress: shippingAddress || {},
      paymentHistory: [
        {
          status: 'Order Placed',
          paymentStatus,
          timestamp: new Date(),
          note: `Order placed via ${paymentMethod}.`,
          updatedBy: 'Customer',
        },
      ],
    });

    if (paymentMethod === 'COD') {
      sendOrderConfirmationEmail(newOrder).catch((e) =>
        console.error('Order confirmation email failed:', e)
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          paymentMethod === 'COD'
            ? 'Order Placed Successfully – Cash on Delivery'
            : 'Order created successfully',
        order: newOrder,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/orders
 * Updates order status or payment status.
 * - Admin can update status across all 8 progress steps and paymentStatus of any order.
 * - Admin can mark COD order as PAID after cash collection.
 * - Admin can initiate refunds.
 * - Customers can cancel their own order if still 'Order Placed'.
 */
export async function PATCH(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      orderId?: string;
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      action?: 'refund' | 'mark_cod_paid' | 'update_status';
      refundReason?: string;
    };

    const { orderId, status, paymentStatus, action, refundReason } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const order = await Order.findOne({
      $or: [
        { orderId },
        ...(mongoose.Types.ObjectId.isValid(orderId)
          ? [{ _id: new mongoose.Types.ObjectId(orderId) }]
          : []),
      ],
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (session.role === 'admin') {
      const prevStatus = order.status;

      // Handle COD cash collection
      if (action === 'mark_cod_paid' || (order.paymentMethod === 'COD' && (paymentStatus === 'SUCCESS' || paymentStatus === 'Paid'))) {
        order.paymentStatus = 'SUCCESS';
        order.paymentDate = new Date();
        order.paymentHistory?.push({
          status: order.status,
          paymentStatus: 'SUCCESS',
          timestamp: new Date(),
          note: `Cash on Delivery collected (₹${order.total}) by admin/delivery agent.`,
          updatedBy: session.email,
        });
      } else {
        if (paymentStatus) {
          order.paymentStatus = paymentStatus;
          if (paymentStatus === 'SUCCESS' && !order.paymentDate) {
            order.paymentDate = new Date();
          }
          order.paymentHistory?.push({
            status: order.status,
            paymentStatus,
            timestamp: new Date(),
            note: `Payment status manually updated to ${paymentStatus} by admin.`,
            updatedBy: session.email,
          });
        }
      }

      // Handle Refund
      if (action === 'refund') {
        const paymentId = order.razorpayPaymentId || order.transactionId;
        if (paymentId && order.paymentMethod !== 'COD') {
          try {
            await refundRazorpayPayment(
              paymentId,
              Math.round(order.total * 100),
              { orderId: order.orderId, reason: refundReason || 'Admin refund' }
            );
          } catch (refundErr) {
            console.warn('Gateway refund call failed, marking local refund:', refundErr);
          }
        }

        order.paymentStatus = 'REFUNDED';
        order.status = 'Cancelled';
        order.refundDetails = {
          refundId: `REF-${Date.now()}`,
          amount: order.total,
          reason: refundReason || 'Refund processed by Admin',
          refundedAt: new Date(),
        };
        order.paymentHistory?.push({
          status: 'Cancelled',
          paymentStatus: 'REFUNDED',
          timestamp: new Date(),
          note: `Refund of ₹${order.total} issued. Reason: ${refundReason || 'Admin request'}.`,
          updatedBy: session.email,
        });
      }

      // Handle order progress update
      if (status) {
        order.status = status;
        order.paymentHistory?.push({
          status,
          paymentStatus: order.paymentStatus,
          timestamp: new Date(),
          note: `Order status moved from "${prevStatus}" to "${status}".`,
          updatedBy: session.email,
        });

        // Notify customer via email on status transition
        if (prevStatus !== status) {
          sendOrderStatusUpdateEmail(order, status).catch((err) =>
            console.error('Failed to send status update email:', err)
          );
        }
      }
    } else {
      // Customer trying to update order
      const isOwner =
        (order.user && order.user.toString() === session.id) ||
        order.customerEmail.toLowerCase() === session.email.toLowerCase();

      if (!isOwner) {
        return NextResponse.json(
          { error: 'Forbidden. You do not own this order.' },
          { status: 403 }
        );
      }

      if (status === 'Cancelled') {
        if (order.status !== 'Order Placed') {
          return NextResponse.json(
            {
              error:
                'Orders that have progressed to production or shipping cannot be cancelled automatically. Please contact support.',
            },
            { status: 400 }
          );
        }
        order.status = 'Cancelled';
        order.paymentHistory?.push({
          status: 'Cancelled',
          paymentStatus: order.paymentStatus,
          timestamp: new Date(),
          note: 'Order cancelled by customer.',
          updatedBy: 'Customer',
        });
      } else {
        return NextResponse.json(
          { error: 'Customers can only cancel unfulfilled orders.' },
          { status: 403 }
        );
      }
    }

    await order.save();

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update order';
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
