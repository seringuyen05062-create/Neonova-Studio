import { NextResponse } from 'next/server';
import { log } from './logger';

/**
 * Standardized error handling for API routes
 */

export interface APIError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export class APIErrorHandler {
  private static instance: APIErrorHandler;
  private isProduction = process.env.NODE_ENV === 'production';

  private constructor() {}

  static getInstance(): APIErrorHandler {
    if (!APIErrorHandler.instance) {
      APIErrorHandler.instance = new APIErrorHandler();
    }
    return APIErrorHandler.instance;
  }

  /**
   * Handle API errors with consistent response format
   */
  handleError(error: unknown, module: string, context?: string): NextResponse {
    const apiError = this.normalizeError(error);
    
    // Log error with context
    log.error(module, `API Error${context ? ` in ${context}` : ''}`, error as Error, {
      code: apiError.code,
      statusCode: apiError.statusCode
    });

    // Return sanitized response
    return NextResponse.json(
      {
        error: {
          code: apiError.code,
          message: this.getSafeMessage(apiError.message),
          ...(this.isProduction ? {} : { details: apiError.details })
        }
      },
      { status: apiError.statusCode }
    );
  }

  /**
   * Normalize different types of errors to APIError format
   */
  private normalizeError(error: unknown): APIError {
    if (error instanceof APIErrorClass) {
      return error.toAPIError();
    }

    if (error instanceof Error) {
      return {
        code: 'INTERNAL_ERROR',
        message: error.message,
        details: error.stack,
        statusCode: 500
      };
    }

    if (typeof error === 'string') {
      return {
        code: 'INTERNAL_ERROR',
        message: error,
        statusCode: 500
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      details: error,
      statusCode: 500
    };
  }

  /**
   * Get safe error message for production
   */
  private getSafeMessage(message: string): string {
    if (this.isProduction) {
      // Don't expose internal details in production
      const safeMessages: Record<string, string> = {
        'API_KEY_MISSING': 'Service temporarily unavailable',
        'VALIDATION_ERROR': 'Invalid request data',
        'INTERNAL_ERROR': 'Internal server error',
        'UNKNOWN_ERROR': 'An error occurred, please try again'
      };
      
      return safeMessages[message] || 'Service temporarily unavailable';
    }
    
    return message;
  }
}

/**
 * Custom error class for API errors
 */
export class APIErrorClass extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }

  toAPIError(): APIError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode
    };
  }
}

// Convenience error creators
export const createAPIError = {
  validation: (message: string, details?: any) => 
    new APIErrorClass('VALIDATION_ERROR', message, 400, details),
  
  unauthorized: (message: string = 'Unauthorized') => 
    new APIErrorClass('UNAUTHORIZED', message, 401),
  
  forbidden: (message: string = 'Forbidden') => 
    new APIErrorClass('FORBIDDEN', message, 403),
  
  notFound: (message: string = 'Not found') => 
    new APIErrorClass('NOT_FOUND', message, 404),
  
  tooManyRequests: (message: string = 'Too many requests') => 
    new APIErrorClass('RATE_LIMITED', message, 429),
  
  internal: (message: string, details?: any) => 
    new APIErrorClass('INTERNAL_ERROR', message, 500, details),
  
  service: (message: string, details?: any) => 
    new APIErrorClass('SERVICE_ERROR', message, 503, details),
  
  apiKey: (service: string) => 
    new APIErrorClass('API_KEY_MISSING', `${service} API key not configured`, 500)
};

// Export singleton instance
export const errorHandler = APIErrorHandler.getInstance();