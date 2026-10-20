import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  googleId?: string;
  email: string;
  name: string;
  password?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  avatar?: string;
  role: 'customer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    resetPasswordToken: {
      type: String,
      sparse: true,
      index: true,
    },
    resetPasswordExpires: {
      type: Date,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'admin'],
        message: '{VALUE} is not a valid user role',
      },
      default: 'customer',
      required: true,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// In development or schema updates, ensure fresh schema registration
if (mongoose.models && mongoose.models.User) {
  delete (mongoose.models as Record<string, unknown>).User;
}

const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
