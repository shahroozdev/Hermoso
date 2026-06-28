import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiError } from './ApiError.js';

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const asyncHandler = (
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) => Promise<any>,
  schemas?: ValidationSchemas
): RequestHandler => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate request with Zod schemas if provided
      if (schemas) {
        if (schemas.body) {
          req.body = schemas.body.parse(req.body);
        }
        if (schemas.query) {
          req.query = schemas.query.parse(req.query) as unknown as typeof req.query;
        }
        if (schemas.params) {
          req.params = schemas.params.parse(req.params) as unknown as typeof req.params;
        }
      }

      await fn(req, res, next);
    } catch (error: unknown) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        const formattedErrors = (error as ZodError).issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));

        next(
          new ApiError(
            422,
            'Validation failed',
            formattedErrors
          )
        );
        return;
      }

      if (error instanceof ApiError) {
        next(error);
        return;
      }

      if (isMongooseValidationError(error)) {
        const messages = Object.values(error.errors).map(
          (e: { message: string }) => e.message
        );

        next(
          new ApiError(
            400,
            `Validation Error: ${messages.join(', ')}`
          )
        );
        return;
      }

      if (isMongooseDuplicateKeyError(error)) {
        const field = Object.keys(error.keyValue).join(', ');

        next(
          new ApiError(
            409,
            `Duplicate value for field: ${field}`
          )
        );
        return;
      }

      if (isMongooseCastError(error)) {
        next(
          new ApiError(
            400,
            `Invalid value for field: ${error.path}`
          )
        );
        return;
      }

      if (error instanceof Error) {
        if (error.name === 'JsonWebTokenError') {
          next(new ApiError(401, 'Invalid token'));
          return;
        }

        if (error.name === 'TokenExpiredError') {
          next(new ApiError(401, 'Token has expired'));
          return;
        }
      }

      if (error instanceof SyntaxError && 'body' in error) {
        next(new ApiError(400, 'Malformed JSON in request body'));
        return;
      }

      if (error instanceof Error) {
        next(
          new ApiError(
            500,
            error.message || 'Internal Server Error'
          )
        );
        return;
      }

      next(new ApiError(500, 'An unexpected error occurred'));
    }
  };
};

// ── Type guards ─────────────────────────────────────────────

function isMongooseValidationError(error: unknown): error is {
  name: string;
  errors: Record<string, unknown>;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as Record<string, unknown>).name === 'ValidationError' &&
    'errors' in error
  );
}

function isMongooseDuplicateKeyError(error: unknown): error is {
  code: number;
  keyValue: Record<string, unknown>;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as Record<string, unknown>).code === 11000 &&
    'keyValue' in error
  );
}

function isMongooseCastError(error: unknown): error is {
  name: string;
  path: string;
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as Record<string, unknown>).name === 'CastError' &&
    'path' in error
  );
}
