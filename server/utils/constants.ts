export const Roles = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SALON_OWNER: 'salon_owner',
  STAFF: 'staff',
  CUSTOMER: 'customer'
} as const);

export type Role = typeof Roles[keyof typeof Roles];

export const SalonStatus = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  SUSPENDED: 'suspended'
} as const);

export type SalonStatusType = typeof SalonStatus[keyof typeof SalonStatus];

export const BookingStatus = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const);

export type BookingStatusType = typeof BookingStatus[keyof typeof BookingStatus];

export const ReviewStatus = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  FLAGGED: 'flagged',
  DELETED: 'deleted'
} as const);

export type ReviewStatusType = typeof ReviewStatus[keyof typeof ReviewStatus];

export const UserStatus = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended'
} as const);

export type UserStatusType = typeof UserStatus[keyof typeof UserStatus];

// Machine-readable ApiError codes, for clients that need to react to a specific
// failure (not just display err.message) — e.g. switching straight to OTP entry.
export const ErrorCodes = Object.freeze({
  ACCOUNT_NOT_VERIFIED: 'ACCOUNT_NOT_VERIFIED'
} as const);

export const EventCategory = Object.freeze({
  BRIDAL: 'bridal',
  PARTY: 'party',
  EID: 'eid',
  INDEPENDENCE_DAY: 'independence_day',
  BIRTHDAY: 'birthday',
  ENGAGEMENT: 'engagement',
  ANNIVERSARY: 'anniversary',
  CORPORATE: 'corporate',
  WEDDING: 'wedding',
  OTHER: 'other'
} as const);

export type EventCategoryType = typeof EventCategory[keyof typeof EventCategory];

export const PaymentStatus = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
  DISPUTED: 'disputed'
} as const);

export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];

export const RefundStatus = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const);

export type RefundStatusType = typeof RefundStatus[keyof typeof RefundStatus];

export const FraudFlag = Object.freeze({
  NONE: 'none',
  DUPLICATE_TRANSACTION: 'duplicate_transaction',
  RAPID_BOOKING: 'rapid_booking',
  SUSPICIOUS_AMOUNT: 'suspicious_amount',
  VELOCITY_EXCEEDED: 'velocity_exceeded',
  MANUAL_REVIEW: 'manual_review'
} as const);

export type FraudFlagType = typeof FraudFlag[keyof typeof FraudFlag];