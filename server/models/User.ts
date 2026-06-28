import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import {
  Roles,
  UserStatus,
  type Role,
  type UserStatusType,
} from "../utils/constants.js";

export interface IStaffDetails {
  employeeId?: string;

  designation?: string;

  salary?: number;

  salaryType?: "monthly" | "weekly" | "daily" | "hourly";

  joiningDate?: Date;

  shiftStartTime?: string;

  shiftEndTime?: string;

  workingDays?: (
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday"
  )[];

  commissionPercentage?: number;

  emergencyContact?: string;
  services?: mongoose.Types.ObjectId[] | null;
}
export interface IUser extends Document {
  salonId?: mongoose.Types.ObjectId | null;
  name: string;
  email: string;
  password: string;
  phone?: string;
  location?: {
    city?: string;
    country?: string;
  };
  bankAccount?: string;
  role: Role;
  status: UserStatusType;
  staffDetails?: IStaffDetails;
  isVerified: boolean;
  otpCodeHash?: string | null;
  otpExpiresAt?: Date | null;
  resetPasswordTokenHash?: string | null;
  resetPasswordExpiresAt?: Date | null;
  comparePassword(rawPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    salonId: {
      type: Schema.Types.ObjectId,
      ref: "Salon",
      index: true,
      default: null,
    },
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true, default: "" },
    location: {
      city: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "" },
    },
    bankAccount: { type: String, trim: true, default: "" },
    role: {
      type: String,
      enum: Object.values(Roles),
      default: Roles.CUSTOMER,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE,
      index: true,
    },
    isVerified: { type: Boolean, default: false, index: true },
    otpCodeHash: { type: String, default: null, select: false },
    otpExpiresAt: { type: Date, default: null, select: false },
    resetPasswordTokenHash: { type: String, default: null, select: false },
    resetPasswordExpiresAt: { type: Date, default: null, select: false },
    staffDetails: {
      employeeId: {
        type: String,
        unique: true,
        sparse: true,
      },

      designation: {
        type: String,
        required: function () {
          return this.role === Roles.STAFF;
        },
      },

      salary: {
        type: Number,
        required: function () {
          return this.role === Roles.STAFF;
        },
      },

      salaryType: {
        type: String,
        enum: ["monthly", "weekly", "daily", "hourly"],
      },

      joiningDate: Date,

      shiftStartTime: String,

      shiftEndTime: String,

      workingDays: [String],

      commissionPercentage: {
        type: Number,
        default: 0,
      },
      services: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.pre("save", async function (next) {
  try {
    // Generate only for new STAFF users
    if (
      this.isNew &&
      this.role === Roles.STAFF &&
      !this.staffDetails?.employeeId
    ) {
      if (!this.salonId) {
        return next(new Error("Salon is required for staff users"));
      }

      // Count existing staff in this salon
      const staffCount = await mongoose.model("User").countDocuments({
        salonId: this.salonId,
        role: Roles.STAFF,
      });

      // Example:
      // SALONID-EMP001-05-2026

      const count = String(staffCount + 1).padStart(3, "0");

      const now = new Date();

      const month = new Intl.DateTimeFormat("en", {
        month: "2-digit",
      }).format(now);

      const year = new Intl.DateTimeFormat("en", {
        year: "numeric",
      }).format(now);

      // Short salon id
      const salonCode = String(this.salonId).slice(-5).toUpperCase();

      this.staffDetails.employeeId = `${salonCode}-EMP${count}-${month}-${year}`;
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});
userSchema.methods.comparePassword = function comparePassword(
  rawPassword: string,
) {
  return bcrypt.compare(rawPassword, this.password);
};

export const User = mongoose.model<IUser>("User", userSchema);
