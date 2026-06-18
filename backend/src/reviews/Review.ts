import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  watchId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    watchId: { type: Schema.Types.ObjectId, ref: 'Watch', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 120 },
    comment: { type: String, required: true, maxlength: 2000 },
    verified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Un usuario solo puede dejar una review por producto
reviewSchema.index({ watchId: 1, userId: 1 }, { unique: true });

export default mongoose.model<IReview>('Review', reviewSchema);
