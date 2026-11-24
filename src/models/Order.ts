import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId?: string | number;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  imageColor?: string;
  customDesign?: {
    text?: string;
    textColor?: string;
    fontFamily?: string;
    fontSize?: number;
    uploadedImage?: string;
  };
}

export interface IShippingAddress {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Payment Confirmed'
  | 'Order Processing'
  | 'Printing in Progress'
  | 'Ready for Dispatch'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Payment Verification Failed'
  | 'Payment Failed'
  | 'Cancelled';

export type PaymentMethod = 'UPI' | 'Card' | 'COD';

export type PaymentStatus =
  | 'SUCCESS'
  | 'PENDING'
  | 'FAILED'
  | 'REFUNDED'
  | 'Paid'
  | 'Pending'
  | 'Verification Pending'
  | 'COD Pending'
  | 'COD Collected'
  | 'Refund Requested';

export interface IPaymentHistory {
  status: string;
  paymentStatus?: string;
  timestamp: Date;
  note?: string;
  updatedBy?: string;
  transactionId?: string;
}

export interface IOrder extends Document {
  orderId: string;
  user?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: IOrderItem[];
  subtotal: number;
  customizationCharge?: number;
  deliveryCharge: number;
  codCharge: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentDate?: Date;
  paymentDetails?: {
    method?: string;
    vpa?: string;
    cardNetwork?: string;
    last4?: string;
    bank?: string;
    wallet?: string;
    currency?: string;
    amount?: number;
  };
  deliveryDistanceKm?: number;
  deliveryDurationText?: string;
  shippingAddress?: IShippingAddress;
  paymentHistory?: IPaymentHistory[];
  refundDetails?: {
    refundId?: string;
    amount?: number;
    reason?: string;
    refundedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.Mixed },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
    imageColor: { type: String, default: '#fdfbfb' },
    customDesign: {
      text: { type: String },
      textColor: { type: String },
      fontFamily: { type: String },
      fontSize: { type: Number },
      uploadedImage: { type: String },
    },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String },
    phone: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String, default: 'India' },
  },
  { _id: false }
);

const PaymentHistorySchema = new Schema<IPaymentHistory>(
  {
    status: { type: String, required: true },
    paymentStatus: { type: String },
    timestamp: { type: Date, default: Date.now },
    note: { type: String },
    updatedBy: { type: String, default: 'System' },
    transactionId: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
      index: true,
    },
    customerPhone: {
      type: String,
    },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: [
        (val: IOrderItem[]) => val.length > 0,
        'Order must contain at least one item',
      ],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    customizationCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    codCharge: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        'Order Placed',
        'Payment Confirmed',
        'Order Processing',
        'Printing in Progress',
        'Ready for Dispatch',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Payment Verification Failed',
        'Payment Failed',
        'Cancelled',
        // Also keep legacy statuses compatible
        'Processing',
        'Printed',
      ],
      default: 'Order Placed',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Card', 'COD'],
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      default: 'PENDING',
      index: true,
    },
    transactionId: {
      type: String,
      trim: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      trim: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      trim: true,
      index: true,
    },
    razorpaySignature: {
      type: String,
    },
    paymentDate: {
      type: Date,
    },
    paymentDetails: {
      method: { type: String },
      vpa: { type: String },
      cardNetwork: { type: String },
      last4: { type: String },
      bank: { type: String },
      wallet: { type: String },
      currency: { type: String, default: 'INR' },
      amount: { type: Number },
    },
    deliveryDistanceKm: {
      type: Number,
      default: 0,
    },
    deliveryDurationText: {
      type: String,
    },
    shippingAddress: {
      type: ShippingAddressSchema,
    },
    paymentHistory: {
      type: [PaymentHistorySchema],
      default: [],
    },
    refundDetails: {
      refundId: { type: String },
      amount: { type: Number },
      reason: { type: String },
      refundedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for admin and user queries
OrderSchema.index({ customerEmail: 1, createdAt: -1 });
OrderSchema.index({ paymentMethod: 1, paymentStatus: 1 });

// Ensure model is updated across Next.js dev server hot-reloads
if (mongoose.models && mongoose.models.Order) {
  delete mongoose.models.Order;
}

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
