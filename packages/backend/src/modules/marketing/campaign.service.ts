import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  campaignType: 'email' | 'sms' | 'push' | 'webinar' | 'content' | 'event' | 'educational';
  targetSegment?: string;
  status?: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';
  startDate?: string;
  endDate?: string;
  budget?: number;
  expectedReach?: number;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  campaignType?: string;
  targetSegment?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  expectedReach?: number;
}

export interface CampaignResponse {
  id: string;
  name: string;
  description?: string;
  campaignType: string;
  targetSegment?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  expectedReach?: number;
  actualReach?: number;
  conversions?: number;
  conversionRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignListOptions {
  page?: number;
  limit?: number;
  campaignType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const CampaignService = {
  async createCampaign(
    organizationId: string,
    advisorId: string,
    request: CreateCampaignRequest,
  ): Promise<CampaignResponse> {
    const db = getDatabase();
    const campaignId = uuidv4();

    const { data, error } = await db
      .from('marketing_campaigns')
      .insert({
        id: campaignId,
        organization_id: organizationId,
        advisor_id: advisorId,
        name: request.name,
        description: request.description,
        campaign_type: request.campaignType,
        target_segment: request.targetSegment,
        status: request.status || 'draft',
        start_date: request.startDate,
        end_date: request.endDate,
        budget: request.budget,
        expected_reach: request.expectedReach,
        actual_reach: 0,
        conversions: 0,
        conversion_rate: 0,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'CAMPAIGN_CREATE_ERROR', 'Failed to create campaign');
    }

    return this.mapCampaignResponse(data);
  },

  async getCampaign(campaignId: string, organizationId: string): Promise<CampaignResponse> {
    const db = getDatabase();

    const { data, error } = await db
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found');
    }

    return this.mapCampaignResponse(data);
  },

  async listCampaigns(
    organizationId: string,
    advisorId: string,
    options: CampaignListOptions = {},
  ): Promise<{ campaigns: CampaignResponse[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .from('marketing_campaigns')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (options.campaignType) {
      query = query.eq('campaign_type', options.campaignType);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.startDate && options.endDate) {
      query = query.gte('start_date', options.startDate).lte('start_date', options.endDate);
    }

    const sortColumn = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'CAMPAIGN_LIST_ERROR', 'Failed to fetch campaigns');
    }

    return {
      campaigns: (data || []).map((c) => this.mapCampaignResponse(c)),
      total: count || 0,
    };
  },

  async updateCampaign(
    campaignId: string,
    organizationId: string,
    request: UpdateCampaignRequest,
  ): Promise<CampaignResponse> {
    const db = getDatabase();

    await this.getCampaign(campaignId, organizationId);

    const updateData: any = {};
    if (request.name !== undefined) updateData.name = request.name;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.campaignType !== undefined) updateData.campaign_type = request.campaignType;
    if (request.targetSegment !== undefined) updateData.target_segment = request.targetSegment;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.startDate !== undefined) updateData.start_date = request.startDate;
    if (request.endDate !== undefined) updateData.end_date = request.endDate;
    if (request.budget !== undefined) updateData.budget = request.budget;
    if (request.expectedReach !== undefined) updateData.expected_reach = request.expectedReach;

    const { data, error } = await db
      .from('marketing_campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'CAMPAIGN_UPDATE_ERROR', 'Failed to update campaign');
    }

    return this.mapCampaignResponse(data);
  },

  async deleteCampaign(campaignId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    await this.getCampaign(campaignId, organizationId);

    const { error } = await db.from('marketing_campaigns').delete().eq('id', campaignId);

    if (error) {
      throw new ApiError(500, 'CAMPAIGN_DELETE_ERROR', 'Failed to delete campaign');
    }
  },

  async updateCampaignMetrics(
    campaignId: string,
    organizationId: string,
    metrics: { actualReach?: number; conversions?: number },
  ): Promise<CampaignResponse> {
    const db = getDatabase();

    const campaign = await this.getCampaign(campaignId, organizationId);

    const updateData: any = {};
    if (metrics.actualReach !== undefined) updateData.actual_reach = metrics.actualReach;
    if (metrics.conversions !== undefined) updateData.conversions = metrics.conversions;

    if (metrics.conversions !== undefined && campaign.expectedReach) {
      updateData.conversion_rate = (metrics.conversions / campaign.expectedReach) * 100;
    }

    const { data, error } = await db
      .from('marketing_campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'CAMPAIGN_UPDATE_ERROR', 'Failed to update campaign metrics');
    }

    return this.mapCampaignResponse(data);
  },

  async getCampaignStats(
    organizationId: string,
    advisorId: string,
  ): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    completedCampaigns: number;
    draftCampaigns: number;
    totalBudget: number;
    totalReach: number;
    averageConversionRate: number;
    byType: Record<string, number>;
  }> {
    const db = getDatabase();

    const { data, error } = await db
      .from('marketing_campaigns')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (error) {
      throw new ApiError(500, 'STATS_ERROR', 'Failed to fetch statistics');
    }

    const campaigns = data || [];
    const byType: Record<string, number> = {};

    campaigns.forEach((c) => {
      byType[c.campaign_type] = (byType[c.campaign_type] || 0) + 1;
    });

    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalReach = campaigns.reduce((sum, c) => sum + (c.actual_reach || 0), 0);
    const averageConversionRate = campaigns.length > 0
      ? campaigns.reduce((sum, c) => sum + (c.conversion_rate || 0), 0) / campaigns.length
      : 0;

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      completedCampaigns: campaigns.filter((c) => c.status === 'completed').length,
      draftCampaigns: campaigns.filter((c) => c.status === 'draft').length,
      totalBudget,
      totalReach,
      averageConversionRate,
      byType,
    };
  },

  private mapCampaignResponse(dbCampaign: any): CampaignResponse {
    return {
      id: dbCampaign.id,
      name: dbCampaign.name,
      description: dbCampaign.description,
      campaignType: dbCampaign.campaign_type,
      targetSegment: dbCampaign.target_segment,
      status: dbCampaign.status,
      startDate: dbCampaign.start_date,
      endDate: dbCampaign.end_date,
      budget: dbCampaign.budget,
      expectedReach: dbCampaign.expected_reach,
      actualReach: dbCampaign.actual_reach,
      conversions: dbCampaign.conversions,
      conversionRate: dbCampaign.conversion_rate,
      createdAt: dbCampaign.created_at,
      updatedAt: dbCampaign.updated_at,
    };
  },
};
