import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { Client, ClientStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateClientRequest {
  email?: string;
  phone?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  maritalStatus?: string;
  occupation?: string;
  householdIncome?: number;
  netWorth?: number;
  riskProfile?: string;
  status?: ClientStatus;
  tags?: string[];
  sourceOfIntroduction?: string;
}

export interface UpdateClientRequest {
  email?: string;
  phone?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  householdIncome?: number;
  netWorth?: number;
  riskProfile?: string;
  status?: ClientStatus;
  tags?: string[];
  nextReviewDate?: string;
}

export interface ClientListOptions {
  page?: number;
  limit?: number;
  status?: ClientStatus;
  search?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const ClientService = {
  async createClient(
    organizationId: string,
    advisorId: string,
    request: CreateClientRequest,
  ): Promise<Client> {
    const db = getDatabase();
    const clientId = uuidv4();

    const { data, error } = await db
      .from('clients')
      .insert({
        id: clientId,
        organization_id: organizationId,
        advisor_id: advisorId,
        email: request.email,
        phone: request.phone,
        full_name: request.fullName,
        first_name: request.firstName,
        last_name: request.lastName,
        date_of_birth: request.dateOfBirth,
        gender: request.gender,
        marital_status: request.maritalStatus,
        occupation: request.occupation,
        household_income: request.householdIncome,
        net_worth: request.netWorth,
        risk_profile: request.riskProfile,
        status: request.status || 'prospect',
        tags: request.tags || [],
        source_of_introduction: request.sourceOfIntroduction,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'CLIENT_CREATE_ERROR', 'Failed to create client');
    }

    return this.mapClientResponse(data);
  },

  async getClient(clientId: string, organizationId: string): Promise<Client> {
    const db = getDatabase();

    const { data, error } = await db
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'CLIENT_NOT_FOUND', 'Client not found');
    }

    return this.mapClientResponse(data);
  },

  async listClients(
    organizationId: string,
    advisorId: string,
    options: ClientListOptions = {},
  ): Promise<{ clients: Client[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .from('clients')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.search) {
      query = query.or(
        `full_name.ilike.%${options.search}%,email.ilike.%${options.search}%`,
      );
    }

    if (options.tags && options.tags.length > 0) {
      query = query.contains('tags', options.tags);
    }

    const sortColumn = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'CLIENT_LIST_ERROR', 'Failed to fetch clients');
    }

    return {
      clients: (data || []).map((c) => this.mapClientResponse(c)),
      total: count || 0,
    };
  },

  async updateClient(
    clientId: string,
    organizationId: string,
    request: UpdateClientRequest,
  ): Promise<Client> {
    const db = getDatabase();

    // Verify client exists
    await this.getClient(clientId, organizationId);

    const updateData: any = {};
    if (request.email !== undefined) updateData.email = request.email;
    if (request.phone !== undefined) updateData.phone = request.phone;
    if (request.fullName !== undefined) updateData.full_name = request.fullName;
    if (request.firstName !== undefined) updateData.first_name = request.firstName;
    if (request.lastName !== undefined) updateData.last_name = request.lastName;
    if (request.householdIncome !== undefined) updateData.household_income = request.householdIncome;
    if (request.netWorth !== undefined) updateData.net_worth = request.netWorth;
    if (request.riskProfile !== undefined) updateData.risk_profile = request.riskProfile;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.tags !== undefined) updateData.tags = request.tags;
    if (request.nextReviewDate !== undefined) updateData.next_review_date = request.nextReviewDate;

    const { data, error } = await db
      .from('clients')
      .update(updateData)
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'CLIENT_UPDATE_ERROR', 'Failed to update client');
    }

    return this.mapClientResponse(data);
  },

  async deleteClient(clientId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    // Verify client exists
    await this.getClient(clientId, organizationId);

    const { error } = await db
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) {
      throw new ApiError(500, 'CLIENT_DELETE_ERROR', 'Failed to delete client');
    }
  },

  async updateLastContact(clientId: string): Promise<void> {
    const db = getDatabase();

    await db
      .from('clients')
      .update({ last_contact_at: new Date().toISOString() })
      .eq('id', clientId);
  },

  async getClientStats(
    organizationId: string,
    advisorId: string,
  ): Promise<{
    total: number;
    active: number;
    prospect: number;
    dormant: number;
  }> {
    const db = getDatabase();

    const { data, error } = await db
      .from('clients')
      .select('status')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (error) {
      throw new ApiError(500, 'STATS_ERROR', 'Failed to fetch statistics');
    }

    const stats = {
      total: data?.length || 0,
      active: data?.filter((c) => c.status === 'active').length || 0,
      prospect: data?.filter((c) => c.status === 'prospect').length || 0,
      dormant: data?.filter((c) => c.status === 'dormant').length || 0,
    };

    return stats;
  },

  private mapClientResponse(dbClient: any): Client {
    return {
      id: dbClient.id,
      organizationId: dbClient.organization_id,
      advisorId: dbClient.advisor_id,
      email: dbClient.email,
      phone: dbClient.phone,
      fullName: dbClient.full_name,
      firstName: dbClient.first_name,
      lastName: dbClient.last_name,
      dateOfBirth: dbClient.date_of_birth ? new Date(dbClient.date_of_birth) : undefined,
      gender: dbClient.gender,
      maritalStatus: dbClient.marital_status,
      occupation: dbClient.occupation,
      householdIncome: dbClient.household_income,
      netWorth: dbClient.net_worth,
      riskProfile: dbClient.risk_profile,
      status: dbClient.status,
      tags: dbClient.tags || [],
      lastContactAt: dbClient.last_contact_at ? new Date(dbClient.last_contact_at) : undefined,
      nextReviewDate: dbClient.next_review_date ? new Date(dbClient.next_review_date) : undefined,
      createdAt: new Date(dbClient.created_at),
      updatedAt: new Date(dbClient.updated_at),
    };
  },
};
