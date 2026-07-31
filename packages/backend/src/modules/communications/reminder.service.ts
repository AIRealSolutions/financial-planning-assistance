import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface CreateReminderRequest {
  clientId: string;
  title: string;
  message: string;
  reminderType: 'event' | 'review' | 'meeting' | 'birthday' | 'anniversary' | 'deadline' | 'task';
  scheduledDate: string;
  relatedId?: string;
  relatedType?: string;
  channels?: ('email' | 'sms' | 'push' | 'in_app')[];
}

export interface UpdateReminderRequest {
  title?: string;
  message?: string;
  scheduledDate?: string;
  status?: 'pending' | 'sent' | 'cancelled';
}

export interface ReminderResponse {
  id: string;
  clientId: string;
  title: string;
  message: string;
  reminderType: string;
  scheduledDate: string;
  relatedId?: string;
  relatedType?: string;
  channels: string[];
  status: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderListOptions {
  page?: number;
  limit?: number;
  reminderType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const ReminderService = {
  async createReminder(
    organizationId: string,
    advisorId: string,
    request: CreateReminderRequest,
  ): Promise<ReminderResponse> {
    const db = getDatabase();
    const reminderId = uuidv4();

    const { data, error } = await db
      .from('reminders')
      .insert({
        id: reminderId,
        organization_id: organizationId,
        advisor_id: advisorId,
        client_id: request.clientId,
        title: request.title,
        message: request.message,
        reminder_type: request.reminderType,
        scheduled_date: request.scheduledDate,
        related_id: request.relatedId,
        related_type: request.relatedType,
        channels: request.channels || ['in_app'],
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'REMINDER_CREATE_ERROR', 'Failed to create reminder');
    }

    return this.mapReminderResponse(data);
  },

  async getReminder(reminderId: string, organizationId: string): Promise<ReminderResponse> {
    const db = getDatabase();

    const { data, error } = await db
      .from('reminders')
      .select('*')
      .eq('id', reminderId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'REMINDER_NOT_FOUND', 'Reminder not found');
    }

    return this.mapReminderResponse(data);
  },

  async listReminders(
    organizationId: string,
    advisorId: string,
    options: ReminderListOptions = {},
  ): Promise<{ reminders: ReminderResponse[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .from('reminders')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (options.reminderType) {
      query = query.eq('reminder_type', options.reminderType);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.startDate && options.endDate) {
      query = query.gte('scheduled_date', options.startDate).lte('scheduled_date', options.endDate);
    }

    const sortColumn = options.sortBy || 'scheduled_date';
    const sortOrder = options.sortOrder || 'asc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'REMINDER_LIST_ERROR', 'Failed to fetch reminders');
    }

    return {
      reminders: (data || []).map((r) => this.mapReminderResponse(r)),
      total: count || 0,
    };
  },

  async getClientReminders(
    clientId: string,
    organizationId: string,
    options: ReminderListOptions = {},
  ): Promise<{ reminders: ReminderResponse[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .from('reminders')
      .select('*', { count: 'exact' })
      .eq('client_id', clientId)
      .eq('organization_id', organizationId);

    if (options.reminderType) {
      query = query.eq('reminder_type', options.reminderType);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const sortColumn = options.sortBy || 'scheduled_date';
    const sortOrder = options.sortOrder || 'asc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'REMINDER_LIST_ERROR', 'Failed to fetch reminders');
    }

    return {
      reminders: (data || []).map((r) => this.mapReminderResponse(r)),
      total: count || 0,
    };
  },

  async updateReminder(
    reminderId: string,
    organizationId: string,
    request: UpdateReminderRequest,
  ): Promise<ReminderResponse> {
    const db = getDatabase();

    await this.getReminder(reminderId, organizationId);

    const updateData: any = {};
    if (request.title !== undefined) updateData.title = request.title;
    if (request.message !== undefined) updateData.message = request.message;
    if (request.scheduledDate !== undefined) updateData.scheduled_date = request.scheduledDate;
    if (request.status !== undefined) {
      updateData.status = request.status;
      if (request.status === 'sent') {
        updateData.sent_at = new Date().toISOString();
      }
    }

    const { data, error } = await db
      .from('reminders')
      .update(updateData)
      .eq('id', reminderId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'REMINDER_UPDATE_ERROR', 'Failed to update reminder');
    }

    return this.mapReminderResponse(data);
  },

  async cancelReminder(reminderId: string, organizationId: string): Promise<ReminderResponse> {
    return this.updateReminder(reminderId, organizationId, { status: 'cancelled' });
  },

  async deleteReminder(reminderId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    await this.getReminder(reminderId, organizationId);

    const { error } = await db.from('reminders').delete().eq('id', reminderId);

    if (error) {
      throw new ApiError(500, 'REMINDER_DELETE_ERROR', 'Failed to delete reminder');
    }
  },

  async getUpcomingReminders(
    organizationId: string,
    advisorId: string,
    days: number = 7,
  ): Promise<ReminderResponse[]> {
    const db = getDatabase();
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await db
      .from('reminders')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId)
      .eq('status', 'pending')
      .gte('scheduled_date', today.toISOString())
      .lte('scheduled_date', futureDate.toISOString())
      .order('scheduled_date', { ascending: true });

    if (error) {
      throw new ApiError(500, 'REMINDER_LIST_ERROR', 'Failed to fetch upcoming reminders');
    }

    return (data || []).map((r) => this.mapReminderResponse(r));
  },

  async getReminderStats(
    organizationId: string,
    advisorId: string,
  ): Promise<{
    total: number;
    pending: number;
    sent: number;
    cancelled: number;
    byType: Record<string, number>;
  }> {
    const db = getDatabase();

    const { data, error } = await db
      .from('reminders')
      .select('status, reminder_type')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (error) {
      throw new ApiError(500, 'REMINDER_STATS_ERROR', 'Failed to fetch statistics');
    }

    const reminders = data || [];
    const byType: Record<string, number> = {};

    reminders.forEach((r) => {
      byType[r.reminder_type] = (byType[r.reminder_type] || 0) + 1;
    });

    return {
      total: reminders.length,
      pending: reminders.filter((r) => r.status === 'pending').length,
      sent: reminders.filter((r) => r.status === 'sent').length,
      cancelled: reminders.filter((r) => r.status === 'cancelled').length,
      byType,
    };
  },

  private mapReminderResponse(dbReminder: any): ReminderResponse {
    return {
      id: dbReminder.id,
      clientId: dbReminder.client_id,
      title: dbReminder.title,
      message: dbReminder.message,
      reminderType: dbReminder.reminder_type,
      scheduledDate: dbReminder.scheduled_date,
      relatedId: dbReminder.related_id,
      relatedType: dbReminder.related_type,
      channels: dbReminder.channels,
      status: dbReminder.status,
      sentAt: dbReminder.sent_at,
      createdAt: dbReminder.created_at,
      updatedAt: dbReminder.updated_at,
    };
  },
};
