import mongoose, { Schema, Document } from 'mongoose';

export interface ILoyaltyProfile extends Document {
  userId: mongoose.Types.ObjectId;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

const loyaltyProfileSchema = new Schema<ILoyaltyProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<ILoyaltyProfile>('LoyaltyProfile', loyaltyProfileSchema);
