import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogRequest {
  resourceType: string;
  resourceId: string;
  action: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogResponse {
  id: string;
  userId: string;
  resourceType: string;
  resourceId: string;
  action: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface AuditLogListOptions {
  page?: number;
  limit?: number;
  resourceType?: string;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const AuditService = {
  async logAction(
    organizationId: string,
    userId: string,
    request: AuditLogRequest,
  ): Promise<AuditLogResponse> {
    const db = getDatabase();
    const auditId = uuidv4();

    const { data, error } = await db
      .from('audit_logs')
      .insert({
        id: auditId,
        organization_id: organizationId,
        user_id: userId,
        resource_type: request.resourceType,
        resource_id: request.resourceId,
        action: request.action,
        changes: request.changes || {},
        ip_address: request.ipAddress,
        user_agent: request.userAgent,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'AUDIT_LOG_ERROR', 'Failed to create audit log');
    }

    return this.mapAuditLogResponse(data);
  },

  async listAuditLogs(
    organizationId: string,
    options: AuditLogListOptions = {},
  ): Promise<{ logs: AuditLogResponse[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    let query = db
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (options.resourceType) {
      query = query.eq('resource_type', options.resourceType);
    }

    if (options.action) {
      query = query.eq('action', options.action);
    }

    if (options.userId) {
      query = query.eq('user_id', options.userId);
    }

    if (options.startDate) {
      query = query.gte('timestamp', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('timestamp', options.endDate);
    }

    const sortColumn = options.sortBy || 'timestamp';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'AUDIT_LOG_LIST_ERROR', 'Failed to fetch audit logs');
    }

    return {
      logs: (data || []).map((log) => this.mapAuditLogResponse(log)),
      total: count || 0,
    };
  },

  async getResourceAuditTrail(
    organizationId: string,
    resourceType: string,
    resourceId: string,
  ): Promise<AuditLogResponse[]> {
    const db = getDatabase();

    const { data, error } = await db
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('timestamp', { ascending: false });

    if (error) {
      throw new ApiError(500, 'AUDIT_LOG_LIST_ERROR', 'Failed to fetch audit trail');
    }

    return (data || []).map((log) => this.mapAuditLogResponse(log));
  },

  async getUserAuditLogs(
    organizationId: string,
    userId: string,
    options: AuditLogListOptions = {},
  ): Promise<{ logs: AuditLogResponse[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    let query = db
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (options.startDate) {
      query = query.gte('timestamp', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('timestamp', options.endDate);
    }

    const sortColumn = options.sortBy || 'timestamp';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'AUDIT_LOG_LIST_ERROR', 'Failed to fetch audit logs');
    }

    return {
      logs: (data || []).map((log) => this.mapAuditLogResponse(log)),
      total: count || 0,
    };
  },

  async getAuditStats(organizationId: string): Promise<{
    totalActions: number;
    actionsToday: number;
    actionsByType: Record<string, number>;
    actionsByUser: Record<string, number>;
  }> {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await db
      .from('audit_logs')
      .select('resource_type, user_id, timestamp')
      .eq('organization_id', organizationId);

    if (error) {
      throw new ApiError(500, 'STATS_ERROR', 'Failed to fetch statistics');
    }

    const actionsByType: Record<string, number> = {};
    const actionsByUser: Record<string, number> = {};
    let actionsToday = 0;

    data?.forEach((log) => {
      // Count by type
      actionsByType[log.resource_type] = (actionsByType[log.resource_type] || 0) + 1;

      // Count by user
      if (log.user_id) {
        actionsByUser[log.user_id] = (actionsByUser[log.user_id] || 0) + 1;
      }

      // Count today
      if (log.timestamp.startsWith(today)) {
        actionsToday++;
      }
    });

    return {
      totalActions: data?.length || 0,
      actionsToday,
      actionsByType,
      actionsByUser,
    };
  },

  async exportAuditLog(
    organizationId: string,
    options: AuditLogListOptions = {},
  ): Promise<string> {
    const db = getDatabase();

    let query = db
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId);

    if (options.resourceType) {
      query = query.eq('resource_type', options.resourceType);
    }

    if (options.startDate) {
      query = query.gte('timestamp', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('timestamp', options.endDate);
    }

    const { data, error } = await query.order('timestamp', { ascending: false });

    if (error) {
      throw new ApiError(500, 'EXPORT_ERROR', 'Failed to export audit logs');
    }

    // Convert to CSV format
    const logs = data || [];
    const headers = ['Timestamp', 'User ID', 'Resource Type', 'Resource ID', 'Action', 'Changes'];
    const rows = logs.map((log) => [
      log.timestamp,
      log.user_id,
      log.resource_type,
      log.resource_id,
      log.action,
      JSON.stringify(log.changes),
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    return csv;
  },

  private mapAuditLogResponse(dbLog: any): AuditLogResponse {
    return {
      id: dbLog.id,
      userId: dbLog.user_id,
      resourceType: dbLog.resource_type,
      resourceId: dbLog.resource_id,
      action: dbLog.action,
      changes: dbLog.changes,
      ipAddress: dbLog.ip_address,
      userAgent: dbLog.user_agent,
      timestamp: new Date(dbLog.timestamp),
    };
  },
};
