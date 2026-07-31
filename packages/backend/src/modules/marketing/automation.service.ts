import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface CreateAutomationRequest {
  name: string;
  description?: string;
  automationType: 'email_sequence' | 'nurture_campaign' | 'drip_campaign' | 'behavioral' | 'scheduled';
  trigger?: string;
  targetSegment?: string;
  actionType?: string;
  actionValue?: string;
  enabled?: boolean;
  executionCount?: number;
}

export interface UpdateAutomationRequest {
  name?: string;
  description?: string;
  automationType?: string;
  trigger?: string;
  targetSegment?: string;
  actionType?: string;
  actionValue?: string;
  enabled?: boolean;
}

export interface AutomationResponse {
  id: string;
  name: string;
  description?: string;
  automationType: string;
  trigger?: string;
  targetSegment?: string;
  actionType?: string;
  actionValue?: string;
  enabled: boolean;
  executionCount: number;
  lastExecuted?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationListOptions {
  page?: number;
  limit?: number;
  automationType?: string;
  enabled?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const AutomationService = {
  async createAutomation(
    organizationId: string,
    advisorId: string,
    request: CreateAutomationRequest,
  ): Promise<AutomationResponse> {
    const db = getDatabase();
    const automationId = uuidv4();

    const { data, error } = await db
      .from('marketing_automations')
      .insert({
        id: automationId,
        organization_id: organizationId,
        advisor_id: advisorId,
        name: request.name,
        description: request.description,
        automation_type: request.automationType,
        trigger: request.trigger,
        target_segment: request.targetSegment,
        action_type: request.actionType,
        action_value: request.actionValue,
        enabled: request.enabled ?? true,
        execution_count: request.executionCount || 0,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'AUTOMATION_CREATE_ERROR', 'Failed to create automation');
    }

    return this.mapAutomationResponse(data);
  },

  async getAutomation(automationId: string, organizationId: string): Promise<AutomationResponse> {
    const db = getDatabase();

    const { data, error } = await db
      .from('marketing_automations')
      .select('*')
      .eq('id', automationId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'AUTOMATION_NOT_FOUND', 'Automation not found');
    }

    return this.mapAutomationResponse(data);
  },

  async listAutomations(
    organizationId: string,
    advisorId: string,
    options: AutomationListOptions = {},
  ): Promise<{ automations: AutomationResponse[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .from('marketing_automations')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (options.automationType) {
      query = query.eq('automation_type', options.automationType);
    }

    if (options.enabled !== undefined) {
      query = query.eq('enabled', options.enabled);
    }

    const sortColumn = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'AUTOMATION_LIST_ERROR', 'Failed to fetch automations');
    }

    return {
      automations: (data || []).map((a) => this.mapAutomationResponse(a)),
      total: count || 0,
    };
  },

  async updateAutomation(
    automationId: string,
    organizationId: string,
    request: UpdateAutomationRequest,
  ): Promise<AutomationResponse> {
    const db = getDatabase();

    await this.getAutomation(automationId, organizationId);

    const updateData: any = {};
    if (request.name !== undefined) updateData.name = request.name;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.automationType !== undefined) updateData.automation_type = request.automationType;
    if (request.trigger !== undefined) updateData.trigger = request.trigger;
    if (request.targetSegment !== undefined) updateData.target_segment = request.targetSegment;
    if (request.actionType !== undefined) updateData.action_type = request.actionType;
    if (request.actionValue !== undefined) updateData.action_value = request.actionValue;
    if (request.enabled !== undefined) updateData.enabled = request.enabled;

    const { data, error } = await db
      .from('marketing_automations')
      .update(updateData)
      .eq('id', automationId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'AUTOMATION_UPDATE_ERROR', 'Failed to update automation');
    }

    return this.mapAutomationResponse(data);
  },

  async deleteAutomation(automationId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    await this.getAutomation(automationId, organizationId);

    const { error } = await db.from('marketing_automations').delete().eq('id', automationId);

    if (error) {
      throw new ApiError(500, 'AUTOMATION_DELETE_ERROR', 'Failed to delete automation');
    }
  },

  async toggleAutomation(automationId: string, organizationId: string): Promise<AutomationResponse> {
    const db = getDatabase();

    const automation = await this.getAutomation(automationId, organizationId);

    const { data, error } = await db
      .from('marketing_automations')
      .update({ enabled: !automation.enabled })
      .eq('id', automationId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'AUTOMATION_UPDATE_ERROR', 'Failed to toggle automation');
    }

    return this.mapAutomationResponse(data);
  },

  async executeAutomation(automationId: string, organizationId: string): Promise<AutomationResponse> {
    const db = getDatabase();

    const automation = await this.getAutomation(automationId, organizationId);

    const { data, error } = await db
      .from('marketing_automations')
      .update({
        execution_count: (automation.executionCount || 0) + 1,
        last_executed: new Date().toISOString(),
      })
      .eq('id', automationId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'AUTOMATION_EXECUTE_ERROR', 'Failed to execute automation');
    }

    return this.mapAutomationResponse(data);
  },

  async getAutomationStats(
    organizationId: string,
    advisorId: string,
  ): Promise<{
    total: number;
    enabled: number;
    disabled: number;
    totalExecutions: number;
    byType: Record<string, number>;
  }> {
    const db = getDatabase();

    const { data, error } = await db
      .from('marketing_automations')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (error) {
      throw new ApiError(500, 'STATS_ERROR', 'Failed to fetch statistics');
    }

    const automations = data || [];
    const byType: Record<string, number> = {};

    automations.forEach((a) => {
      byType[a.automation_type] = (byType[a.automation_type] || 0) + 1;
    });

    const totalExecutions = automations.reduce((sum, a) => sum + (a.execution_count || 0), 0);

    return {
      total: automations.length,
      enabled: automations.filter((a) => a.enabled).length,
      disabled: automations.filter((a) => !a.enabled).length,
      totalExecutions,
      byType,
    };
  },

  private mapAutomationResponse(dbAutomation: any): AutomationResponse {
    return {
      id: dbAutomation.id,
      name: dbAutomation.name,
      description: dbAutomation.description,
      automationType: dbAutomation.automation_type,
      trigger: dbAutomation.trigger,
      targetSegment: dbAutomation.target_segment,
      actionType: dbAutomation.action_type,
      actionValue: dbAutomation.action_value,
      enabled: dbAutomation.enabled,
      executionCount: dbAutomation.execution_count,
      lastExecuted: dbAutomation.last_executed,
      createdAt: dbAutomation.created_at,
      updatedAt: dbAutomation.updated_at,
    };
  },
};
