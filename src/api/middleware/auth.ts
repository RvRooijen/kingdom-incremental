import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Simple authentication middleware for dev/admin routes
export interface AuthRequest extends Request {
  isAuthenticated?: boolean;
}

const DEV_PASSWORD_HASH = process.env['DEV_PASSWORD_HASH'] || crypto.createHash('sha256').update('dev-admin-password').digest('hex');

export const devAuthMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  const token = authHeader.substring(7);
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  
  if (tokenHash !== DEV_PASSWORD_HASH) {
    res.status(401).json({ error: 'Invalid authentication token' });
    return;
  }
  
  req.isAuthenticated = true;
  next();
};

// Middleware to check if user is authenticated (for API routes)
export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.isAuthenticated) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
};