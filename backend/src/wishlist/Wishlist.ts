import mongoose, { Schema, Document } from 'mongoose';

export interface IWishlistItem {
  watchId: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistItemSchema = new Schema<IWishlistItem>(
  {
    watchId: { type: Schema.Types.ObjectId, ref: 'Watch', required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const wishlistSchema = new Schema<IWishlist>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    items: [wishlistItemSchema],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWishlist>('Wishlist', wishlistSchema);
