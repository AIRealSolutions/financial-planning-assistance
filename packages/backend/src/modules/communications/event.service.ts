import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

export interface CreateEventRequest {
  clientId: string;
  title: string;
  description?: string;
  eventType: 'meeting' | 'review' | 'reminder' | 'milestone' | 'deadline' | 'anniversary';
  startDate: string;
  endDate?: string;
  location?: string;
  attendees?: string[];
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceEnd?: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  attendees?: string[];
  status?: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
}

export interface EventResponse {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  location?: string;
  attendees?: string[];
  isRecurring: boolean;
  recurrencePattern?: string;
  recurrenceEnd?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EventListOptions {
  page?: number;
  limit?: number;
  eventType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const EventService = {
  async createEvent(
    organizationId: string,
    advisorId: string,
    request: CreateEventRequest,
  ): Promise<EventResponse> {
    const db = getDatabase();
    const eventId = uuidv4();

    const { data, error } = await db
      .from('events')
      .insert({
        id: eventId,
        organization_id: organizationId,
        client_id: request.clientId,
        advisor_id: advisorId,
        title: request.title,
        description: request.description,
        event_type: request.eventType,
        start_date: request.startDate,
        end_date: request.endDate,
        location: request.location,
        attendees: request.attendees || [],
        is_recurring: request.isRecurring || false,
        recurrence_pattern: request.recurrencePattern,
        recurrence_end: request.recurrenceEnd,
        status: 'scheduled',
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'EVENT_CREATE_ERROR', 'Failed to create event');
    }

    return this.mapEventResponse(data);
  },

  async getEvent(eventId: string, organizationId: string): Promise<EventResponse> {
    const db = getDatabase();

    const { data, error } = await db
      .from('events')
      .select('*')
      .eq('id', eventId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'EVENT_NOT_FOUND', 'Event not found');
    }

    return this.mapEventResponse(data);
  },

  async listEvents(
    organizationId: string,
    advisorId: string,
    options: EventListOptions = {},
  ): Promise<{ events: EventResponse[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .from('events')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (options.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.startDate && options.endDate) {
      query = query.gte('start_date', options.startDate).lte('start_date', options.endDate);
    }

    const sortColumn = options.sortBy || 'start_date';
    const sortOrder = options.sortOrder || 'asc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'EVENT_LIST_ERROR', 'Failed to fetch events');
    }

    return {
      events: (data || []).map((e) => this.mapEventResponse(e)),
      total: count || 0,
    };
  },

  async getClientEvents(
    clientId: string,
    organizationId: string,
    options: EventListOptions = {},
  ): Promise<{ events: EventResponse[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .from('events')
      .select('*', { count: 'exact' })
      .eq('client_id', clientId)
      .eq('organization_id', organizationId);

    if (options.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const sortColumn = options.sortBy || 'start_date';
    const sortOrder = options.sortOrder || 'asc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'EVENT_LIST_ERROR', 'Failed to fetch events');
    }

    return {
      events: (data || []).map((e) => this.mapEventResponse(e)),
      total: count || 0,
    };
  },

  async updateEvent(
    eventId: string,
    organizationId: string,
    request: UpdateEventRequest,
  ): Promise<EventResponse> {
    const db = getDatabase();

    await this.getEvent(eventId, organizationId);

    const updateData: any = {};
    if (request.title !== undefined) updateData.title = request.title;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.eventType !== undefined) updateData.event_type = request.eventType;
    if (request.startDate !== undefined) updateData.start_date = request.startDate;
    if (request.endDate !== undefined) updateData.end_date = request.endDate;
    if (request.location !== undefined) updateData.location = request.location;
    if (request.attendees !== undefined) updateData.attendees = request.attendees;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.notes !== undefined) updateData.notes = request.notes;

    const { data, error } = await db
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'EVENT_UPDATE_ERROR', 'Failed to update event');
    }

    return this.mapEventResponse(data);
  },

  async deleteEvent(eventId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    await this.getEvent(eventId, organizationId);

    const { error } = await db.from('events').delete().eq('id', eventId);

    if (error) {
      throw new ApiError(500, 'EVENT_DELETE_ERROR', 'Failed to delete event');
    }
  },

  async getUpcomingEvents(
    organizationId: string,
    advisorId: string,
    days: number = 7,
  ): Promise<EventResponse[]> {
    const db = getDatabase();
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await db
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId)
      .eq('status', 'scheduled')
      .gte('start_date', today.toISOString())
      .lte('start_date', futureDate.toISOString())
      .order('start_date', { ascending: true });

    if (error) {
      throw new ApiError(500, 'EVENT_LIST_ERROR', 'Failed to fetch upcoming events');
    }

    return (data || []).map((e) => this.mapEventResponse(e));
  },

  async getAnnualCalendarEvents(
    organizationId: string,
    advisorId: string,
    year: number,
  ): Promise<EventResponse[]> {
    const db = getDatabase();
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data, error } = await db
      .from('events')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId)
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .order('start_date', { ascending: true });

    if (error) {
      throw new ApiError(500, 'EVENT_LIST_ERROR', 'Failed to fetch annual calendar events');
    }

    return (data || []).map((e) => this.mapEventResponse(e));
  },

  private mapEventResponse(dbEvent: any): EventResponse {
    return {
      id: dbEvent.id,
      clientId: dbEvent.client_id,
      title: dbEvent.title,
      description: dbEvent.description,
      eventType: dbEvent.event_type,
      startDate: dbEvent.start_date,
      endDate: dbEvent.end_date,
      location: dbEvent.location,
      attendees: dbEvent.attendees,
      isRecurring: dbEvent.is_recurring,
      recurrencePattern: dbEvent.recurrence_pattern,
      recurrenceEnd: dbEvent.recurrence_end,
      status: dbEvent.status,
      notes: dbEvent.notes,
      createdAt: dbEvent.created_at,
      updatedAt: dbEvent.updated_at,
    };
  },
};
