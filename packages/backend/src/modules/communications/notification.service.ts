import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface CreateNotificationRequest {
  recipientId: string;
  type: 'event' | 'reminder' | 'alert' | 'announcement' | 'message';
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channels?: ('email' | 'sms' | 'push' | 'in_app')[];
}

export interface UpdateNotificationRequest {
  read?: boolean;
  archived?: boolean;
  status?: 'pending' | 'sent' | 'delivered' | 'failed';
}

export interface NotificationResponse {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  priority: string;
  channels: string[];
  status: string;
  read: boolean;
  archived: boolean;
  sentAt?: string;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListOptions {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  priority?: string;
  read?: boolean;
  archived?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const NotificationService = {
  async createNotification(
    organizationId: string,
    request: CreateNotificationRequest,
  ): Promise<NotificationResponse> {
    const db = getDatabase();
    const notificationId = uuidv4();

    const { data, error } = await db
      .from('notifications')
      .insert({
        id: notificationId,
        organization_id: organizationId,
        recipient_id: request.recipientId,
        type: request.type,
        title: request.title,
        message: request.message,
        related_id: request.relatedId,
        related_type: request.relatedType,
        priority: request.priority || 'medium',
        channels: request.channels || ['in_app'],
        status: 'pending',
        read: false,
        archived: false,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'NOTIFICATION_CREATE_ERROR', 'Failed to create notification');
    }

    return this.mapNotificationResponse(data);
  },

  async getNotification(
    notificationId: string,
    organizationId: string,
  ): Promise<NotificationResponse> {
    const db = getDatabase();

    const { data, error } = await db
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
    }

    return this.mapNotificationResponse(data);
  },

  async listNotifications(
    recipientId: string,
    organizationId: string,
    options: NotificationListOptions = {},
  ): Promise<{ notifications: NotificationResponse[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', recipientId)
      .eq('organization_id', organizationId);

    if (options.type) {
      query = query.eq('type', options.type);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.priority) {
      query = query.eq('priority', options.priority);
    }

    if (options.read !== undefined) {
      query = query.eq('read', options.read);
    }

    if (options.archived !== undefined) {
      query = query.eq('archived', options.archived);
    }

    const sortColumn = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'NOTIFICATION_LIST_ERROR', 'Failed to fetch notifications');
    }

    return {
      notifications: (data || []).map((n) => this.mapNotificationResponse(n)),
      total: count || 0,
    };
  },

  async updateNotification(
    notificationId: string,
    organizationId: string,
    request: UpdateNotificationRequest,
  ): Promise<NotificationResponse> {
    const db = getDatabase();

    await this.getNotification(notificationId, organizationId);

    const updateData: any = {};
    if (request.read !== undefined) {
      updateData.read = request.read;
      if (request.read) {
        updateData.read_at = new Date().toISOString();
      }
    }
    if (request.archived !== undefined) updateData.archived = request.archived;
    if (request.status !== undefined) {
      updateData.status = request.status;
      if (request.status === 'sent') {
        updateData.sent_at = new Date().toISOString();
      }
    }

    const { data, error } = await db
      .from('notifications')
      .update(updateData)
      .eq('id', notificationId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'NOTIFICATION_UPDATE_ERROR', 'Failed to update notification');
    }

    return this.mapNotificationResponse(data);
  },

  async markAsRead(notificationId: string, organizationId: string): Promise<NotificationResponse> {
    return this.updateNotification(notificationId, organizationId, { read: true });
  },

  async markAsUnread(
    notificationId: string,
    organizationId: string,
  ): Promise<NotificationResponse> {
    return this.updateNotification(notificationId, organizationId, { read: false });
  },

  async archiveNotification(
    notificationId: string,
    organizationId: string,
  ): Promise<NotificationResponse> {
    return this.updateNotification(notificationId, organizationId, { archived: true });
  },

  async deleteNotification(notificationId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    await this.getNotification(notificationId, organizationId);

    const { error } = await db.from('notifications').delete().eq('id', notificationId);

    if (error) {
      throw new ApiError(500, 'NOTIFICATION_DELETE_ERROR', 'Failed to delete notification');
    }
  },

  async getUnreadCount(recipientId: string, organizationId: string): Promise<number> {
    const db = getDatabase();

    const { data, error, count } = await db
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('recipient_id', recipientId)
      .eq('organization_id', organizationId)
      .eq('read', false)
      .eq('archived', false);

    if (error) {
      throw new ApiError(500, 'NOTIFICATION_COUNT_ERROR', 'Failed to get unread count');
    }

    return count || 0;
  },

  async markAllAsRead(recipientId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    const { error } = await db
      .from('notifications')
      .update({
        read: true,
        read_at: new Date().toISOString(),
      })
      .eq('recipient_id', recipientId)
      .eq('organization_id', organizationId)
      .eq('read', false);

    if (error) {
      throw new ApiError(500, 'NOTIFICATION_UPDATE_ERROR', 'Failed to mark all as read');
    }
  },

  async getNotificationStats(
    recipientId: string,
    organizationId: string,
  ): Promise<{
    total: number;
    unread: number;
    read: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  }> {
    const db = getDatabase();

    const { data, error } = await db
      .from('notifications')
      .select('type, priority, read')
      .eq('recipient_id', recipientId)
      .eq('organization_id', organizationId)
      .eq('archived', false);

    if (error) {
      throw new ApiError(500, 'NOTIFICATION_STATS_ERROR', 'Failed to get statistics');
    }

    const notifications = data || [];
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    notifications.forEach((n) => {
      byType[n.type] = (byType[n.type] || 0) + 1;
      byPriority[n.priority] = (byPriority[n.priority] || 0) + 1;
    });

    return {
      total: notifications.length,
      unread: notifications.filter((n) => !n.read).length,
      read: notifications.filter((n) => n.read).length,
      byType,
      byPriority,
    };
  },

  private mapNotificationResponse(dbNotification: any): NotificationResponse {
    return {
      id: dbNotification.id,
      recipientId: dbNotification.recipient_id,
      type: dbNotification.type,
      title: dbNotification.title,
      message: dbNotification.message,
      relatedId: dbNotification.related_id,
      relatedType: dbNotification.related_type,
      priority: dbNotification.priority,
      channels: dbNotification.channels,
      status: dbNotification.status,
      read: dbNotification.read,
      archived: dbNotification.archived,
      sentAt: dbNotification.sent_at,
      readAt: dbNotification.read_at,
      createdAt: dbNotification.created_at,
      updatedAt: dbNotification.updated_at,
    };
  },
};
