export class ApiError extends Error {
  statusCode: number;
  errors?: unknown[];
  code?: string;

  constructor(statusCode: number, message: string, errors?: unknown[], code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.name = 'ApiError';
  }
}