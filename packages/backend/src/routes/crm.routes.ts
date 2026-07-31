import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { ClientService } from '../modules/crm/client.service';
import { InteractionService } from '../modules/crm/interaction.service';
import { SegmentService } from '../modules/crm/segment.service';

const router = Router();

// Middleware to ensure authentication for all CRM routes
router.use(authenticate);

// ==================== CLIENT ROUTES ====================

// GET /api/crm/clients - List clients
router.get('/clients', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const tags = req.query.tags ? (req.query.tags as string).split(',') : undefined;

    const { clients, total } = await ClientService.listClients(
      req.user.organizationId,
      req.user.userId,
      {
        page,
        limit,
        status: status as any,
        search,
        tags,
        sortBy: 'created_at',
        sortOrder: 'desc',
      },
    );

    res.json({
      success: true,
      data: {
        clients,
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

// POST /api/crm/clients - Create client
router.post('/clients', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const client = await ClientService.createClient(
      req.user.organizationId,
      req.user.userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: client,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/crm/clients/:clientId - Get client detail
router.get('/clients/:clientId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const client = await ClientService.getClient(req.params.clientId, req.user.organizationId);

    // Get client interactions
    const { interactions } = await InteractionService.listInteractionsByClient(
      client.id,
      req.user.organizationId,
      { limit: 10 },
    );

    res.json({
      success: true,
      data: {
        client,
        recentInteractions: interactions,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/crm/clients/:clientId - Update client
router.patch('/clients/:clientId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const client = await ClientService.updateClient(
      req.params.clientId,
      req.user.organizationId,
      req.body,
    );

    res.json({
      success: true,
      data: client,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/crm/clients/:clientId - Delete client
router.delete('/clients/:clientId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await ClientService.deleteClient(req.params.clientId, req.user.organizationId);

    res.json({
      success: true,
      data: { message: 'Client deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/crm/clients/stats - Client statistics
router.get('/stats/clients', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const stats = await ClientService.getClientStats(req.user.organizationId, req.user.userId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ==================== INTERACTION ROUTES ====================

// POST /api/crm/interactions - Create interaction
router.post('/interactions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const interaction = await InteractionService.createInteraction(
      req.user.organizationId,
      req.user.userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: interaction,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/crm/clients/:clientId/interactions - Get client interactions
router.get('/clients/:clientId/interactions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { interactions, total } = await InteractionService.listInteractionsByClient(
      req.params.clientId,
      req.user.organizationId,
      { page, limit },
    );

    res.json({
      success: true,
      data: {
        interactions,
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

// GET /api/crm/interactions/stats - Interaction statistics
router.get('/stats/interactions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const stats = await InteractionService.getInteractionStats(
      req.user.organizationId,
      req.user.userId,
    );

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/crm/follow-ups - Get follow-up tasks
router.get('/follow-ups', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const followUps = await InteractionService.getFollowUpTasks(
      req.user.organizationId,
      req.user.userId,
    );

    res.json({
      success: true,
      data: followUps,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ==================== SEGMENT ROUTES ====================

// GET /api/crm/segments - List segments
router.get('/segments', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const segments = await SegmentService.listSegments(
      req.user.organizationId,
      req.user.userId,
    );

    res.json({
      success: true,
      data: segments,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/crm/segments - Create segment
router.post('/segments', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const segment = await SegmentService.createSegment(
      req.user.organizationId,
      req.user.userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: segment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/crm/segments/:segmentId - Get segment
router.get('/segments/:segmentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const segment = await SegmentService.getSegment(
      req.params.segmentId,
      req.user.organizationId,
    );

    res.json({
      success: true,
      data: segment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/crm/segments/:segmentId - Update segment
router.patch('/segments/:segmentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const segment = await SegmentService.updateSegment(
      req.params.segmentId,
      req.user.organizationId,
      req.body,
    );

    res.json({
      success: true,
      data: segment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/crm/segments/:segmentId - Delete segment
router.delete('/segments/:segmentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await SegmentService.deleteSegment(req.params.segmentId, req.user.organizationId);

    res.json({
      success: true,
      data: { message: 'Segment deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/crm/segments/default - Initialize default segments
router.get('/segments/default/init', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const segments = await SegmentService.getDefaultSegments(
      req.user.organizationId,
      req.user.userId,
    );

    res.json({
      success: true,
      data: segments,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
