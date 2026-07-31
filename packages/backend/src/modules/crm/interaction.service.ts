import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { Interaction, InteractionType } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { ClientService } from './client.service';

export interface CreateInteractionRequest {
  clientId: string;
  type: InteractionType;
  content?: string;
  durationMinutes?: number;
  outcome?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  tags?: string[];
}

export interface InteractionListOptions {
  page?: number;
  limit?: number;
  type?: InteractionType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const InteractionService = {
  async createInteraction(
    organizationId: string,
    advisorId: string,
    request: CreateInteractionRequest,
  ): Promise<Interaction> {
    const db = getDatabase();
    const interactionId = uuidv4();

    const { data, error } = await db
      .from('interactions')
      .insert({
        id: interactionId,
        organization_id: organizationId,
        client_id: request.clientId,
        advisor_id: advisorId,
        type: request.type,
        content: request.content,
        duration_minutes: request.durationMinutes,
        outcome: request.outcome,
        follow_up_required: request.followUpRequired || false,
        follow_up_date: request.followUpDate,
        tags: request.tags || [],
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'INTERACTION_CREATE_ERROR', 'Failed to create interaction');
    }

    // Update client's last contact time
    await ClientService.updateLastContact(request.clientId);

    return this.mapInteractionResponse(data);
  },

  async getInteraction(interactionId: string, organizationId: string): Promise<Interaction> {
    const db = getDatabase();

    const { data, error } = await db
      .from('interactions')
      .select('*')
      .eq('id', interactionId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'INTERACTION_NOT_FOUND', 'Interaction not found');
    }

    return this.mapInteractionResponse(data);
  },

  async listInteractionsByClient(
    clientId: string,
    organizationId: string,
    options: InteractionListOptions = {},
  ): Promise<{ interactions: Interaction[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    let query = db
      .from('interactions')
      .select('*', { count: 'exact' })
      .eq('client_id', clientId)
      .eq('organization_id', organizationId);

    if (options.type) {
      query = query.eq('type', options.type);
    }

    const sortColumn = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'INTERACTION_LIST_ERROR', 'Failed to fetch interactions');
    }

    return {
      interactions: (data || []).map((i) => this.mapInteractionResponse(i)),
      total: count || 0,
    };
  },

  async listInteractionsByAdvisor(
    advisorId: string,
    organizationId: string,
    options: InteractionListOptions = {},
  ): Promise<{ interactions: Interaction[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 50;
    const offset = (page - 1) * limit;

    let query = db
      .from('interactions')
      .select('*', { count: 'exact' })
      .eq('advisor_id', advisorId)
      .eq('organization_id', organizationId);

    if (options.type) {
      query = query.eq('type', options.type);
    }

    const sortColumn = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'INTERACTION_LIST_ERROR', 'Failed to fetch interactions');
    }

    return {
      interactions: (data || []).map((i) => this.mapInteractionResponse(i)),
      total: count || 0,
    };
  },

  async getInteractionStats(
    organizationId: string,
    advisorId: string,
  ): Promise<Record<InteractionType, number>> {
    const db = getDatabase();

    const { data, error } = await db
      .from('interactions')
      .select('type')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (error) {
      throw new ApiError(500, 'STATS_ERROR', 'Failed to fetch statistics');
    }

    const stats: Record<string, number> = {
      call: 0,
      email: 0,
      meeting: 0,
      note: 0,
      document: 0,
    };

    data?.forEach((interaction) => {
      stats[interaction.type] = (stats[interaction.type] || 0) + 1;
    });

    return stats as Record<InteractionType, number>;
  },

  async getFollowUpTasks(
    organizationId: string,
    advisorId: string,
  ): Promise<Interaction[]> {
    const db = getDatabase();

    const { data, error } = await db
      .from('interactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId)
      .eq('follow_up_required', true)
      .lt('follow_up_date', new Date().toISOString())
      .order('follow_up_date', { ascending: true });

    if (error) {
      throw new ApiError(500, 'FOLLOWUP_ERROR', 'Failed to fetch follow-up tasks');
    }

    return (data || []).map((i) => this.mapInteractionResponse(i));
  },

  private mapInteractionResponse(dbInteraction: any): Interaction {
    return {
      id: dbInteraction.id,
      clientId: dbInteraction.client_id,
      advisorId: dbInteraction.advisor_id,
      type: dbInteraction.type,
      content: dbInteraction.content,
      createdAt: new Date(dbInteraction.created_at),
      updatedAt: new Date(dbInteraction.updated_at),
    };
  },
};
