import { Request } from 'express';

export type UserRole = 'super_admin' | 'advisor' | 'associate_advisor' | 'admin_staff' | 'marketing_manager' | 'client';
export type UserStatus = 'active' | 'inactive' | 'suspended';
export type ClientStatus = 'prospect' | 'active' | 'dormant' | 'lost' | 'closed';
export type InteractionType = 'call' | 'email' | 'meeting' | 'note' | 'document';
export type MeetingType = 'review' | 'planning' | 'prospecting' | 'onboarding' | 'rebalancing' | 'general';
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'rescheduled';
export type PlanType = 'retirement' | 'education' | 'general' | 'estate' | 'tax';
export type PlanStatus = 'draft' | 'presented' | 'active' | 'completed' | 'archived';
export type CampaignType = 'email' | 'sms' | 'content' | 'event' | 'webinar';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'paused' | 'failed';
export type DocumentType = 'agreement' | 'disclosure' | 'plan' | 'report' | 'financial_statement' | 'correspondence' | 'other';
export type DocumentStatus = 'draft' | 'final' | 'signed' | 'archived';
export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface JWTPayload {
  userId: string;
  organizationId: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  organizationId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Entity Types
export interface Organization {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  logoUrl?: string;
  subscriptionTier: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  title?: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  bio?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  organizationId: string;
  advisorId: string;
  email?: string;
  phone?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  maritalStatus?: string;
  occupation?: string;
  householdIncome?: number;
  netWorth?: number;
  riskProfile?: string;
  status: ClientStatus;
  tags?: string[];
  lastContactAt?: Date;
  nextReviewDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Portfolio {
  id: string;
  clientId: string;
  advisorId: string;
  accountNumber?: string;
  accountType?: string;
  totalValue: number;
  cashPosition: number;
  riskScore?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialPlan {
  id: string;
  clientId: string;
  advisorId: string;
  planType: PlanType;
  title?: string;
  description?: string;
  status: PlanStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meeting {
  id: string;
  organizationId: string;
  advisorId: string;
  clientId?: string;
  title: string;
  description?: string;
  type: MeetingType;
  status: MeetingStatus;
  startTime: Date;
  endTime: Date;
  location?: string;
  isVirtual: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  organizationId: string;
  advisorId: string;
  campaignType: CampaignType;
  name: string;
  description?: string;
  status: CampaignStatus;
  sendDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Interaction {
  id: string;
  clientId: string;
  advisorId: string;
  type: InteractionType;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}
