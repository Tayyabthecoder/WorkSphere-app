import mongoose, { Schema, Document } from 'mongoose';

export type AvailabilityType = 'pto' | 'holiday' | 'partial';

export interface IAvailability extends Document {
  availabilityId: string;
  tenantId: string;
  userId: string;
  date: Date;
  type: AvailabilityType;
  hoursAvailable: number; // 0 for full-day PTO/Holiday, 1-7 for partial
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilitySchema = new Schema<IAvailability>(
  {
    availabilityId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    date: { type: Date, required: true, index: true },
    type: {
      type: String,
      enum: ['pto', 'holiday', 'partial'],
      default: 'pto',
      required: true,
    },
    hoursAvailable: { type: Number, default: 0 },
    note: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

AvailabilitySchema.index({ tenantId: 1, userId: 1, date: 1 }, { unique: true });
AvailabilitySchema.index({ tenantId: 1, date: 1 });

export const AvailabilityModel =
  mongoose.models.Availability ||
  mongoose.model<IAvailability>('Availability', AvailabilitySchema);

export default AvailabilityModel;
