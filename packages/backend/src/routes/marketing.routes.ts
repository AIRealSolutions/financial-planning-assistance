import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { CampaignService } from '../modules/marketing/campaign.service';
import { AutomationService } from '../modules/marketing/automation.service';
import { AnalyticsService } from '../modules/marketing/analytics.service';

const router = Router();

// Middleware to ensure authentication for all marketing routes
router.use(authenticate);

// ==================== CAMPAIGN ROUTES ====================

// POST /api/marketing/campaigns - Create campaign
router.post('/campaigns', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const campaign = await CampaignService.createCampaign(
      req.user.organizationId,
      req.user.userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: campaign,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketing/campaigns - List campaigns
router.get('/campaigns', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { campaigns, total } = await CampaignService.listCampaigns(
      req.user.organizationId,
      req.user.userId,
      {
        page,
        limit,
        campaignType: req.query.campaignType as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      },
    );

    res.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketing/campaigns/:campaignId - Get campaign detail
router.get('/campaigns/:campaignId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const campaign = await CampaignService.getCampaign(req.params.campaignId, req.user.organizationId);

    res.json({
      success: true,
      data: campaign,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/marketing/campaigns/:campaignId - Update campaign
router.patch('/campaigns/:campaignId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const campaign = await CampaignService.updateCampaign(
      req.params.campaignId,
      req.user.organizationId,
      req.body,
    );

    res.json({
      success: true,
      data: campaign,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/marketing/campaigns/:campaignId - Delete campaign
router.delete('/campaigns/:campaignId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await CampaignService.deleteCampaign(req.params.campaignId, req.user.organizationId);

    res.json({
      success: true,
      data: { message: 'Campaign deleted' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/marketing/campaigns/:campaignId/metrics - Update campaign metrics
router.patch('/campaigns/:campaignId/metrics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const campaign = await CampaignService.updateCampaignMetrics(
      req.params.campaignId,
      req.user.organizationId,
      req.body,
    );

    res.json({
      success: true,
      data: campaign,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketing/campaigns/stats - Campaign statistics
router.get('/campaigns/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const stats = await CampaignService.getCampaignStats(req.user.organizationId, req.user.userId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ==================== AUTOMATION ROUTES ====================

// POST /api/marketing/automations - Create automation
router.post('/automations', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const automation = await AutomationService.createAutomation(
      req.user.organizationId,
      req.user.userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: automation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketing/automations - List automations
router.get('/automations', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { automations, total } = await AutomationService.listAutomations(
      req.user.organizationId,
      req.user.userId,
      {
        page,
        limit,
        automationType: req.query.automationType as string,
        enabled: req.query.enabled === 'true' ? true : req.query.enabled === 'false' ? false : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      },
    );

    res.json({
      success: true,
      data: {
        automations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketing/automations/:automationId - Get automation detail
router.get('/automations/:automationId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const automation = await AutomationService.getAutomation(
      req.params.automationId,
      req.user.organizationId,
    );

    res.json({
      success: true,
      data: automation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/marketing/automations/:automationId - Update automation
router.patch('/automations/:automationId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const automation = await AutomationService.updateAutomation(
      req.params.automationId,
      req.user.organizationId,
      req.body,
    );

    res.json({
      success: true,
      data: automation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/marketing/automations/:automationId - Delete automation
router.delete('/automations/:automationId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await AutomationService.deleteAutomation(req.params.automationId, req.user.organizationId);

    res.json({
      success: true,
      data: { message: 'Automation deleted' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/marketing/automations/:automationId/toggle - Toggle automation
router.post('/automations/:automationId/toggle', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const automation = await AutomationService.toggleAutomation(
      req.params.automationId,
      req.user.organizationId,
    );

    res.json({
      success: true,
      data: automation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/marketing/automations/:automationId/execute - Execute automation
router.post('/automations/:automationId/execute', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const automation = await AutomationService.executeAutomation(
      req.params.automationId,
      req.user.organizationId,
    );

    res.json({
      success: true,
      data: automation,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketing/automations/stats - Automation statistics
router.get('/automations/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const stats = await AutomationService.getAutomationStats(req.user.organizationId, req.user.userId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ==================== ANALYTICS ROUTES ====================

// POST /api/marketing/analytics - Record metric
router.post('/analytics', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const metric = await AnalyticsService.recordMetric(req.user.organizationId, req.body);

    res.status(201).json({
      success: true,
      data: metric,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketing/analytics/campaign/:campaignId - Get campaign analytics
router.get('/analytics/campaign/:campaignId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const analytics = await AnalyticsService.getCampaignAnalytics(
      req.params.campaignId,
      req.user.organizationId,
      req.query.startDate as string,
      req.query.endDate as string,
    );

    res.json({
      success: true,
      data: { analytics, count: analytics.length },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketing/analytics/campaign/:campaignId/summary - Get campaign summary
router.get('/analytics/campaign/:campaignId/summary', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const summary = await AnalyticsService.getCampaignSummary(
      req.params.campaignId,
      req.user.organizationId,
    );

    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketing/analytics/organization - Get organization analytics
router.get('/analytics/organization', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const analytics = await AnalyticsService.getOrganizationAnalytics(
      req.user.organizationId,
      req.query.startDate as string,
      req.query.endDate as string,
    );

    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/marketing/analytics/client/:clientId - Get client engagement metrics
router.get('/analytics/client/:clientId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const engagement = await AnalyticsService.getClientEngagementMetrics(
      req.params.clientId,
      req.user.organizationId,
    );

    res.json({
      success: true,
      data: engagement,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
