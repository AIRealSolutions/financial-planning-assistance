import { getDatabase } from '../../db/connection';
import { ApiError } from '../../middleware/errorHandler';
import { Portfolio } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePortfolioRequest {
  clientId: string;
  accountNumber?: string;
  accountType: string;
  totalValue: number;
  cashPosition?: number;
  riskScore?: number;
  benchmark?: string;
  custodian?: string;
  inceptionDate?: string;
  rebalanceFrequency?: string;
}

export interface UpdatePortfolioRequest {
  totalValue?: number;
  cashPosition?: number;
  riskScore?: number;
  performance1y?: number;
  performance3y?: number;
  performance5y?: number;
  lastRebalanceDate?: string;
  status?: string;
}

export interface PortfolioListOptions {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AssetAllocation {
  assetClass: string;
  targetPercentage: number;
  currentPercentage: number;
  currentValue: number;
}

export const PortfolioService = {
  async createPortfolio(
    organizationId: string,
    advisorId: string,
    request: CreatePortfolioRequest,
  ): Promise<Portfolio> {
    const db = getDatabase();
    const portfolioId = uuidv4();

    const { data, error } = await db
      .from('portfolios')
      .insert({
        id: portfolioId,
        organization_id: organizationId,
        client_id: request.clientId,
        advisor_id: advisorId,
        account_number: request.accountNumber,
        account_type: request.accountType,
        total_value: request.totalValue,
        cash_position: request.cashPosition || 0,
        risk_score: request.riskScore,
        benchmark: request.benchmark,
        custodian: request.custodian,
        inception_date: request.inceptionDate,
        rebalance_frequency: request.rebalanceFrequency,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'PORTFOLIO_CREATE_ERROR', 'Failed to create portfolio');
    }

    return this.mapPortfolioResponse(data);
  },

  async getPortfolio(portfolioId: string, organizationId: string): Promise<Portfolio> {
    const db = getDatabase();

    const { data, error } = await db
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      throw new ApiError(404, 'PORTFOLIO_NOT_FOUND', 'Portfolio not found');
    }

    return this.mapPortfolioResponse(data);
  },

  async getClientPortfolios(
    clientId: string,
    organizationId: string,
    options: PortfolioListOptions = {},
  ): Promise<{ portfolios: Portfolio[]; total: number }> {
    const db = getDatabase();
    const page = options.page || 1;
    const limit = options.limit || 10;
    const offset = (page - 1) * limit;

    let query = db
      .from('portfolios')
      .select('*', { count: 'exact' })
      .eq('client_id', clientId)
      .eq('organization_id', organizationId);

    if (options.status) {
      query = query.eq('status', options.status);
    }

    const sortColumn = options.sortBy || 'created_at';
    const sortOrder = options.sortOrder || 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new ApiError(500, 'PORTFOLIO_LIST_ERROR', 'Failed to fetch portfolios');
    }

    return {
      portfolios: (data || []).map((p) => this.mapPortfolioResponse(p)),
      total: count || 0,
    };
  },

  async updatePortfolio(
    portfolioId: string,
    organizationId: string,
    request: UpdatePortfolioRequest,
  ): Promise<Portfolio> {
    const db = getDatabase();

    // Verify portfolio exists
    await this.getPortfolio(portfolioId, organizationId);

    const updateData: any = {};
    if (request.totalValue !== undefined) updateData.total_value = request.totalValue;
    if (request.cashPosition !== undefined) updateData.cash_position = request.cashPosition;
    if (request.riskScore !== undefined) updateData.risk_score = request.riskScore;
    if (request.performance1y !== undefined) updateData.performance_1y = request.performance1y;
    if (request.performance3y !== undefined) updateData.performance_3y = request.performance3y;
    if (request.performance5y !== undefined) updateData.performance_5y = request.performance5y;
    if (request.lastRebalanceDate !== undefined) updateData.last_rebalance_date = request.lastRebalanceDate;
    if (request.status !== undefined) updateData.status = request.status;

    const { data, error } = await db
      .from('portfolios')
      .update(updateData)
      .eq('id', portfolioId)
      .select()
      .single();

    if (error) {
      throw new ApiError(500, 'PORTFOLIO_UPDATE_ERROR', 'Failed to update portfolio');
    }

    return this.mapPortfolioResponse(data);
  },

  async deletePortfolio(portfolioId: string, organizationId: string): Promise<void> {
    const db = getDatabase();

    // Verify portfolio exists
    await this.getPortfolio(portfolioId, organizationId);

    const { error } = await db.from('portfolios').delete().eq('id', portfolioId);

    if (error) {
      throw new ApiError(500, 'PORTFOLIO_DELETE_ERROR', 'Failed to delete portfolio');
    }
  },

  async setAssetAllocation(
    portfolioId: string,
    allocations: Array<{
      assetClass: string;
      targetPercentage: number;
      currentValue: number;
    }>,
  ): Promise<void> {
    const db = getDatabase();

    // Delete existing allocations
    await db.from('asset_allocations').delete().eq('portfolio_id', portfolioId);

    // Insert new allocations
    const allocationData = allocations.map((a) => ({
      id: uuidv4(),
      portfolio_id: portfolioId,
      asset_class: a.assetClass,
      target_percentage: a.targetPercentage,
      current_value: a.currentValue,
      current_percentage: 0, // Will be calculated
    }));

    const { error } = await db.from('asset_allocations').insert(allocationData);

    if (error) {
      throw new ApiError(500, 'ALLOCATION_ERROR', 'Failed to set asset allocation');
    }
  },

  async getAssetAllocation(portfolioId: string): Promise<AssetAllocation[]> {
    const db = getDatabase();

    const { data, error } = await db
      .from('asset_allocations')
      .select('*')
      .eq('portfolio_id', portfolioId);

    if (error) {
      throw new ApiError(500, 'ALLOCATION_LIST_ERROR', 'Failed to fetch allocations');
    }

    return (data || []).map((a) => ({
      assetClass: a.asset_class,
      targetPercentage: a.target_percentage,
      currentPercentage: a.current_percentage,
      currentValue: a.current_value,
    }));
  },

  async rebalancePortfolio(
    portfolioId: string,
    organizationId: string,
  ): Promise<{ message: string; allocations: AssetAllocation[] }> {
    const db = getDatabase();

    // Get portfolio
    const portfolio = await this.getPortfolio(portfolioId, organizationId);

    // Get current allocations
    const allocations = await this.getAssetAllocation(portfolioId);

    // Calculate new allocation values based on target percentages
    const rebalancedAllocations = allocations.map((a) => ({
      ...a,
      currentValue: (portfolio.totalValue * a.targetPercentage) / 100,
      currentPercentage: a.targetPercentage,
    }));

    // Update allocations
    for (const allocation of rebalancedAllocations) {
      await db
        .from('asset_allocations')
        .update({
          current_percentage: allocation.currentPercentage,
          current_value: allocation.currentValue,
        })
        .eq('portfolio_id', portfolioId)
        .eq('asset_class', allocation.assetClass);
    }

    // Update portfolio with rebalance date
    await db
      .from('portfolios')
      .update({ last_rebalance_date: new Date().toISOString() })
      .eq('id', portfolioId);

    return {
      message: 'Portfolio rebalanced successfully',
      allocations: rebalancedAllocations,
    };
  },

  async getPortfolioPerformance(portfolioId: string): Promise<{
    ytd?: number;
    performance1y?: number;
    performance3y?: number;
    performance5y?: number;
  }> {
    const db = getDatabase();

    const { data, error } = await db
      .from('portfolios')
      .select('performance_ytd, performance_1y, performance_3y, performance_5y')
      .eq('id', portfolioId)
      .single();

    if (error) {
      throw new ApiError(500, 'PERFORMANCE_ERROR', 'Failed to fetch performance');
    }

    return {
      ytd: data?.performance_ytd,
      performance1y: data?.performance_1y,
      performance3y: data?.performance_3y,
      performance5y: data?.performance_5y,
    };
  },

  async getPortfolioStats(organizationId: string, advisorId: string): Promise<{
    totalPortfolios: number;
    totalAssetsUnderManagement: number;
    averageRiskScore: number;
    portfoliosByStatus: Record<string, number>;
  }> {
    const db = getDatabase();

    const { data, error } = await db
      .from('portfolios')
      .select('total_value, risk_score, status')
      .eq('organization_id', organizationId)
      .eq('advisor_id', advisorId);

    if (error) {
      throw new ApiError(500, 'STATS_ERROR', 'Failed to fetch statistics');
    }

    const portfolios = data || [];
    const totalAssetsUnderManagement = portfolios.reduce((sum, p) => sum + (p.total_value || 0), 0);
    const averageRiskScore = portfolios.length > 0
      ? portfolios.reduce((sum, p) => sum + (p.risk_score || 0), 0) / portfolios.length
      : 0;

    const portfoliosByStatus: Record<string, number> = {};
    portfolios.forEach((p) => {
      portfoliosByStatus[p.status] = (portfoliosByStatus[p.status] || 0) + 1;
    });

    return {
      totalPortfolios: portfolios.length,
      totalAssetsUnderManagement,
      averageRiskScore,
      portfoliosByStatus,
    };
  },

  private mapPortfolioResponse(dbPortfolio: any): Portfolio {
    return {
      id: dbPortfolio.id,
      clientId: dbPortfolio.client_id,
      advisorId: dbPortfolio.advisor_id,
      accountNumber: dbPortfolio.account_number,
      accountType: dbPortfolio.account_type,
      totalValue: dbPortfolio.total_value,
      cashPosition: dbPortfolio.cash_position,
      riskScore: dbPortfolio.risk_score,
      status: dbPortfolio.status,
      createdAt: new Date(dbPortfolio.created_at),
      updatedAt: new Date(dbPortfolio.updated_at),
    };
  },
};
