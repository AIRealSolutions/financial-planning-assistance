import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { ApiError } from '../middleware/errorHandler';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, fullName, organizationName } = req.body;

    if (!email || !password || !fullName) {
      throw new ApiError(400, 'MISSING_FIELDS', 'Email, password, and fullName are required');
    }

    const result = await AuthService.register({
      email,
      password,
      fullName,
      organizationName,
    });

    res.status(201).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'MISSING_FIELDS', 'Email and password are required');
    }

    const result = await AuthService.login({
      email,
      password,
    });

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // In a real implementation, invalidate the token in database
    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/refresh
router.post('/refresh', authenticate, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    // In a real implementation, verify refresh token validity
    const { generateToken } = await import('../middleware/auth');
    const newToken = generateToken(
      {
        userId: req.user.userId,
        organizationId: req.user.organizationId,
        email: req.user.email,
        role: req.user.role,
      },
      '24h',
    );

    res.json({
      success: true,
      data: { token: newToken },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
