import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  image?: string;
  imageColor?: string;
  images?: string[];
  category: string;
  stock: number;
  badge?: string;
  rating?: number;
  reviews?: number;
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
    originalPrice: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: '',
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
      default: 50,
      min: [0, 'Stock cannot be negative'],
    },
    badge: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 4.9,
    },
    reviews: {
      type: Number,
      default: 24,
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
