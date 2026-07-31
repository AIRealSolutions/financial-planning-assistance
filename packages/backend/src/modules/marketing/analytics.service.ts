import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface CampaignMetric {
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue?: number;
}

export interface CreateMetricRequest {
  campaignId: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue?: number;
}

export interface AnalyticsResponse {
  id: string;
  campaignId: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue?: number;
  clickThroughRate: number;
  conversionRate: number;
  costPerAcquisition?: number;
  createdAt: string;
}

export const AnalyticsService = {
  async recordMetric(
    organizationId: string,
    request: CreateMetricRequest,
  ): Promise<AnalyticsResponse> {
    const db = getDatabase();
    const metricId = uuidv4();

    const clickThroughRate = request.impressions > 0 ? (request.clicks / request.impressions) * 100 : 0;
    const conversionRate = request.clicks > 0 ? (request.conversions / request.clicks) * 100 : 0;
    const costPerAcquisition = request.revenue && request.conversions > 0
      ? request.revenue / request.conversions
      : undefined;

    const { data, error } = await db
      .from('marketing_analytics')
      .insert({
        id: metricId,
        organization_id: organizationId,
        campaign_id: request.campaignId,
        date: request.date,
        impressions: request.impressions,
        clicks: request.clicks,
        conversions: request.conversions,
        revenue: request.revenue,
        click_through_rate: clickThroughRate,
        conversion_rate: conversionRate,
        cost_per_acquisition: costPerAcquisition,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'METRIC_CREATE_ERROR', 'Failed to record metric');
    }

    return this.mapAnalyticsResponse(data);
  },

  async getCampaignAnalytics(
    campaignId: string,
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AnalyticsResponse[]> {
    const db = getDatabase();

    let query = db
      .from('marketing_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId);

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }

    query = query.order('date', { ascending: true });

    const { data, error } = await query;

    if (error) {
      throw new ApiError(500, 'ANALYTICS_FETCH_ERROR', 'Failed to fetch analytics');
    }

    return (data || []).map((a) => this.mapAnalyticsResponse(a));
  },

  async getCampaignSummary(
    campaignId: string,
    organizationId: string,
  ): Promise<{
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    averageClickThroughRate: number;
    averageConversionRate: number;
    averageCostPerAcquisition: number;
    roiPercentage: number;
  }> {
    const db = getDatabase();

    const { data, error } = await db
      .from('marketing_analytics')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new ApiError(500, 'SUMMARY_ERROR', 'Failed to fetch campaign summary');
    }

    const metrics = data || [];

    const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
    const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
    const totalRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);

    const averageClickThroughRate = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.click_through_rate, 0) / metrics.length
      : 0;

    const averageConversionRate = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + m.conversion_rate, 0) / metrics.length
      : 0;

    const averageCostPerAcquisition = metrics.length > 0
      ? metrics.reduce((sum, m) => sum + (m.cost_per_acquisition || 0), 0) / metrics.filter((m) => m.cost_per_acquisition).length
      : 0;

    const roiPercentage = totalRevenue > 0 && totalImpressions > 0
      ? (totalRevenue / (totalImpressions * 0.001)) * 100
      : 0;

    return {
      totalImpressions,
      totalClicks,
      totalConversions,
      totalRevenue,
      averageClickThroughRate,
      averageConversionRate,
      averageCostPerAcquisition,
      roiPercentage,
    };
  },

  async getOrganizationAnalytics(
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalRevenue: number;
    averageClickThroughRate: number;
    averageConversionRate: number;
    byCampaign: Record<string, any>;
  }> {
    const db = getDatabase();

    let query = db
      .from('marketing_analytics')
      .select('*')
      .eq('organization_id', organizationId);

    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new ApiError(500, 'ANALYTICS_FETCH_ERROR', 'Failed to fetch organization analytics');
    }

    const metrics = data || [];
    const byCampaign: Record<string, any> = {};

    metrics.forEach((m) => {
      if (!byCampaign[m.campaign_id]) {
        byCampaign[m.campaign_id] = {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
        };
      }
      byCampaign[m.campaign_id].impressions += m.impressions;
      byCampaign[m.campaign_id].clicks += m.clicks;
      byCampaign[m.campaign_id].conversions += m.conversions;
      byCampaign[m.campaign_id].revenue += m.revenue || 0;
    });

    const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
    const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);
    const totalRevenue = metrics.reduce((sum, m) => sum + (m.revenue || 0), 0);

    const averageClickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const averageConversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      totalImpressions,
      totalClicks,
      totalConversions,
      totalRevenue,
      averageClickThroughRate,
      averageConversionRate,
      byCampaign,
    };
  },

  async getClientEngagementMetrics(
    clientId: string,
    organizationId: string,
  ): Promise<{
    emailsReceived: number;
    emailsOpened: number;
    emailsClicked: number;
    campaignsInteracted: number;
    lastInteraction?: string;
  }> {
    const db = getDatabase();

    const { data, error } = await db
      .from('client_engagement')
      .select('*')
      .eq('client_id', clientId)
      .eq('organization_id', organizationId);

    if (error) {
      const defaultMetrics = {
        emailsReceived: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        campaignsInteracted: 0,
      };
      return defaultMetrics;
    }

    const engagement = data?.[0];

    if (!engagement) {
      return {
        emailsReceived: 0,
        emailsOpened: 0,
        emailsClicked: 0,
        campaignsInteracted: 0,
      };
    }

    return {
      emailsReceived: engagement.emails_received || 0,
      emailsOpened: engagement.emails_opened || 0,
      emailsClicked: engagement.emails_clicked || 0,
      campaignsInteracted: engagement.campaigns_interacted || 0,
      lastInteraction: engagement.last_interaction,
    };
  },

  private mapAnalyticsResponse(dbAnalytic: any): AnalyticsResponse {
    return {
      id: dbAnalytic.id,
      campaignId: dbAnalytic.campaign_id,
      date: dbAnalytic.date,
      impressions: dbAnalytic.impressions,
      clicks: dbAnalytic.clicks,
      conversions: dbAnalytic.conversions,
      revenue: dbAnalytic.revenue,
      clickThroughRate: dbAnalytic.click_through_rate,
      conversionRate: dbAnalytic.conversion_rate,
      costPerAcquisition: dbAnalytic.cost_per_acquisition,
      createdAt: dbAnalytic.created_at,
    };
  },
};
