import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { PortfolioService } from '../modules/planning/portfolio.service';
import { PlanService } from '../modules/planning/plan.service';
import { SimulationService } from '../modules/planning/simulation.service';

const router = Router();

// Middleware to ensure authentication for all planning routes
router.use(authenticate);

// ==================== PORTFOLIO ROUTES ====================

// POST /api/planning/portfolios - Create portfolio
router.post('/portfolios', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const portfolio = await PortfolioService.createPortfolio(
      req.user.organizationId,
      req.user.userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: portfolio,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/planning/portfolios - Get client portfolios
router.get('/portfolios', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const clientId = req.query.clientId as string;
    if (!clientId) throw new ApiError(400, 'MISSING_PARAMS', 'clientId is required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { portfolios, total } = await PortfolioService.getClientPortfolios(
      clientId,
      req.user.organizationId,
      { page, limit },
    );

    res.json({
      success: true,
      data: {
        portfolios,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/planning/portfolios/:portfolioId - Get portfolio detail
router.get('/portfolios/:portfolioId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const portfolio = await PortfolioService.getPortfolio(req.params.portfolioId, req.user.organizationId);
    const allocations = await PortfolioService.getAssetAllocation(req.params.portfolioId);
    const performance = await PortfolioService.getPortfolioPerformance(req.params.portfolioId);

    res.json({
      success: true,
      data: { portfolio, allocations, performance },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/planning/portfolios/:portfolioId - Update portfolio
router.patch('/portfolios/:portfolioId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const portfolio = await PortfolioService.updatePortfolio(
      req.params.portfolioId,
      req.user.organizationId,
      req.body,
    );

    res.json({
      success: true,
      data: portfolio,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/planning/portfolios/:portfolioId/allocations - Set asset allocation
router.post('/portfolios/:portfolioId/allocations', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    await PortfolioService.setAssetAllocation(req.params.portfolioId, req.body.allocations);

    res.json({
      success: true,
      data: { message: 'Asset allocation updated' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/planning/portfolios/:portfolioId/rebalance - Rebalance portfolio
router.post('/portfolios/:portfolioId/rebalance', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const result = await PortfolioService.rebalancePortfolio(req.params.portfolioId, req.user.organizationId);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/planning/stats/portfolios - Portfolio statistics
router.get('/stats/portfolios', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const stats = await PortfolioService.getPortfolioStats(req.user.organizationId, req.user.userId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PLAN ROUTES ====================

// POST /api/planning/plans - Create financial plan
router.post('/plans', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const plan = await PlanService.createPlan(
      req.user.organizationId,
      req.user.userId,
      req.body,
    );

    res.status(201).json({
      success: true,
      data: plan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/planning/plans - Get client plans
router.get('/plans', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const clientId = req.query.clientId as string;
    if (!clientId) throw new ApiError(400, 'MISSING_PARAMS', 'clientId is required');

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const planType = req.query.planType as string;

    const { plans, total } = await PlanService.getClientPlans(
      clientId,
      req.user.organizationId,
      { page, limit, status: status as any, planType: planType as any },
    );

    res.json({
      success: true,
      data: {
        plans,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/planning/plans/:planId - Get plan detail
router.get('/plans/:planId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const plan = await PlanService.getPlan(req.params.planId, req.user.organizationId);
    const goals = await PlanService.getPlanGoals(req.params.planId);

    res.json({
      success: true,
      data: { plan, goals },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/planning/plans/:planId - Update plan
router.patch('/plans/:planId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const plan = await PlanService.updatePlan(req.params.planId, req.user.organizationId, req.body);

    res.json({
      success: true,
      data: plan,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/planning/plans/:planId/goals - Add goal
router.post('/plans/:planId/goals', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const goal = await PlanService.addGoal(
      req.params.planId,
      req.body.goalName,
      req.body.description,
      req.body.targetAmount,
      req.body.targetDate,
      req.body.priority,
    );

    res.status(201).json({
      success: true,
      data: goal,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/planning/goals/:goalId - Update goal
router.patch('/goals/:goalId', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const goal = await PlanService.updateGoal(req.params.goalId, req.body);

    res.json({
      success: true,
      data: goal,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/planning/stats/plans - Plan statistics
router.get('/stats/plans', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const stats = await PlanService.getPlanStats(req.user.organizationId, req.user.userId);

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// ==================== SIMULATION & ANALYSIS ROUTES ====================

// POST /api/planning/simulate/monte-carlo - Run Monte Carlo simulation
router.post('/simulate/monte-carlo', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const result = SimulationService.monteCarloSimulation(req.body);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/planning/analyze/retirement - Retirement projection
router.post('/analyze/retirement', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const result = SimulationService.retirementProjection(req.body);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/planning/analyze/college - College savings projection
router.post('/analyze/college', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const result = SimulationService.collegeSavingsProjection(req.body);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/planning/analyze/inflation - Inflation analysis
router.post('/analyze/inflation', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const result = SimulationService.inflationAnalysis(req.body);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/planning/analyze/required-return - Calculate required return
router.post('/analyze/required-return', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

    const requiredReturn = SimulationService.requiredReturnToGoal(req.body);

    res.json({
      success: true,
      data: { requiredReturn: (requiredReturn * 100).toFixed(2) + '%' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
