import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { FinancialPlan, PlanType, PlanStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePlanRequest {
  clientId: string;
  planType: PlanType;
  title?: string;
  description?: string;
  reviewFrequency?: string;
}

export interface UpdatePlanRequest {
  title?: string;
  description?: string;
  status?: PlanStatus;
  reviewFrequency?: string;
  nextReviewDate?: string;
}

export interface PlanGoal {
  id: string;
  goalName: string;
  description?: string;
  targetAmount?: number;
  targetDate?: string;
  priority?: string;
  status: string;
  progressPercentage: number;
}

export interface PlanListOptions {
  page?: number;
  limit?: number;
  status?: PlanStatus;
  planType?: PlanType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const PlanService = {
  async createPlan(
    organizationId: string,
    advisorId: string,
    request: CreatePlanRequest,
  ): Promise<FinancialPlan> {
    const db = getDatabase();
    const planId = uuidv4();

    const { data, error } = await db
      .from('financial_plans')
      .insert({
        id: planId,
        organization_id: organizationId,
        client_id: request.clientId,
        advisor_id: advisorId,
        plan_type: request.planType,
        title: request.title || `${request.planType} Plan`,
        description: request.description,
        status: 'draft',
        review_frequency: request.reviewFrequency || 'annually',
        next_review_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_by: advisorId,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'PLAN_CREATE_ERROR', 'Failed to create plan');
    }

    return this.mapPlanResponse(data);
  },

  async getPlan(planId: string, organizationId: string): Promise<FinancialPlan> {
    const db = getDatabase();

    const { data, error } = await db
      .from('financial_plans')
      .select('*')
      .eq('id', planId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'PLAN_NOT_FOUND', 'Plan not found');
    }

    return this.mapPlanResponse(data);
  },

  async getClientPlans(
    clientId: string,
    organizationId: string,
    options: PlanListOptions = {},
  ): Promise<{ plans: FinancialPlan[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    let query = db
      .from('financial_plans')
      .select('*', { count: 'exact' })
      .eq('client_id', clientId)
      .eq('organization_id', organizationId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.planType) {
      query = query.eq('plan_type', options.planType);
    }

    const sortColumn = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'PLAN_LIST_ERROR', 'Failed to fetch plans');
    }

    return {
      plans: (data || []).map((p) => this.mapPlanResponse(p)),
      total: count || 0,
    };
  },

  async updatePlan(
    planId: string,
    organizationId: string,
    request: UpdatePlanRequest,
  ): Promise<FinancialPlan> {
    const db = getDatabase();

    // Verify plan exists
    await this.getPlan(planId, organizationId);

    const updateData: any = {};
    if (request.title !== undefined) updateData.title = request.title;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.status !== undefined) {
      updateData.status = request.status;
      if (request.status === 'presented') {
        updateData.presented_date = new Date().toISOString();
      }
      if (request.status === 'active') {
        updateData.accepted_date = new Date().toISOString();
      }
    }
    if (request.reviewFrequency !== undefined) updateData.review_frequency = request.reviewFrequency;
    if (request.nextReviewDate !== undefined) updateData.next_review_date = request.nextReviewDate;

    const { data, error } = await db
      .from('financial_plans')
      .update(updateData)
      .eq('id', planId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'PLAN_UPDATE_ERROR', 'Failed to update plan');
    }

    return this.mapPlanResponse(data);
  },

  async deletePlan(planId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    // Verify plan exists
    await this.getPlan(planId, organizationId);

    const { error } = await db.from('financial_plans').delete().eq('id', planId);

    if (error) {
      throw new ApiError(500, 'PLAN_DELETE_ERROR', 'Failed to delete plan');
    }
  },

  async addGoal(
    planId: string,
    goalName: string,
    description?: string,
    targetAmount?: number,
    targetDate?: string,
    priority?: string,
  ): Promise<PlanGoal> {
    const db = getDatabase();
    const goalId = uuidv4();

    const { data, error } = await db
      .from('plan_goals')
      .insert({
        id: goalId,
        plan_id: planId,
        goal_name: goalName,
        description,
        target_amount: targetAmount,
        target_date: targetDate,
        priority: priority || 'medium',
        status: 'pending',
        progress_percentage: 0,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'GOAL_CREATE_ERROR', 'Failed to create goal');
    }

    return this.mapGoalResponse(data);
  },

  async getPlanGoals(planId: string): Promise<PlanGoal[]> {
    const db = getDatabase();

    const { data, error } = await db
      .from('plan_goals')
      .select('*')
      .eq('plan_id', planId)
      .order('priority', { ascending: true });

    if (error) {
      throw new ApiError(500, 'GOAL_LIST_ERROR', 'Failed to fetch goals');
    }

    return (data || []).map((g) => this.mapGoalResponse(g));
  },

  async updateGoal(
    goalId: string,
    updates: {
      progressPercentage?: number;
      status?: string;
      targetAmount?: number;
    },
  ): Promise<PlanGoal> {
    const db = getDatabase();

    const updateData: any = {};
    if (updates.progressPercentage !== undefined) updateData.progress_percentage = updates.progressPercentage;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount;

    const { data, error } = await db
      .from('plan_goals')
      .update(updateData)
      .eq('id', goalId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'GOAL_UPDATE_ERROR', 'Failed to update goal');
    }

    return this.mapGoalResponse(data);
  },

  async deleteGoal(goalId: string): Promise<void> {
    const db = getDatabase();

    const { error } = await db.from('plan_goals').delete().eq('id', goalId);

    if (error) {
      throw new ApiError(500, 'GOAL_DELETE_ERROR', 'Failed to delete goal');
    }
  },

  async getPlanStats(organizationId: string, advisorId: string): Promise<{
    totalPlans: number;
    draftPlans: number;
    activePlans: number;
    completedPlans: number;
    plansByType: Record<string, number>;
  }> {
    const db = getDatabase();

    const { data, error } = await db
      .from('financial_plans')
      .select('status, plan_type')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (error) {
      throw new ApiError(500, 'STATS_ERROR', 'Failed to fetch statistics');
    }

    const plans = data || [];
    const plansByType: Record<string, number> = {};

    plans.forEach((p) => {
      plansByType[p.plan_type] = (plansByType[p.plan_type] || 0) + 1;
    });

    return {
      totalPlans: plans.length,
      draftPlans: plans.filter((p) => p.status === 'draft').length,
      activePlans: plans.filter((p) => p.status === 'active').length,
      completedPlans: plans.filter((p) => p.status === 'completed').length,
      plansByType,
    };
  },

  private mapPlanResponse(dbPlan: any): FinancialPlan {
    return {
      id: dbPlan.id,
      clientId: dbPlan.client_id,
      advisorId: dbPlan.advisor_id,
      planType: dbPlan.plan_type,
      title: dbPlan.title,
      description: dbPlan.description,
      status: dbPlan.status,
      createdAt: new Date(dbPlan.created_at),
      updatedAt: new Date(dbPlan.updated_at),
    };
  },

  private mapGoalResponse(dbGoal: any): PlanGoal {
    return {
      id: dbGoal.id,
      goalName: dbGoal.goal_name,
      description: dbGoal.description,
      targetAmount: dbGoal.target_amount,
      targetDate: dbGoal.target_date,
      priority: dbGoal.priority,
      status: dbGoal.status,
      progressPercentage: dbGoal.progress_percentage,
    };
  },
};
