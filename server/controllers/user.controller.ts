import { Response } from 'express';
import { User } from '../models/User.js';
import { Roles } from '../utils/constants.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

interface CreateOwnerBody {
  name: string;
  city: string;
  country: string;
  email?: string;
  password?: string;
  phone?: string;
  bankAccount?: string;
}

interface UpdateProfileBody {
  name?: string;
  phone?: string;
  city?: string;
  country?: string;
  bankAccount?: string;
}

interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

const normalizeEmailBase = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '') || 'owner';

const serializeUser = (user: any) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  location: user.location || { city: '', country: '' },
  bankAccount: user.bankAccount || '',
  role: user.role,
  status: user.status,
  salonId: user.salonId || null
});

export const getMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({ success: true, data: serializeUser(user) });
});

export const updateMyProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { name, phone, city, country, bankAccount } = req.body as UpdateProfileBody;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (name !== undefined) {
    if (!name.trim()) throw new ApiError(400, 'Name is required');
    user.name = name.trim();
  }

  if (phone !== undefined) {
    user.phone = phone.trim();
  }

  user.location = {
    city: city !== undefined ? city.trim() : user.location?.city || '',
    country: country !== undefined ? country.trim() : user.location?.country || ''
  };

  if (bankAccount !== undefined) {
    user.bankAccount = bankAccount.trim();
  }

  await user.save();

  res.json({ success: true, data: serializeUser(user) });
});

export const changeMyPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { currentPassword, newPassword } = req.body as ChangePasswordBody;
  if (!currentPassword?.trim() || !newPassword?.trim()) {
    throw new ApiError(400, 'Current password and new password are required');
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const matches = await user.comparePassword(currentPassword);
  if (!matches) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
});

export const listOwners = asyncHandler(async (_req: AuthRequest, res: Response) => {
  const owners = await User.aggregate([
    { $match: { role: Roles.SALON_OWNER } },
    {
      $lookup: {
        from: 'salons',
        localField: '_id',
        foreignField: 'ownerId',
        as: 'salons'
      }
    },
    {
      $addFields: {
        salonsCount: { $size: '$salons' }
      }
    },
    {
      $project: {
        name: 1,
        email: 1,
        phone: 1,
        location: 1,
        bankAccount: 1,
        salonsCount: 1
      }
    },
    { $sort: { name: 1 } }
  ]);

  res.json({ success: true, data: owners });
});

export const createOwner = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, city, country, email, password, phone, bankAccount } = req.body as CreateOwnerBody;

  if (!name?.trim() || !city?.trim() || !country?.trim()) {
    throw new ApiError(400, 'Name, city and country are required');
  }

  const finalEmail = email?.trim().toLowerCase() || `${normalizeEmailBase(name)}.${Date.now()}@hermoso.local`;
  const finalPassword = password?.trim() || `Owner@${Math.random().toString(36).slice(-8)}A1`;

  const exists = await User.findOne({ email: finalEmail });
  if (exists) {
    throw new ApiError(409, 'Email already registered');
  }

  const owner = await User.create({
    name: name.trim(),
    email: finalEmail,
    password: finalPassword,
    phone: phone?.trim() || '',
    bankAccount: bankAccount?.trim() || '',
    location: {
      city: city.trim(),
      country: country.trim()
    },
    role: Roles.SALON_OWNER,
    isVerified: true // Owner accounts are verified by default
  });

  res.status(201).json({
    success: true,
    data: {
      _id: owner._id,
      name: owner.name,
      email: owner.email,
      phone: owner.phone,
      location: owner.location,
      bankAccount: owner.bankAccount,
      salonsCount: 0
    },
    credentials: {
      email: owner.email,
      password: finalPassword,
      generated: !email || !password
    }
  });
});
