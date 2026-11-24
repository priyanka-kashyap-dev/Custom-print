import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Order, { IOrderItem, PaymentMethod } from '@/models/Order';
import { getRazorpayClient } from '@/lib/razorpay';
import { calculateDeliveryDistance, getCodChargeForDistance } from '@/lib/distance';
import { sendOrderConfirmationEmail } from '@/lib/email';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to proceed with checkout.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { items, paymentMethod, shippingAddress } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty. Please select products to order.' },
        { status: 400 }
      );
    }

    if (!['UPI', 'Card', 'COD'].includes(paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method. Allowed methods: UPI, Card, COD.' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Calculate subtotal securely on server
    const subtotal = items.reduce((acc, item) => {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      return acc + price * qty;
    }, 0);

    if (subtotal <= 0) {
      return NextResponse.json(
        { error: 'Invalid order total.' },
        { status: 400 }
      );
    }

    // 2. Compute delivery distance and COD charge
    let codCharge = 0;
    let distanceKm = 0;
    let durationText = '';

    if (paymentMethod === 'COD') {
      const distanceResult = await calculateDeliveryDistance(shippingAddress || {});
      distanceKm = distanceResult.distanceKm;
      durationText = distanceResult.durationText;
      // Strict rule: 0-25 KM => ₹80, >25 KM => ₹300
      codCharge = getCodChargeForDistance(distanceKm);
    } else {
      // For prepaid UPI and Card payments, COD charges are NEVER applied
      codCharge = 0;
    }

    const total = subtotal + codCharge;

    // 3. Generate unique order ID
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderId = `CP-${Date.now().toString(36).toUpperCase()}-${randomSuffix}`;

    const mappedItems: IOrderItem[] = items.map((item) => ({
      productId: item.id || item.productId,
      title: item.title,
      price: Number(item.price),
      quantity: Number(item.quantity) || 1,
      image: item.image,
      imageColor: item.imageColor || '#fdfbfb',
      customDesign: item.customDesign,
    }));

    // Handle Cash on Delivery (COD)
    if (paymentMethod === 'COD') {
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
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        deliveryDistanceKm: distanceKm,
        deliveryDurationText: durationText,
        shippingAddress: shippingAddress || {},
        paymentHistory: [
          {
            status: 'Order Placed',
            paymentStatus: 'PENDING',
            timestamp: new Date(),
            note: `Order placed with Cash on Delivery. Distance: ${distanceKm} KM. COD fee: ₹${codCharge}.`,
            updatedBy: 'Customer',
          },
        ],
      });

      // Send confirmation email asynchronously
      sendOrderConfirmationEmail(newOrder).catch((e) =>
        console.error('Email dispatch error for COD order:', e)
      );

      return NextResponse.json({
        success: true,
        orderId,
        paymentMethod: 'COD',
        paymentStatus: 'PENDING',
        total,
        subtotal,
        codCharge,
        deliveryDistanceKm: distanceKm,
        message: 'Order Placed Successfully – Cash on Delivery',
        order: newOrder,
      });
    }

    // Handle Prepaid: UPI or Card via Razorpay
    const razorpay = getRazorpayClient();
    let razorpayOrderId = `rzp_order_${Date.now()}`;

    if (razorpay) {
      try {
        const amountInPaise = Math.round(total * 100);
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: orderId,
          notes: {
            orderId,
            customerEmail: session.email,
            paymentMethod,
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (rzpErr) {
        console.error('Razorpay order creation error:', rzpErr);
        return NextResponse.json(
          {
            error:
              'Failed to initialize payment gateway order. Please check payment keys or try again.',
          },
          { status: 502 }
        );
      }
    }

    // Pre-create pending order in MongoDB
    const pendingOrder = await Order.create({
      orderId,
      user: mongoose.Types.ObjectId.isValid(session.id) ? session.id : undefined,
      customerName: session.name || shippingAddress?.fullName || 'Customer',
      customerEmail: session.email.toLowerCase(),
      customerPhone: shippingAddress?.phone,
      items: mappedItems,
      subtotal,
      deliveryCharge: 0,
      codCharge: 0,
      total,
      status: 'Order Placed',
      paymentMethod: paymentMethod as PaymentMethod,
      paymentStatus: 'PENDING',
      razorpayOrderId,
      shippingAddress: shippingAddress || {},
      paymentHistory: [
        {
          status: 'Order Placed',
          paymentStatus: 'PENDING',
          timestamp: new Date(),
          note: `Prepaid checkout initiated via ${paymentMethod}. Gateway Order ID: ${razorpayOrderId}.`,
          updatedBy: 'Customer',
        },
      ],
    });

    const razorpayKeyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';

    return NextResponse.json({
      success: true,
      orderId,
      razorpayOrderId,
      keyId: razorpayKeyId,
      amount: Math.round(total * 100),
      currency: 'INR',
      total,
      paymentMethod,
      customer: {
        name: session.name || 'Valued Customer',
        email: session.email,
        phone: shippingAddress?.phone || '',
      },
      order: pendingOrder,
    });
  } catch (error) {
    console.error('Error in /api/payment/create-order:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create payment order',
      },
      { status: 500 }
    );
  }
}
