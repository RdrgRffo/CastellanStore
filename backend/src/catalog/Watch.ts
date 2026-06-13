import mongoose, { Schema, Document } from 'mongoose';

export interface IWatch extends Document {
  name: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  discount: number;
  currency: string;
  category: 'clasicos-vestir' | 'cronografos' | 'automaticos' | 'piezas-coleccion';
  strapColor?: string;
  strapMaterial?: string;
  dialColor?: string;
  caseMaterial?: string;
  movement?: string;
  description?: string;
  stock: number;
  mpn: string;
  sku: string;
  status: 'IN_STOCK' | 'OUT_OF_STOCK' | 'DISCONTINUED';
  tag: 'Bestseller' | 'New' | 'Oferta' | 'Limited' | 'Premium' | null;
  image?: string;
  gallery: string[];
  createdAt: Date;
  updatedAt: Date;
}

const watchSchema = new Schema<IWatch>(
  {
    name: { type: String, required: true },
    brand: { type: String, required: true, default: 'Castellan' },
    price: { type: Number, required: true },
    oldPrice: { type: Number, default: null },
    discount: { type: Number, default: 0 },
    currency: { type: String, default: 'EUR' },
    category: {
      type: String,
      enum: ['clasicos-vestir', 'cronografos', 'automaticos', 'piezas-coleccion'],
      required: true,
    },
    strapColor: String,
    strapMaterial: String,
    dialColor: String,
    caseMaterial: String,
    movement: String,
    description: String,
    stock: { type: Number, default: 0 },
    mpn: { type: String, default: '' },
    sku: { type: String, default: '' },
    status: {
      type: String,
      enum: ['IN_STOCK', 'OUT_OF_STOCK', 'DISCONTINUED'],
      default: 'IN_STOCK',
    },
    tag: {
      type: String,
      enum: ['Bestseller', 'New', 'Oferta', 'Limited', 'Premium', null],
      default: null,
    },
    image: String,
    gallery: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

export default mongoose.model<IWatch>('Watch', watchSchema);
