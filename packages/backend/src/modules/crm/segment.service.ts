import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface CreateSegmentRequest {
  name: string;
  description?: string;
  criteria: Record<string, any>;
  isDynamic?: boolean;
}

export interface ClientSegment {
  id: string;
  organizationId: string;
  advisorId: string;
  name: string;
  description?: string;
  criteria: Record<string, any>;
  clientCount: number;
  isDynamic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const SegmentService = {
  async createSegment(
    organizationId: string,
    advisorId: string,
    request: CreateSegmentRequest,
  ): Promise<ClientSegment> {
    const db = getDatabase();
    const segmentId = uuidv4();

    const { data, error } = await db
      .from('client_segments')
      .insert({
        id: segmentId,
        organization_id: organizationId,
        advisor_id: advisorId,
        name: request.name,
        description: request.description,
        criteria: request.criteria,
        is_dynamic: request.isDynamic !== false,
        client_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'SEGMENT_CREATE_ERROR', 'Failed to create segment');
    }

    return this.mapSegmentResponse(data);
  },

  async getSegment(segmentId: string, organizationId: string): Promise<ClientSegment> {
    const db = getDatabase();

    const { data, error } = await db
      .from('client_segments')
      .select('*')
      .eq('id', segmentId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'SEGMENT_NOT_FOUND', 'Segment not found');
    }

    return this.mapSegmentResponse(data);
  },

  async listSegments(
    organizationId: string,
    advisorId: string,
  ): Promise<ClientSegment[]> {
    const db = getDatabase();

    const { data, error } = await db
      .from('client_segments')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(500, 'SEGMENT_LIST_ERROR', 'Failed to fetch segments');
    }

    return (data || []).map((s) => this.mapSegmentResponse(s));
  },

  async updateSegment(
    segmentId: string,
    organizationId: string,
    request: Partial<CreateSegmentRequest>,
  ): Promise<ClientSegment> {
    const db = getDatabase();

    // Verify segment exists
    await this.getSegment(segmentId, organizationId);

    const updateData: any = {};
    if (request.name !== undefined) updateData.name = request.name;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.criteria !== undefined) updateData.criteria = request.criteria;
    if (request.isDynamic !== undefined) updateData.is_dynamic = request.isDynamic;

    const { data, error } = await db
      .from('client_segments')
      .update(updateData)
      .eq('id', segmentId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'SEGMENT_UPDATE_ERROR', 'Failed to update segment');
    }

    return this.mapSegmentResponse(data);
  },

  async deleteSegment(segmentId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    // Verify segment exists
    await this.getSegment(segmentId, organizationId);

    const { error } = await db
      .from('client_segments')
      .delete()
      .eq('id', segmentId);

    if (error) {
      throw new ApiError(500, 'SEGMENT_DELETE_ERROR', 'Failed to delete segment');
    }
  },

  async getSegmentClients(
    segmentId: string,
    organizationId: string,
  ): Promise<string[]> {
    const db = getDatabase();
    const segment = await this.getSegment(segmentId, organizationId);

    // For now, return empty array. In production, would evaluate criteria
    // against client database to find matching clients
    return [];
  },

  async updateSegmentClientCount(segmentId: string, count: number): Promise<void> {
    const db = getDatabase();

    await db
      .from('client_segments')
      .update({ client_count: count })
      .eq('id', segmentId);
  },

  // Predefined segments for quick access
  async getDefaultSegments(
    organizationId: string,
    advisorId: string,
  ): Promise<ClientSegment[]> {
    const defaultSegments = [
      {
        name: 'High Net Worth',
        description: 'Clients with net worth > $1M',
        criteria: { netWorth: { gt: 1000000 } },
      },
      {
        name: 'Active Clients',
        description: 'Clients with active status',
        criteria: { status: 'active' },
      },
      {
        name: 'At Risk',
        description: 'Clients who haven\'t been contacted in 90 days',
        criteria: { lastContactAt: { lt: 90 } },
      },
      {
        name: 'Prospects',
        description: 'Potential clients not yet converted',
        criteria: { status: 'prospect' },
      },
    ];

    // Check if default segments already exist, if not create them
    const existing = await this.listSegments(organizationId, advisorId);

    const toCreate = defaultSegments.filter(
      (ds) => !existing.some((es) => es.name === ds.name),
    );

    const created: ClientSegment[] = [];
    for (const segment of toCreate) {
      const newSegment = await this.createSegment(organizationId, advisorId, segment);
      created.push(newSegment);
    }

    return created;
  },

  private mapSegmentResponse(dbSegment: any): ClientSegment {
    return {
      id: dbSegment.id,
      organizationId: dbSegment.organization_id,
      advisorId: dbSegment.advisor_id,
      name: dbSegment.name,
      description: dbSegment.description,
      criteria: dbSegment.criteria,
      clientCount: dbSegment.client_count || 0,
      isDynamic: dbSegment.is_dynamic,
      createdAt: new Date(dbSegment.created_at),
      updatedAt: new Date(dbSegment.updated_at),
    };
  },
};
