import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { EventService } from '../modules/communications/event.service';
import { NotificationService } from '../modules/communications/notification.service';
import { ReminderService } from '../modules/communications/reminder.service';

const router = Router();

// Middleware to ensure authentication for all communications routes
router.use(authenticate);

// ==================== EVENT ROUTES ====================

// POST /api/communications/events - Create event
router.post('/events', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const event = await EventService.createEvent(req.user.organizationId, req.user.userId, req.body);

    res.status(201).json({
      success: true,
      data: event,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/communications/events - List events
router.get('/events', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { events, total } = await EventService.listEvents(
      req.user.organizationId,
      req.user.userId,
      {
        page,
        limit,
        eventType: req.query.eventType as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      },
    );

    res.json({
      success: true,
      data: {
        events,
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

// GET /api/communications/events/upcoming - Get upcoming events
router.get('/events/upcoming', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const days = parseInt(req.query.days as string) || 7;
    const events = await EventService.getUpcomingEvents(req.user.organizationId, req.user.userId, days);

    res.json({
      success: true,
      data: { events, count: events.length },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/communications/events/client/:clientId - Get client events
router.get('/events/client/:clientId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { events, total } = await EventService.getClientEvents(
      req.params.clientId,
      req.user.organizationId,
      { page, limit, eventType: req.query.eventType as string, status: req.query.status as string },
    );

    res.json({
      success: true,
      data: {
        events,
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

// GET /api/communications/events/:eventId - Get event detail
router.get('/events/:eventId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const event = await EventService.getEvent(req.params.eventId, req.user.organizationId);

    res.json({
      success: true,
      data: event,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/communications/events/:eventId - Update event
router.patch('/events/:eventId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const event = await EventService.updateEvent(req.params.eventId, req.user.organizationId, req.body);

    res.json({
      success: true,
      data: event,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/communications/events/:eventId - Delete event
router.delete('/events/:eventId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await EventService.deleteEvent(req.params.eventId, req.user.organizationId);

    res.json({
      success: true,
      data: { message: 'Event deleted' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/communications/calendar/annual - Get annual calendar
router.get('/calendar/annual', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const events = await EventService.getAnnualCalendarEvents(
      req.user.organizationId,
      req.user.userId,
      year,
    );

    res.json({
      success: true,
      data: { events, year, count: events.length },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ==================== NOTIFICATION ROUTES ====================

// POST /api/communications/notifications - Create notification
router.post('/notifications', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const notification = await NotificationService.createNotification(req.user.organizationId, req.body);

    res.status(201).json({
      success: true,
      data: notification,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/communications/notifications - List notifications
router.get('/notifications', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { notifications, total } = await NotificationService.listNotifications(
      req.user.userId,
      req.user.organizationId,
      {
        page,
        limit,
        type: req.query.type as string,
        status: req.query.status as string,
        priority: req.query.priority as string,
        read: req.query.read === 'true' ? true : req.query.read === 'false' ? false : undefined,
        archived: req.query.archived === 'true' ? true : req.query.archived === 'false' ? false : undefined,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      },
    );

    res.json({
      success: true,
      data: {
        notifications,
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

// GET /api/communications/notifications/:notificationId - Get notification detail
router.get('/notifications/:notificationId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const notification = await NotificationService.getNotification(
      req.params.notificationId,
      req.user.organizationId,
    );

    res.json({
      success: true,
      data: notification,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/communications/notifications/:notificationId - Update notification
router.patch('/notifications/:notificationId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const notification = await NotificationService.updateNotification(
      req.params.notificationId,
      req.user.organizationId,
      req.body,
    );

    res.json({
      success: true,
      data: notification,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/communications/notifications/:notificationId/read - Mark as read
router.post(
  '/notifications/:notificationId/read',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

      const notification = await NotificationService.markAsRead(
        req.params.notificationId,
        req.user.organizationId,
      );

      res.json({
        success: true,
        data: notification,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/communications/notifications/:notificationId/unread - Mark as unread
router.post(
  '/notifications/:notificationId/unread',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

      const notification = await NotificationService.markAsUnread(
        req.params.notificationId,
        req.user.organizationId,
      );

      res.json({
        success: true,
        data: notification,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/communications/notifications/:notificationId/archive - Archive notification
router.post(
  '/notifications/:notificationId/archive',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

      const notification = await NotificationService.archiveNotification(
        req.params.notificationId,
        req.user.organizationId,
      );

      res.json({
        success: true,
        data: notification,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

// DELETE /api/communications/notifications/:notificationId - Delete notification
router.delete('/notifications/:notificationId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await NotificationService.deleteNotification(req.params.notificationId, req.user.organizationId);

    res.json({
      success: true,
      data: { message: 'Notification deleted' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/communications/notifications/unread/count - Get unread count
router.get('/notifications/unread/count', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const count = await NotificationService.getUnreadCount(req.user.userId, req.user.organizationId);

    res.json({
      success: true,
      data: { count },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/communications/notifications/read-all - Mark all as read
router.post('/notifications/read-all', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await NotificationService.markAllAsRead(req.user.userId, req.user.organizationId);

    res.json({
      success: true,
      data: { message: 'All notifications marked as read' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/communications/notifications/stats - Get notification stats
router.get('/notifications/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const stats = await NotificationService.getNotificationStats(req.user.userId, req.user.organizationId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ==================== REMINDER ROUTES ====================

// POST /api/communications/reminders - Create reminder
router.post('/reminders', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const reminder = await ReminderService.createReminder(
      req.user.organizationId,
      req.user.userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: reminder,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/communications/reminders - List reminders
router.get('/reminders', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { reminders, total } = await ReminderService.listReminders(
      req.user.organizationId,
      req.user.userId,
      {
        page,
        limit,
        reminderType: req.query.reminderType as string,
        status: req.query.status as string,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        sortBy: req.query.sortBy as string,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'asc',
      },
    );

    res.json({
      success: true,
      data: {
        reminders,
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

// GET /api/communications/reminders/upcoming - Get upcoming reminders
router.get('/reminders/upcoming', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const days = parseInt(req.query.days as string) || 7;
    const reminders = await ReminderService.getUpcomingReminders(
      req.user.organizationId,
      req.user.userId,
      days,
    );

    res.json({
      success: true,
      data: { reminders, count: reminders.length },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/communications/reminders/client/:clientId - Get client reminders
router.get('/reminders/client/:clientId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const { reminders, total } = await ReminderService.getClientReminders(
      req.params.clientId,
      req.user.organizationId,
      {
        page,
        limit,
        reminderType: req.query.reminderType as string,
        status: req.query.status as string,
      },
    );

    res.json({
      success: true,
      data: {
        reminders,
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

// GET /api/communications/reminders/:reminderId - Get reminder detail
router.get('/reminders/:reminderId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const reminder = await ReminderService.getReminder(req.params.reminderId, req.user.organizationId);

    res.json({
      success: true,
      data: reminder,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/communications/reminders/:reminderId - Update reminder
router.patch('/reminders/:reminderId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const reminder = await ReminderService.updateReminder(
      req.params.reminderId,
      req.user.organizationId,
      req.body,
    );

    res.json({
      success: true,
      data: reminder,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/communications/reminders/:reminderId/cancel - Cancel reminder
router.post('/reminders/:reminderId/cancel', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const reminder = await ReminderService.cancelReminder(req.params.reminderId, req.user.organizationId);

    res.json({
      success: true,
      data: reminder,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/communications/reminders/:reminderId - Delete reminder
router.delete('/reminders/:reminderId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await ReminderService.deleteReminder(req.params.reminderId, req.user.organizationId);

    res.json({
      success: true,
      data: { message: 'Reminder deleted' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/communications/reminders/stats - Get reminder stats
router.get('/reminders/stats', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const stats = await ReminderService.getReminderStats(req.user.organizationId, req.user.userId);

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
