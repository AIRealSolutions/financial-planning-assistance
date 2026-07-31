import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { CalendarService } from '../modules/operations/calendar.service';
import { TaskService } from '../modules/operations/task.service';
import { DocumentService } from '../modules/operations/document.service';
import { AuditService } from '../modules/operations/audit.service';

const router = Router();

// Middleware to ensure authentication for all operations routes
router.use(authenticate);

// ==================== CALENDAR & MEETING ROUTES ====================

// POST /api/operations/meetings - Create meeting
router.post('/meetings', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const meeting = await CalendarService.createMeeting(
      req.user.organizationId,
      req.user.userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: meeting,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/operations/meetings - List meetings
router.get('/meetings', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const { meetings, total } = await CalendarService.listMeetings(
      req.user.userId,
      req.user.organizationId,
      {
        page,
        limit,
        status: status as any,
        type: type as any,
        startDate,
        endDate,
      },
    );

    res.json({
      success: true,
      data: {
        meetings,
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

// GET /api/operations/meetings/upcoming - Get upcoming meetings
router.get('/meetings/upcoming', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const days = parseInt(req.query.days as string) || 7;
    const meetings = await CalendarService.getUpcomingMeetings(
      req.user.userId,
      req.user.organizationId,
      days,
    );

    res.json({
      success: true,
      data: meetings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/operations/meetings/:meetingId - Get meeting detail
router.get('/meetings/:meetingId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const meeting = await CalendarService.getMeeting(req.params.meetingId, req.user.organizationId);
    const notes = await CalendarService.getMeetingNotes(req.params.meetingId);
    const actionItems = await CalendarService.getActionItems(req.params.meetingId);

    res.json({
      success: true,
      data: { meeting, notes, actionItems },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/operations/meetings/:meetingId - Update meeting
router.patch('/meetings/:meetingId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const meeting = await CalendarService.updateMeeting(
      req.params.meetingId,
      req.user.organizationId,
      req.body,
    );

    res.json({
      success: true,
      data: meeting,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/operations/meetings/:meetingId - Delete meeting
router.delete('/meetings/:meetingId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await CalendarService.deleteMeeting(req.params.meetingId, req.user.organizationId);

    res.json({
      success: true,
      data: { message: 'Meeting deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/operations/meetings/:meetingId/notes - Add meeting notes
router.post('/meetings/:meetingId/notes', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await CalendarService.addMeetingNotes(req.params.meetingId, req.body.content, req.user.userId);

    res.status(201).json({
      success: true,
      data: { message: 'Note added successfully' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/operations/meetings/:meetingId/action-items - Add action item
router.post('/meetings/:meetingId/action-items', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await CalendarService.addActionItem(
      req.params.meetingId,
      req.body.description,
      req.body.assignedTo,
      req.body.dueDate,
    );

    res.status(201).json({
      success: true,
      data: { message: 'Action item added successfully' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ==================== TASK ROUTES ====================

// POST /api/operations/tasks - Create task
router.post('/tasks', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const task = await TaskService.createTask(req.user.organizationId, req.user.userId, req.body);

    res.status(201).json({
      success: true,
      data: task,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/operations/tasks - List tasks
router.get('/tasks', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const assignedTo = req.query.assignedTo as string;

    const { tasks, total } = await TaskService.listTasks(req.user.organizationId, {
      page,
      limit,
      status: status as any,
      priority: priority as any,
      assignedTo,
    });

    res.json({
      success: true,
      data: {
        tasks,
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

// GET /api/operations/tasks/assigned-to-me - Get my tasks
router.get('/tasks/assigned-to-me', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const { tasks, total } = await TaskService.getTasksForUser(
      req.user.organizationId,
      req.user.userId,
      { page, limit, status: status as any },
    );

    res.json({
      success: true,
      data: {
        tasks,
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

// GET /api/operations/tasks/overdue - Get overdue tasks
router.get('/tasks/overdue', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const tasks = await TaskService.getOverdueTasks(req.user.organizationId);

    res.json({
      success: true,
      data: tasks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/operations/tasks/:taskId - Update task
router.patch('/tasks/:taskId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const task = await TaskService.updateTask(req.params.taskId, req.user.organizationId, req.body);

    res.json({
      success: true,
      data: task,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/operations/tasks/:taskId/complete - Complete task
router.post('/tasks/:taskId/complete', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const task = await TaskService.completeTask(req.params.taskId, req.user.organizationId);

    res.json({
      success: true,
      data: task,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/operations/tasks/:taskId - Delete task
router.delete('/tasks/:taskId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await TaskService.deleteTask(req.params.taskId, req.user.organizationId);

    res.json({
      success: true,
      data: { message: 'Task deleted successfully' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/operations/stats/tasks - Task statistics
router.get('/stats/tasks', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const stats = await TaskService.getTaskStats(req.user.organizationId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ==================== DOCUMENT ROUTES ====================

// POST /api/operations/documents - Create document
router.post('/documents', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const document = await DocumentService.createDocument(
      req.user.organizationId,
      req.user.userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: document,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/operations/documents - List documents
router.get('/documents', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const documentType = req.query.documentType as string;
    const status = req.query.status as string;
    const clientId = req.query.clientId as string;

    const { documents, total } = await DocumentService.listDocuments(
      req.user.organizationId,
      req.user.userId,
      {
        page,
        limit,
        documentType: documentType as any,
        status: status as any,
        clientId,
      },
    );

    res.json({
      success: true,
      data: {
        documents,
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

// GET /api/operations/documents/:documentId - Get document
router.get('/documents/:documentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const document = await DocumentService.getDocument(req.params.documentId, req.user.organizationId);

    res.json({
      success: true,
      data: document,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/operations/documents/:documentId - Update document
router.patch('/documents/:documentId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const document = await DocumentService.updateDocument(
      req.params.documentId,
      req.user.organizationId,
      req.body,
    );

    res.json({
      success: true,
      data: document,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/operations/documents/:documentId/sign - Sign document
router.post('/documents/:documentId/sign', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const document = await DocumentService.markAsSigned(
      req.params.documentId,
      req.user.organizationId,
      req.user.userId,
    );

    res.json({
      success: true,
      data: document,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/operations/stats/documents - Document statistics
router.get('/stats/documents', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const stats = await DocumentService.getDocumentStats(req.user.organizationId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ==================== AUDIT ROUTES ====================

// GET /api/operations/audit-logs - List audit logs
router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const resourceType = req.query.resourceType as string;
    const action = req.query.action as string;
    const userId = req.query.userId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const { logs, total } = await AuditService.listAuditLogs(req.user.organizationId, {
      page,
      limit,
      resourceType,
      action,
      userId,
      startDate,
      endDate,
    });

    res.json({
      success: true,
      data: {
        logs,
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

// GET /api/operations/audit-logs/:resourceType/:resourceId - Get resource audit trail
router.get('/audit-logs/:resourceType/:resourceId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const logs = await AuditService.getResourceAuditTrail(
      req.user.organizationId,
      req.params.resourceType,
      req.params.resourceId,
    );

    res.json({
      success: true,
      data: logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/operations/stats/audit - Audit statistics
router.get('/stats/audit', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const stats = await AuditService.getAuditStats(req.user.organizationId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
