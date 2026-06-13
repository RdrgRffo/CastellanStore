import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string | null;
  provider: 'LOCAL' | 'GOOGLE';
  role: 'ROLE_USER' | 'ROLE_MANAGER';
  birthDate: Date | null;
  picture?: string;
  blocked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: '' },
    passwordHash: { type: String, default: null },
    provider: { type: String, enum: ['LOCAL', 'GOOGLE'], required: true },
    role: { type: String, enum: ['ROLE_USER', 'ROLE_MANAGER'], default: 'ROLE_USER' },
    birthDate: { type: Date, default: null },
    picture: { type: String, default: null },
    blocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
