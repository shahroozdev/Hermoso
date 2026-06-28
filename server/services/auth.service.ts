import jwt from 'jsonwebtoken';

export const signAccessToken = (payload: object) => {
  const secret = process.env.JWT_SECRET as string;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, secret, { expiresIn } as any);
};

export const signRefreshToken = (payload: object) => {
  const secret = (process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET) as string;
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, secret, { expiresIn } as any);
};

export const verifyRefreshToken = (token: string) => {
  const secret = (process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET) as string;
  return jwt.verify(token, secret) as { id: string };
};

// Backward compatibility for existing imports
export const signToken = signAccessToken;
