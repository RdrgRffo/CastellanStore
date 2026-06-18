import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
  action: string;
  entity: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  details?: string;
  previousState?: Record<string, any>;
  createdAt: Date;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String },
    userId: { type: String },
    userName: { type: String },
    details: { type: String },
    previousState: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Índice para búsquedas rápidas
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entity: 1, entityId: 1 });

export default mongoose.model<IActivityLog>('ActivityLog', activityLogSchema);
