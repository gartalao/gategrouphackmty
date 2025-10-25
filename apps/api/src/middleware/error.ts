import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    logger.warn({ path: req.path, errors: err.errors }, 'Validation error');
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors,
    });
  }

  if (err instanceof AppError) {
    logger.warn({ statusCode: err.statusCode, message: err.message, path: req.path }, 'App error');
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  logger.error({ err, path: req.path }, 'Unhandled error');
  return res.status(500).json({
    error: 'Internal server error',
  });
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

