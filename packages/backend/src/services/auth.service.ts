import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../db/connection';
import { generateToken } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { User } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  organizationName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export const AuthService = {
  async register(request: RegisterRequest): Promise<AuthResponse> {
    const db = getDatabase();

    // Check if user exists
    const { data: existingUser } = await db
      .from('users')
      .select('id')
      .eq('email', request.email)
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      throw new ApiError(409, 'EMAIL_EXISTS', 'Email already registered');
    }

    // Create organization if name provided
    let organizationId: string;
    if (request.organizationName) {
      const { data: org, error: orgError } = await db
        .from('organizations')
        .insert({ name: request.organizationName })
        .select('id')
        .single();

      if (orgError) {
        throw new ApiError(500, 'ORG_CREATE_ERROR', 'Failed to create organization');
      }
      organizationId = org.id;
    } else {
      // Use default organization or throw error
      const { data: orgs, error: orgError } = await db
        .from('organizations')
        .select('id')
        .eq('name', 'Default')
        .limit(1);

      if (orgError || !orgs || orgs.length === 0) {
        throw new ApiError(400, 'NO_ORGANIZATION', 'Organization required for registration');
      }
      organizationId = orgs[0].id;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(request.password, 10);

    // Create user
    const { data: user, error: userError } = await db
      .from('users')
      .insert({
        id: uuidv4(),
        organization_id: organizationId,
        email: request.email,
        password_hash: passwordHash,
        full_name: request.fullName,
        role: 'advisor',
        status: 'active',
        email_verified: true, // Auto-verify for testing
      })
      .select()
      .single();

    if (userError) {
      throw new ApiError(500, 'USER_CREATE_ERROR', 'Failed to create user account');
    }

    // Generate tokens
    const token = generateToken(
      {
        userId: user.id,
        organizationId: user.organization_id,
        email: user.email,
        role: user.role,
      },
      '24h',
    );

    const refreshToken = generateToken(
      {
        userId: user.id,
        organizationId: user.organization_id,
        email: user.email,
        role: user.role,
      },
      '30d',
    );

    return {
      user: this.mapUserResponse(user),
      token,
      refreshToken,
    };
  },

  async login(request: LoginRequest): Promise<AuthResponse> {
    const db = getDatabase();

    // Find user
    const { data: users, error: userError } = await db
      .from('users')
      .select('*')
      .eq('email', request.email)
      .limit(1);

    if (userError || !users || users.length === 0) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const user = users[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(request.password, user.password_hash);
    if (!passwordMatch) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'active') {
      throw new ApiError(401, 'ACCOUNT_DISABLED', 'Account is inactive or suspended');
    }

    // Update last login
    await db
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Generate tokens
    const token = generateToken(
      {
        userId: user.id,
        organizationId: user.organization_id,
        email: user.email,
        role: user.role,
      },
      '24h',
    );

    const refreshToken = generateToken(
      {
        userId: user.id,
        organizationId: user.organization_id,
        email: user.email,
        role: user.role,
      },
      '30d',
    );

    return {
      user: this.mapUserResponse(user),
      token,
      refreshToken,
    };
  },

  async verifyToken(token: string): Promise<boolean> {
    try {
      const { data, error } = await getDatabase()
        .from('sessions')
        .select('id')
        .eq('token', token)
        .limit(1);

      return !error && data && data.length > 0;
    } catch {
      return false;
    }
  },

  private mapUserResponse(dbUser: any): User {
    return {
      id: dbUser.id,
      organizationId: dbUser.organization_id,
      email: dbUser.email,
      fullName: dbUser.full_name,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      phone: dbUser.phone,
      title: dbUser.title,
      role: dbUser.role,
      status: dbUser.status,
      avatarUrl: dbUser.avatar_url,
      bio: dbUser.bio,
      lastLogin: dbUser.last_login ? new Date(dbUser.last_login) : undefined,
      createdAt: new Date(dbUser.created_at),
      updatedAt: new Date(dbUser.updated_at),
    };
  },
};
