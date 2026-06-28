import mongoose, { Document, Schema } from 'mongoose';
import { BookingStatus, type BookingStatusType } from '../utils/constants.js';

export interface IBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  salonId: mongoose.Types.ObjectId;
  serviceId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  bookingDate: Date;
  bookingTime: string;
  status: BookingStatusType;
  price: number;
  notes: string;
  reminderSentAt: Date | null;
}

const bookingSchema = new Schema<IBooking>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    salonId: { type: Schema.Types.ObjectId, ref: 'Salon', required: true, index: true },
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
    staffId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bookingDate: { type: Date, required: true, index: true },
    bookingTime: { type: String, required: true },
    status: { type: String, enum: Object.values(BookingStatus), default: BookingStatus.PENDING, index: true },
    price: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
    reminderSentAt: { type: Date, default: null }
  },
  { timestamps: true }
);

bookingSchema.index(
  { salonId: 1, bookingDate: 1, bookingTime: 1, staffId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }
    }
  }
);

bookingSchema.pre('save', async function preventDuplicateSlot(next) {
  if (!this.isNew) return next();
  try {
    const existing = await mongoose.model<IBooking>('Booking').findOne({
      salonId: this.salonId,
      staffId: this.staffId,
      bookingDate: this.bookingDate,
      bookingTime: this.bookingTime,
      status: { $in: [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.COMPLETED] }
    }).select('_id');

    if (existing) return next(new Error('Time slot is already booked'));
    return next();
  } catch (error) {
    return next(error as Error);
  }
});

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
