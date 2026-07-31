import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { TaskStatus, TaskPriority } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  assignedTo: string;
  clientId?: string;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  dueDate?: string;
}

export interface TaskListOptions {
  page?: number;
  limit?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const TaskService = {
  async createTask(
    organizationId: string,
    createdBy: string,
    request: CreateTaskRequest,
  ): Promise<TaskResponse> {
    const db = getDatabase();
    const taskId = uuidv4();

    const { data, error } = await db
      .from('tasks')
      .insert({
        id: taskId,
        organization_id: organizationId,
        created_by: createdBy,
        assigned_to: request.assignedTo,
        client_id: request.clientId,
        title: request.title,
        description: request.description,
        priority: request.priority,
        status: 'open',
        due_date: request.dueDate,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'TASK_CREATE_ERROR', 'Failed to create task');
    }

    return this.mapTaskResponse(data);
  },

  async getTask(taskId: string, organizationId: string): Promise<TaskResponse> {
    const db = getDatabase();

    const { data, error } = await db
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'TASK_NOT_FOUND', 'Task not found');
    }

    return this.mapTaskResponse(data);
  },

  async listTasks(
    organizationId: string,
    options: TaskListOptions = {},
  ): Promise<{ tasks: TaskResponse[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .from('tasks')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.priority) {
      query = query.eq('priority', options.priority);
    }

    if (options.assignedTo) {
      query = query.eq('assigned_to', options.assignedTo);
    }

    const sortColumn = options.sortBy || 'due_date';
    const sortOrder = options.sortOrder || 'asc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'TASK_LIST_ERROR', 'Failed to fetch tasks');
    }

    return {
      tasks: (data || []).map((t) => this.mapTaskResponse(t)),
      total: count || 0,
    };
  },

  async getOverdueTasks(organizationId: string): Promise<TaskResponse[]> {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await db
      .from('tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .neq('status', 'completed')
      .lt('due_date', today)
      .order('due_date', { ascending: true });

    if (error) {
      throw new ApiError(500, 'TASK_LIST_ERROR', 'Failed to fetch overdue tasks');
    }

    return (data || []).map((t) => this.mapTaskResponse(t));
  },

  async getTasksForUser(
    organizationId: string,
    userId: string,
    options: TaskListOptions = {},
  ): Promise<{ tasks: TaskResponse[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .from('tasks')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('assigned_to', userId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.priority) {
      query = query.eq('priority', options.priority);
    }

    const sortColumn = options.sortBy || 'due_date';
    const sortOrder = options.sortOrder || 'asc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'TASK_LIST_ERROR', 'Failed to fetch tasks');
    }

    return {
      tasks: (data || []).map((t) => this.mapTaskResponse(t)),
      total: count || 0,
    };
  },

  async updateTask(
    taskId: string,
    organizationId: string,
    request: UpdateTaskRequest,
  ): Promise<TaskResponse> {
    const db = getDatabase();

    // Verify task exists
    await this.getTask(taskId, organizationId);

    const updateData: any = {};
    if (request.title !== undefined) updateData.title = request.title;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.priority !== undefined) updateData.priority = request.priority;
    if (request.status !== undefined) {
      updateData.status = request.status;
      if (request.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (request.dueDate !== undefined) updateData.due_date = request.dueDate;

    const { data, error } = await db
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'TASK_UPDATE_ERROR', 'Failed to update task');
    }

    return this.mapTaskResponse(data);
  },

  async completeTask(taskId: string, organizationId: string): Promise<TaskResponse> {
    return this.updateTask(taskId, organizationId, {
      status: 'completed',
    });
  },

  async deleteTask(taskId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    // Verify task exists
    await this.getTask(taskId, organizationId);

    const { error } = await db.from('tasks').delete().eq('id', taskId);

    if (error) {
      throw new ApiError(500, 'TASK_DELETE_ERROR', 'Failed to delete task');
    }
  },

  async getTaskStats(organizationId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    overdue: number;
  }> {
    const db = getDatabase();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await db
      .from('tasks')
      .select('status, due_date')
      .eq('organization_id', organizationId);

    if (error) {
      throw new ApiError(500, 'STATS_ERROR', 'Failed to fetch statistics');
    }

    const stats = {
      total: data?.length || 0,
      open: data?.filter((t) => t.status === 'open').length || 0,
      inProgress: data?.filter((t) => t.status === 'in_progress').length || 0,
      completed: data?.filter((t) => t.status === 'completed').length || 0,
      overdue:
        data?.filter(
          (t) => t.status !== 'completed' && t.due_date && t.due_date < today,
        ).length || 0,
    };

    return stats;
  },

  private mapTaskResponse(dbTask: any): TaskResponse {
    return {
      id: dbTask.id,
      title: dbTask.title,
      description: dbTask.description,
      priority: dbTask.priority,
      status: dbTask.status,
      assignedTo: dbTask.assigned_to,
      dueDate: dbTask.due_date,
      completedAt: dbTask.completed_at,
      createdAt: new Date(dbTask.created_at),
      updatedAt: new Date(dbTask.updated_at),
    };
  },
};
