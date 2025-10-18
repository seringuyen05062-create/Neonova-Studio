import { log } from './logger';

/**
 * Input validation utilities with comprehensive checks
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

export class InputValidator {
  private static instance: InputValidator;

  private constructor() {}

  static getInstance(): InputValidator {
    if (!InputValidator.instance) {
      InputValidator.instance = new InputValidator();
    }
    return InputValidator.instance;
  }

  /**
   * Validate text input for TTS requests
   */
  validateTTSText(text: unknown): ValidationResult {
    const errors: string[] = [];
    
    // Type check
    if (typeof text !== 'string') {
      errors.push('Text must be a string');
      return { isValid: false, errors };
    }

    // Length checks
    if (text.length === 0) {
      errors.push('Text cannot be empty');
    }
    
    if (text.length > 2000) {
      errors.push('Text too long (maximum 2000 characters)');
    }

    // Content validation
    const sanitizedText = this.sanitizeText(text);
    if (sanitizedText.length === 0 && text.length > 0) {
      errors.push('Text contains only invalid characters');
    }

    // Pattern checks
    if (this.containsSuspiciousPatterns(text)) {
      errors.push('Text contains potentially unsafe content');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: sanitizedText
    };
  }

  /**
   * Validate voice configuration
   */
  validateVoiceConfig(config: unknown): ValidationResult {
    const errors: string[] = [];
    
    if (!config || typeof config !== 'object') {
      errors.push('Voice config must be an object');
      return { isValid: false, errors };
    }

    const voiceConfig = config as Record<string, any>;

    // Voice ID validation
    if (!voiceConfig.voice_id || typeof voiceConfig.voice_id !== 'string') {
      errors.push('Voice ID is required and must be a string');
    } else if (!this.isValidVoiceId(voiceConfig.voice_id)) {
      errors.push('Invalid voice ID format');
    }

    // Speed validation
    if (voiceConfig.speed !== undefined) {
      if (typeof voiceConfig.speed !== 'number' || 
          voiceConfig.speed < 0.5 || 
          voiceConfig.speed > 2.0) {
        errors.push('Speed must be a number between 0.5 and 2.0');
      }
    }

    // Rate validation
    if (voiceConfig.rate !== undefined) {
      if (typeof voiceConfig.rate !== 'string' || 
          !this.isValidRate(voiceConfig.rate)) {
        errors.push('Rate must be a valid rate string (slow, normal, fast)');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: this.sanitizeVoiceConfig(voiceConfig)
    };
  }

  /**
   * Validate animation parameters
   */
  validateAnimationParams(params: unknown): ValidationResult {
    const errors: string[] = [];
    
    if (!params || typeof params !== 'object') {
      errors.push('Animation parameters must be an object');
      return { isValid: false, errors };
    }

    const animParams = params as Record<string, any>;

    // Animation name validation
    if (animParams.animation && typeof animParams.animation !== 'string') {
      errors.push('Animation name must be a string');
    }

    // Duration validation
    if (animParams.duration !== undefined) {
      if (typeof animParams.duration !== 'number' || 
          animParams.duration < 0 || 
          animParams.duration > 300) {
        errors.push('Duration must be a number between 0 and 300 seconds');
      }
    }

    // Loop validation
    if (animParams.loop !== undefined && typeof animParams.loop !== 'boolean') {
      errors.push('Loop must be a boolean');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: this.sanitizeAnimationParams(animParams)
    };
  }

  /**
   * Validate file upload
   */
  validateFileUpload(file: File | null, allowedTypes: string[], maxSize: number): ValidationResult {
    const errors: string[] = [];

    if (!file) {
      errors.push('File is required');
      return { isValid: false, errors };
    }

    // Type validation
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Size validation
    if (file.size > maxSize) {
      errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
    }

    // Name validation
    if (this.containsSuspiciousFileName(file.name)) {
      errors.push('File name contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize text input
   */
  private sanitizeText(text: string): string {
    return text
      .trim()
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script-like patterns
      .replace(/javascript:|data:|vbscript:/gi, '');
  }

  /**
   * Check for suspicious patterns in text
   */
  private containsSuspiciousPatterns(text: string): boolean {
    const suspiciousPatterns = [
      /javascript:/i,
      /data:.*base64/i,
      /vbscript:/i,
      /<script/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /function\s*\(/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(text));
  }

  /**
   * Validate voice ID format
   */
  private isValidVoiceId(voiceId: string): boolean {
    // Assuming voice IDs are alphanumeric with dashes/underscores
    return /^[a-zA-Z0-9_-]+$/.test(voiceId) && voiceId.length <= 50;
  }

  /**
   * Validate rate string
   */
  private isValidRate(rate: string): boolean {
    const validRates = ['slow', 'normal', 'fast', 'x-slow', 'x-fast'];
    return validRates.includes(rate.toLowerCase());
  }

  /**
   * Check for suspicious file names
   */
  private containsSuspiciousFileName(fileName: string): boolean {
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|com|scr|pif)$/i,
      /[<>:"|?*]/,
      /^\./,
      /\.\./
    ];

    return suspiciousPatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * Sanitize voice configuration
   */
  private sanitizeVoiceConfig(config: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    if (config.voice_id && typeof config.voice_id === 'string') {
      sanitized.voice_id = config.voice_id.trim();
    }

    if (typeof config.speed === 'number') {
      sanitized.speed = Math.max(0.5, Math.min(2.0, config.speed));
    }

    if (typeof config.rate === 'string') {
      sanitized.rate = config.rate.toLowerCase();
    }

    return sanitized;
  }

  /**
   * Sanitize animation parameters
   */
  private sanitizeAnimationParams(params: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};

    if (params.animation && typeof params.animation === 'string') {
      sanitized.animation = params.animation.trim();
    }

    if (typeof params.duration === 'number') {
      sanitized.duration = Math.max(0, Math.min(300, params.duration));
    }

    if (typeof params.loop === 'boolean') {
      sanitized.loop = params.loop;
    }

    return sanitized;
  }
}

// Export singleton instance
export const validator = InputValidator.getInstance();

// Convenience validation functions
export const validateTTSRequest = (data: { text?: unknown; voice?: unknown }) => {
  const textResult = validator.validateTTSText(data.text);
  const voiceResult = data.voice ? validator.validateVoiceConfig(data.voice) : { isValid: true, errors: [] };

  return {
    isValid: textResult.isValid && voiceResult.isValid,
    errors: [...textResult.errors, ...voiceResult.errors],
    sanitized: {
      text: textResult.sanitized,
      voice: voiceResult.sanitized
    }
  };
};

export const validateAnimationRequest = (data: { params?: unknown }) => {
  return validator.validateAnimationParams(data.params);
};

export const validateVRMFile = (file: File | null) => {
  return validator.validateFileUpload(
    file,
    ['application/octet-stream', 'model/vrm', 'model/gltf-binary'],
    50 * 1024 * 1024 // 50MB
  );
};

export const validateVRMAFile = (file: File | null) => {
  return validator.validateFileUpload(
    file,
    ['application/octet-stream', 'model/vrma'],
    10 * 1024 * 1024 // 10MB
  );
};