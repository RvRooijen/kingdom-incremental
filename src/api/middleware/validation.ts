import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';

export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export const validate = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};
    
    for (const rule of rules) {
      const value = req.body[rule.field];
      const fieldErrors: string[] = [];
      
      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(`${rule.field} is required`);
      }
      
      // Skip other validations if field is not present and not required
      if (!rule.required && (value === undefined || value === null)) {
        continue;
      }
      
      // Type validation
      if (rule.type && value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rule.type) {
          fieldErrors.push(`${rule.field} must be of type ${rule.type}`);
        }
      }
      
      // Min/Max validation for numbers and string length
      if (rule.type === 'number' && typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          fieldErrors.push(`${rule.field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          fieldErrors.push(`${rule.field} must be at most ${rule.max}`);
        }
      } else if (rule.type === 'string' && typeof value === 'string') {
        if (rule.min !== undefined && value.length < rule.min) {
          fieldErrors.push(`${rule.field} must be at least ${rule.min} characters`);
        }
        if (rule.max !== undefined && value.length > rule.max) {
          fieldErrors.push(`${rule.field} must be at most ${rule.max} characters`);
        }
      }
      
      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        fieldErrors.push(`${rule.field} has invalid format`);
      }
      
      // Custom validation
      if (rule.custom && value !== undefined && value !== null) {
        const result = rule.custom(value);
        if (result !== true) {
          fieldErrors.push(typeof result === 'string' ? result : `${rule.field} is invalid`);
        }
      }
      
      // Add errors if any
      if (fieldErrors.length > 0) {
        errors[rule.field] = fieldErrors;
      }
    }
    
    // If there are errors, throw ValidationError
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Validation failed', errors);
    }
    
    next();
  };
};

// Common validation rules
export const validateUUID = (fieldName: string = 'id') => {
  return validate([{
    field: fieldName,
    required: true,
    type: 'string',
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    custom: (value) => `${fieldName} must be a valid UUID`
  }]);
};

export const validateKingdomName = validate([{
  field: 'name',
  required: true,
  type: 'string',
  min: 3,
  max: 50,
  pattern: /^[a-zA-Z0-9\s'-]+$/,
  custom: (value) => 'Kingdom name can only contain letters, numbers, spaces, hyphens and apostrophes'
}]);