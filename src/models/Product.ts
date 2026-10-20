import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  imageColor?: string;
  images?: string[];
  category: string;
  stock: number;
  status: 'active' | 'out_of_stock' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number'],
    },
    imageColor: {
      type: String,
      default: '#f3f4f6',
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: 'General',
      index: true,
    },
    stock: {
      type: Number,
      default: 100,
      min: [0, 'Stock cannot be negative'],
    },
    status: {
      type: String,
      enum: ['active', 'out_of_stock', 'draft'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;
