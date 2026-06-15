import mongoose, { Schema, Document } from 'mongoose';

export interface IUserCoupon extends Document {
  userId: mongoose.Types.ObjectId;
  code: string;
  discountPercent: number;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const userCouponSchema = new Schema<IUserCoupon>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    code: { type: String, required: true },
    discountPercent: { type: Number, required: true },
    isUsed: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IUserCoupon>('UserCoupon', userCouponSchema);
