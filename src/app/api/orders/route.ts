import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Order, { IOrderItem, OrderStatus, PaymentMethod, PaymentStatus } from '@/models/Order';
import mongoose from 'mongoose';

interface OrderRequestBody {
  items?: Array<{
    id?: string | number;
    productId?: string | number;
    title: string;
    price: number;
    quantity?: number;
    imageColor?: string;
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
    city?: string;
    state?: string;
    postalCode?: string;
  };
}

/**
 * GET /api/orders
 * Returns orders for the authenticated user, or all orders if admin.
 */
export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to view your orders.' },
        { status: 401 }
      );
    }

    await connectToDatabase();

    let query: Record<string, unknown> = {};
    if (session.role === 'admin') {
      // Admins can see all orders
      query = {};
    } else {
      // Regular customers can only see their own orders (match by user ID or email)
      query = {
        $or: [
          ...(mongoose.Types.ObjectId.isValid(session.id) ? [{ user: new mongoose.Types.ObjectId(session.id) }] : []),
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
 * Creates a new order tied to the authenticated user.
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
    const { items, subtotal, codCharge, total, paymentMethod, transactionId, shippingAddress } = body;

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

    // Generate unique order ID
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `CP-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    // Determine initial payment status
    let paymentStatus: PaymentStatus = 'Pending';
    if (paymentMethod === 'COD') {
      paymentStatus = 'COD Pending';
    } else if (paymentMethod === 'UPI') {
      paymentStatus = 'Verification Pending';
    } else if (paymentMethod === 'Card') {
      paymentStatus = 'Paid';
    }

    const mappedItems: IOrderItem[] = items.map((item) => ({
      productId: item.id || item.productId,
      title: item.title,
      price: Number(item.price),
      quantity: Number(item.quantity) || 1,
      imageColor: item.imageColor || '#fdfbfb',
    }));

    const newOrder = await Order.create({
      orderId,
      user: mongoose.Types.ObjectId.isValid(session.id) ? session.id : undefined,
      customerName: session.name || 'Customer',
      customerEmail: session.email.toLowerCase(),
      items: mappedItems,
      subtotal: Number(subtotal),
      codCharge: Number(codCharge || 0),
      total: Number(total),
      status: 'Order Placed',
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus,
      transactionId: transactionId || (paymentMethod === 'Card' ? `TXN-${Date.now()}` : undefined),
      shippingAddress: shippingAddress || {},
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Order created successfully',
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
 * - Admin can update status and paymentStatus of any order.
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
    };

    const { orderId, status, paymentStatus } = body;

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
        ...(mongoose.Types.ObjectId.isValid(orderId) ? [{ _id: new mongoose.Types.ObjectId(orderId) }] : []),
      ],
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    if (session.role === 'admin') {
      if (status) {
        order.status = status;
      }
      if (paymentStatus) {
        order.paymentStatus = paymentStatus;
      }
    } else {
      // Regular user - can only cancel their own order
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
            { error: 'Orders that are already processing or shipped cannot be cancelled directly. Please contact support.' },
            { status: 400 }
          );
        }
        order.status = 'Cancelled';
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

