import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { dbStorage } from './storage.new';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '10m'; // Access token expires in 10 minutes 
const JWT_REFRESH_EXPIRES_IN = '1h'; // Refresh token expires in 1 hour for user session

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: 'admin' | 'manager' | 'designer' | 'viewer';
    active: boolean;
  };
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(user: { id: number; username: string; email: string; fullName: string; role: string; active: boolean }): { accessToken: string; refreshToken: string } {
    const now = Math.floor(Date.now() / 1000);
    
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        active: user.active,
        type: 'access',
        lastActivity: now
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        type: 'refresh',
        lastActivity: now
      },
      JWT_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  static async login(username: string, password: string): Promise<{ user: any; accessToken: string; refreshToken: string } | null> {
    const user = await dbStorage.getUserByUsername(username);
    if (!user || !user.active) {
      return null;
    }

    const isPasswordValid = await this.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { accessToken, refreshToken } = this.generateToken(user);
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;
      
      if (decoded.type !== 'refresh') {
        return null;
      }

      // Check session timeout - 1 hour of inactivity
      const now = Math.floor(Date.now() / 1000);
      const lastActivity = decoded.lastActivity || decoded.iat; // fallback to issued time for old tokens
      const sessionTimeoutSeconds = 60 * 60; // 1 hour
      
      if (now - lastActivity > sessionTimeoutSeconds) {
        console.log(`Session expired due to inactivity. Last activity: ${new Date(lastActivity * 1000)}, Now: ${new Date(now * 1000)}`);
        return null;
      }

      const user = await dbStorage.getUser(decoded.id);
      if (!user || !user.active) {
        return null;
      }

      return this.generateToken(user);
    } catch (error) {
      return null;
    }
  }
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = AuthService.verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  // Check if this is an access token (for new tokens) or allow old tokens without type
  if (decoded.type && decoded.type !== 'access') {
    return res.status(403).json({ message: 'Invalid token type' });
  }

  // Verify user still exists and is active
  const user = await dbStorage.getUser(decoded.id);
  if (!user || !user.active) {
    return res.status(403).json({ message: 'User not found or inactive' });
  }

  req.user = decoded;
  next();
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export const requirePermission = (module: string, action: 'view' | 'create' | 'edit' | 'delete') => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Admin has all permissions
    if (req.user.role === 'admin') {
      return next();
    }

    try {
      // Get user permissions for the module
      const permissions = await dbStorage.getUserPermissions(req.user.role, module);
      
      if (!permissions) {
        return res.status(403).json({ message: 'No permissions found for this module' });
      }

      let hasPermission = false;
      switch (action) {
        case 'view':
          hasPermission = permissions.canView;
          break;
        case 'create':
          hasPermission = permissions.canCreate;
          break;
        case 'edit':
          hasPermission = permissions.canEdit;
          break;
        case 'delete':
          hasPermission = permissions.canDelete;
          break;
      }

      if (!hasPermission) {
        return res.status(403).json({ 
          message: `You don't have permission to ${action} ${module}` 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ message: 'Permission check failed' });
    }
  };
};