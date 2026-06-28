import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User, type IUser } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header && header.startsWith('Bearer ') ? header.split(' ')[1] : '';
  if (!token) return next(new ApiError(401, 'Unauthorized'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new ApiError(401, 'Invalid token user'));
    req.user = user as IUser;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
};
