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