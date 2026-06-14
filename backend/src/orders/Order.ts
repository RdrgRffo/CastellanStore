import mongoose, { Schema, Document } from 'mongoose';

interface IOrderItem {
  watchId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IStatusHistoryEntry {
  status: string;
  changedBy?: string;
  changedAt: Date;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId?: mongoose.Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  shippingMethod?: string;
  total: number;
  couponCode?: string;
  shippingInfo: {
    name: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    state?: string;
    zip: string;
    country: string;
  };
  paymentInfo: {
    cardLastFour?: string;
    cardName?: string;
    stripePaymentIntentId?: string;
    stripeRefundId?: string;
  };
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber?: string;
  statusHistory: IStatusHistoryEntry[];
  createdAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    watchId: { type: Schema.Types.ObjectId, ref: 'Watch', required: true },
    name: String,
    price: Number,
    quantity: { type: Number, required: true },
    image: String,
  },
  { _id: false }
);

const statusHistoryEntrySchema = new Schema<IStatusHistoryEntry>(
  {
    status: { type: String, required: true },
    changedBy: { type: String },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    couponCode: String,
    shippingInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: String,
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: String,
      zip: { type: String, required: true },
      country: { type: String, default: 'España' },
    },
    paymentInfo: {
      cardLastFour: String,
      cardName: String,
      stripePaymentIntentId: String,
      stripeRefundId: String,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    trackingNumber: { type: String, default: '' },
    statusHistory: { type: [statusHistoryEntrySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IOrder>('Order', orderSchema);
