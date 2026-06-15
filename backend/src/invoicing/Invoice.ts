import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoice extends Document {
  orderId: mongoose.Types.ObjectId;
  invoiceNumber: string;
  rectifiesInvoice?: string;
  buyerInfo: {
    name: string;
    email: string;
    address: string;
    city: string;
    zip: string;
    vatId?: string;
  };
  companyInfo: {
    name: string;
    vatId: string;
    address: string;
    email: string;
  };
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  discount: number;
  shipping: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: 'issued' | 'cancelled';
  issuedAt: Date;
  paidAt?: Date;
  createdAt: Date;
}

const invoiceSchema = new Schema<IInvoice>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    invoiceNumber: { type: String, required: true, unique: true },
    rectifiesInvoice: { type: String },
    buyerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      address: { type: String, required: true },
      city: String,
      zip: String,
      vatId: String,
    },
    companyInfo: {
      name: { type: String, default: 'Castellan Store S.L.' },
      vatId: { type: String, default: 'B-12345678' },
      address: { type: String, default: 'Calle del Relojero, 12, 28001 Madrid' },
      email: { type: String, default: 'facturacion@castellanstore.com' },
    },
    items: [{
      name: String,
      price: Number,
      quantity: Number,
    }],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    taxRate: { type: Number, default: 21 },
    taxAmount: { type: Number, required: true },
    total: { type: Number, required: true },
    status: { type: String, enum: ['issued', 'cancelled'], default: 'issued' },
    issuedAt: { type: Date, default: Date.now },
    paidAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model<IInvoice>('Invoice', invoiceSchema);
