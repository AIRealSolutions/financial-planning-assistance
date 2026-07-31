import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { Meeting, MeetingStatus, MeetingType } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateMeetingRequest {
  clientId?: string;
  title: string;
  description?: string;
  type: MeetingType;
  startTime: string;
  endTime: string;
  location?: string;
  videoLink?: string;
  isVirtual?: boolean;
  timezone?: string;
  attendees?: Array<{ name: string; email: string }>;
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  type?: MeetingType;
  startTime?: string;
  endTime?: string;
  location?: string;
  videoLink?: string;
  status?: MeetingStatus;
  notes?: string;
}

export interface MeetingListOptions {
  page?: number;
  limit?: number;
  status?: MeetingStatus;
  type?: MeetingType;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const CalendarService = {
  async createMeeting(
    organizationId: string,
    advisorId: string,
    request: CreateMeetingRequest,
  ): Promise<Meeting> {
    const db = getDatabase();
    const meetingId = uuidv4();

    const startTime = new Date(request.startTime);
    const endTime = new Date(request.endTime);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    const { data, error } = await db
      .from('meetings')
      .insert({
        id: meetingId,
        organization_id: organizationId,
        advisor_id: advisorId,
        client_id: request.clientId,
        title: request.title,
        description: request.description,
        type: request.type,
        status: 'scheduled',
        start_time: request.startTime,
        end_time: request.endTime,
        duration_minutes: durationMinutes,
        location: request.location,
        video_link: request.videoLink,
        is_virtual: request.isVirtual || false,
        timezone: request.timezone || 'UTC',
        attendees: request.attendees || [],
        created_by: advisorId,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'MEETING_CREATE_ERROR', 'Failed to create meeting');
    }

    return this.mapMeetingResponse(data);
  },

  async getMeeting(meetingId: string, organizationId: string): Promise<Meeting> {
    const db = getDatabase();

    const { data, error } = await db
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'MEETING_NOT_FOUND', 'Meeting not found');
    }

    return this.mapMeetingResponse(data);
  },

  async listMeetings(
    advisorId: string,
    organizationId: string,
    options: MeetingListOptions = {},
  ): Promise<{ meetings: Meeting[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .from('meetings')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.type) {
      query = query.eq('type', options.type);
    }

    if (options.startDate) {
      query = query.gte('start_time', options.startDate);
    }

    if (options.endDate) {
      query = query.lte('start_time', options.endDate);
    }

    const sortColumn = options.sortBy || 'start_time';
    const sortOrder = options.sortOrder || 'asc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'MEETING_LIST_ERROR', 'Failed to fetch meetings');
    }

    return {
      meetings: (data || []).map((m) => this.mapMeetingResponse(m)),
      total: count || 0,
    };
  },

  async getUpcomingMeetings(
    advisorId: string,
    organizationId: string,
    days: number = 7,
  ): Promise<Meeting[]> {
    const db = getDatabase();
    const now = new Date();
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const { data, error } = await db
      .from('meetings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId)
      .eq('status', 'scheduled')
      .gte('start_time', now.toISOString())
      .lte('start_time', future.toISOString())
      .order('start_time', { ascending: true });

    if (error) {
      throw new ApiError(500, 'MEETING_LIST_ERROR', 'Failed to fetch upcoming meetings');
    }

    return (data || []).map((m) => this.mapMeetingResponse(m));
  },

  async updateMeeting(
    meetingId: string,
    organizationId: string,
    request: UpdateMeetingRequest,
  ): Promise<Meeting> {
    const db = getDatabase();

    // Verify meeting exists
    await this.getMeeting(meetingId, organizationId);

    const updateData: any = {};
    if (request.title !== undefined) updateData.title = request.title;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.type !== undefined) updateData.type = request.type;
    if (request.startTime !== undefined) updateData.start_time = request.startTime;
    if (request.endTime !== undefined) updateData.end_time = request.endTime;
    if (request.location !== undefined) updateData.location = request.location;
    if (request.videoLink !== undefined) updateData.video_link = request.videoLink;
    if (request.status !== undefined) {
      updateData.status = request.status;
      if (request.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
    }
    if (request.notes !== undefined) updateData.notes = request.notes;

    const { data, error } = await db
      .from('meetings')
      .update(updateData)
      .eq('id', meetingId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'MEETING_UPDATE_ERROR', 'Failed to update meeting');
    }

    return this.mapMeetingResponse(data);
  },

  async deleteMeeting(meetingId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    // Verify meeting exists
    await this.getMeeting(meetingId, organizationId);

    const { error } = await db.from('meetings').delete().eq('id', meetingId);

    if (error) {
      throw new ApiError(500, 'MEETING_DELETE_ERROR', 'Failed to delete meeting');
    }
  },

  async checkAvailability(
    advisorId: string,
    organizationId: string,
    startTime: string,
    endTime: string,
  ): Promise<boolean> {
    const db = getDatabase();

    const { data, error } = await db
      .from('meetings')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId)
      .eq('status', 'scheduled')
      .lt('start_time', endTime)
      .gt('end_time', startTime)
      .limit(1);

    if (error) {
      throw new ApiError(500, 'AVAILABILITY_ERROR', 'Failed to check availability');
    }

    return !data || data.length === 0;
  },

  async addMeetingNotes(meetingId: string, content: string, userId: string): Promise<void> {
    const db = getDatabase();

    const { error } = await db
      .from('meeting_notes')
      .insert({
        id: uuidv4(),
        meeting_id: meetingId,
        content,
        created_by: userId,
      });

    if (error) {
      throw new ApiError(500, 'NOTE_CREATE_ERROR', 'Failed to add notes');
    }
  },

  async getMeetingNotes(meetingId: string): Promise<any[]> {
    const db = getDatabase();

    const { data, error } = await db
      .from('meeting_notes')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(500, 'NOTE_LIST_ERROR', 'Failed to fetch notes');
    }

    return data || [];
  },

  async addActionItem(
    meetingId: string,
    description: string,
    assignedTo?: string,
    dueDate?: string,
  ): Promise<void> {
    const db = getDatabase();

    const { error } = await db
      .from('meeting_action_items')
      .insert({
        id: uuidv4(),
        meeting_id: meetingId,
        description,
        assigned_to: assignedTo,
        due_date: dueDate,
      });

    if (error) {
      throw new ApiError(500, 'ACTION_ITEM_ERROR', 'Failed to create action item');
    }
  },

  async getActionItems(meetingId: string): Promise<any[]> {
    const db = getDatabase();

    const { data, error } = await db
      .from('meeting_action_items')
      .select('*')
      .eq('meeting_id', meetingId)
      .order('due_date', { ascending: true });

    if (error) {
      throw new ApiError(500, 'ACTION_ITEM_LIST_ERROR', 'Failed to fetch action items');
    }

    return data || [];
  },

  private mapMeetingResponse(dbMeeting: any): Meeting {
    return {
      id: dbMeeting.id,
      organizationId: dbMeeting.organization_id,
      advisorId: dbMeeting.advisor_id,
      clientId: dbMeeting.client_id,
      title: dbMeeting.title,
      description: dbMeeting.description,
      type: dbMeeting.type,
      status: dbMeeting.status,
      startTime: new Date(dbMeeting.start_time),
      endTime: new Date(dbMeeting.end_time),
      location: dbMeeting.location,
      isVirtual: dbMeeting.is_virtual,
      createdAt: new Date(dbMeeting.created_at),
      updatedAt: new Date(dbMeeting.updated_at),
    };
  },
};
