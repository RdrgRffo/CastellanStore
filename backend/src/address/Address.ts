import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    country: { type: String, default: 'España', trim: true },
    phone: { type: String, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Índice para búsquedas por usuario
addressSchema.index({ userId: 1 });

export default mongoose.model<IAddress>('Address', addressSchema);
