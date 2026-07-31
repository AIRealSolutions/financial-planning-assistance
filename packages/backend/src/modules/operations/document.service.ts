import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { DocumentType, DocumentStatus } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export interface CreateDocumentRequest {
  documentType: DocumentType;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  clientId?: string;
  expiresAt?: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  description?: string;
  status?: DocumentStatus;
  expiresAt?: string;
}

export interface DocumentListOptions {
  page?: number;
  limit?: number;
  documentType?: DocumentType;
  status?: DocumentStatus;
  clientId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DocumentResponse {
  id: string;
  documentType: DocumentType;
  title: string;
  description?: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
  status: DocumentStatus;
  clientId?: string;
  isSigned: boolean;
  signedAt?: string;
  expiresAt?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const DocumentService = {
  async createDocument(
    organizationId: string,
    advisorId: string,
    request: CreateDocumentRequest,
  ): Promise<DocumentResponse> {
    const db = getDatabase();
    const documentId = uuidv4();

    const { data, error } = await db
      .from('documents')
      .insert({
        id: documentId,
        organization_id: organizationId,
        advisor_id: advisorId,
        client_id: request.clientId,
        document_type: request.documentType,
        title: request.title,
        description: request.description,
        file_url: request.fileUrl,
        file_size: request.fileSize,
        file_type: request.fileType,
        status: 'draft',
        is_signed: false,
        expires_at: request.expiresAt,
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'DOCUMENT_CREATE_ERROR', 'Failed to create document');
    }

    return this.mapDocumentResponse(data);
  },

  async getDocument(documentId: string, organizationId: string): Promise<DocumentResponse> {
    const db = getDatabase();

    const { data, error } = await db
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
    }

    return this.mapDocumentResponse(data);
  },

  async listDocuments(
    organizationId: string,
    advisorId: string,
    options: DocumentListOptions = {},
  ): Promise<{ documents: DocumentResponse[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    let query = db
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (options.documentType) {
      query = query.eq('document_type', options.documentType);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.clientId) {
      query = query.eq('client_id', options.clientId);
    }

    const sortColumn = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'DOCUMENT_LIST_ERROR', 'Failed to fetch documents');
    }

    return {
      documents: (data || []).map((d) => this.mapDocumentResponse(d)),
      total: count || 0,
    };
  },

  async getClientDocuments(
    clientId: string,
    organizationId: string,
  ): Promise<DocumentResponse[]> {
    const db = getDatabase();

    const { data, error } = await db
      .from('documents')
      .select('*')
      .eq('client_id', clientId)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(500, 'DOCUMENT_LIST_ERROR', 'Failed to fetch documents');
    }

    return (data || []).map((d) => this.mapDocumentResponse(d));
  },

  async getExpiredDocuments(organizationId: string): Promise<DocumentResponse[]> {
    const db = getDatabase();
    const today = new Date().toISOString();

    const { data, error } = await db
      .from('documents')
      .select('*')
      .eq('organization_id', organizationId)
      .neq('status', 'archived')
      .lt('expires_at', today)
      .order('expires_at', { ascending: true });

    if (error) {
      throw new ApiError(500, 'DOCUMENT_LIST_ERROR', 'Failed to fetch expired documents');
    }

    return (data || []).map((d) => this.mapDocumentResponse(d));
  },

  async updateDocument(
    documentId: string,
    organizationId: string,
    request: UpdateDocumentRequest,
  ): Promise<DocumentResponse> {
    const db = getDatabase();

    // Verify document exists
    await this.getDocument(documentId, organizationId);

    const updateData: any = {};
    if (request.title !== undefined) updateData.title = request.title;
    if (request.description !== undefined) updateData.description = request.description;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.expiresAt !== undefined) updateData.expires_at = request.expiresAt;

    const { data, error } = await db
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'DOCUMENT_UPDATE_ERROR', 'Failed to update document');
    }

    return this.mapDocumentResponse(data);
  },

  async markAsSigned(
    documentId: string,
    organizationId: string,
    signedBy: string,
  ): Promise<DocumentResponse> {
    const db = getDatabase();

    // Verify document exists
    await this.getDocument(documentId, organizationId);

    const { data, error } = await db
      .from('documents')
      .update({
        is_signed: true,
        signed_by: signedBy,
        signed_at: new Date().toISOString(),
        status: 'signed',
      })
      .eq('id', documentId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'DOCUMENT_SIGN_ERROR', 'Failed to mark document as signed');
    }

    return this.mapDocumentResponse(data);
  },

  async deleteDocument(documentId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    // Verify document exists
    await this.getDocument(documentId, organizationId);

    const { error } = await db.from('documents').delete().eq('id', documentId);

    if (error) {
      throw new ApiError(500, 'DOCUMENT_DELETE_ERROR', 'Failed to delete document');
    }
  },

  async getDocumentStats(organizationId: string): Promise<{
    total: number;
    draft: number;
    final: number;
    signed: number;
    expired: number;
  }> {
    const db = getDatabase();
    const today = new Date().toISOString();

    const { data, error } = await db
      .from('documents')
      .select('status, expires_at')
      .eq('organization_id', organizationId);

    if (error) {
      throw new ApiError(500, 'STATS_ERROR', 'Failed to fetch statistics');
    }

    const stats = {
      total: data?.length || 0,
      draft: data?.filter((d) => d.status === 'draft').length || 0,
      final: data?.filter((d) => d.status === 'final').length || 0,
      signed: data?.filter((d) => d.status === 'signed').length || 0,
      expired: data?.filter((d) => d.expires_at && d.expires_at < today).length || 0,
    };

    return stats;
  },

  private mapDocumentResponse(dbDocument: any): DocumentResponse {
    return {
      id: dbDocument.id,
      documentType: dbDocument.document_type,
      title: dbDocument.title,
      description: dbDocument.description,
      fileUrl: dbDocument.file_url,
      fileSize: dbDocument.file_size,
      fileType: dbDocument.file_type,
      status: dbDocument.status,
      clientId: dbDocument.client_id,
      isSigned: dbDocument.is_signed,
      signedAt: dbDocument.signed_at,
      expiresAt: dbDocument.expires_at,
      createdAt: new Date(dbDocument.created_at),
      updatedAt: new Date(dbDocument.updated_at),
    };
  },
};
