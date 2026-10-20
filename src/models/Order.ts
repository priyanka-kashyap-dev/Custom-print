import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  productId?: string | number;
  title: string;
  price: number;
  quantity: number;
  imageColor?: string;
}

export interface IShippingAddress {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export type OrderStatus =
  | 'Order Placed'
  | 'Processing'
  | 'Printed'
  | 'Shipped'
  | 'Delivered'
  | 'Payment Verification Failed';

export type PaymentMethod = 'UPI' | 'Card' | 'COD';

export type PaymentStatus =
  | 'Pending'
  | 'Verification Pending'
  | 'Paid'
  | 'Failed'
  | 'COD Pending'
  | 'COD Collected'
  | 'Refund Requested'
  | 'Refunded';

export interface IOrder extends Document {
  orderId: string;
  user?: mongoose.Types.ObjectId;
  customerName: string;
  customerEmail: string;
  items: IOrderItem[];
  subtotal: number;
  codCharge: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  shippingAddress?: IShippingAddress;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    productId: { type: Schema.Types.Mixed },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    imageColor: { type: String, default: '#fdfbfb' },
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: { type: String },
    phone: { type: String },
    addressLine1: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
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
        'Processing',
        'Printed',
        'Shipped',
        'Delivered',
        'Payment Verification Failed',
      ],
      default: 'Order Placed',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['UPI', 'Card', 'COD'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: [
        'Pending',
        'Verification Pending',
        'Paid',
        'Failed',
        'COD Pending',
        'COD Collected',
        'Refund Requested',
        'Refunded',
      ],
      default: 'Pending',
      index: true,
    },
    transactionId: {
      type: String,
      trim: true,
    },
    shippingAddress: {
      type: ShippingAddressSchema,
    },
  },
  {
    timestamps: true,
  }
);

const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);

export default Order;
