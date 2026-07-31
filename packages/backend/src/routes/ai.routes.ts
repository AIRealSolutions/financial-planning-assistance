import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import { RecommendationService } from '../modules/ai/recommendation.service';
import { PlanGenerationService } from '../modules/ai/plan-generation.service';
import { SummarizationService } from '../modules/ai/summarization.service';

const router = Router();

// Middleware to ensure authentication for all AI routes
router.use(authenticate);

// ==================== RECOMMENDATION ROUTES ====================

// POST /api/ai/recommendations/portfolio - Generate portfolio recommendations
router.post(
  '/recommendations/portfolio',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

      const recommendations = await RecommendationService.generatePortfolioRecommendations(
        req.body,
      );
      const prioritized = await RecommendationService.prioritizeRecommendations(recommendations);

      res.json({
        success: true,
        data: { recommendations: prioritized, count: prioritized.length },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/ai/recommendations/retirement - Generate retirement recommendations
router.post(
  '/recommendations/retirement',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

      const recommendations = await RecommendationService.generateRetirementRecommendations(
        req.body,
      );
      const prioritized = await RecommendationService.prioritizeRecommendations(recommendations);

      res.json({
        success: true,
        data: { recommendations: prioritized, count: prioritized.length },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/ai/recommendations/engagement - Generate engagement recommendations
router.post(
  '/recommendations/engagement',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

      const { clientProfile, lastContactDays } = req.body;
      const recommendations = await RecommendationService.generateClientEngagementRecommendations(
        clientProfile,
        lastContactDays,
      );
      const prioritized = await RecommendationService.prioritizeRecommendations(recommendations);

      res.json({
        success: true,
        data: { recommendations: prioritized, count: prioritized.length },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/ai/recommendations/upsell - Generate cross-sell opportunities
router.post(
  '/recommendations/upsell',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

      const recommendations = await RecommendationService.generateCrossSellingOpportunities(
        req.body,
      );
      const prioritized = await RecommendationService.prioritizeRecommendations(recommendations);

      res.json({
        success: true,
        data: { recommendations: prioritized, count: prioritized.length },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

// ==================== PLAN GENERATION ROUTES ====================

// POST /api/ai/plans/generate - Generate comprehensive financial plan
router.post(
  '/plans/generate',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

      const plan = await PlanGenerationService.generateComprehensivePlan(req.body);

      res.status(201).json({
        success: true,
        data: plan,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

// ==================== SUMMARIZATION ROUTES ====================

// POST /api/ai/summarize/document - Summarize document
router.post(
  '/summarize/document',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

      const { documentContent, documentType } = req.body;

      if (!documentContent) {
        throw new ApiError(400, 'MISSING_PARAMS', 'documentContent is required');
      }

      const summary = await SummarizationService.summarizeDocument(
        documentContent,
        documentType || 'general',
      );

      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/ai/summarize/conversation - Summarize conversation
router.post(
  '/summarize/conversation',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

      const { conversationTranscript, conversationDate } = req.body;

      if (!conversationTranscript) {
        throw new ApiError(400, 'MISSING_PARAMS', 'conversationTranscript is required');
      }

      const summary = await SummarizationService.summarizeConversation(
        conversationTranscript,
        conversationDate || new Date().toISOString(),
      );

      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

// POST /api/ai/summarize/market - Generate market analysis summary
router.post(
  '/summarize/market',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required');

      const { marketData, analysisDate } = req.body;

      if (!marketData) {
        throw new ApiError(400, 'MISSING_PARAMS', 'marketData is required');
      }

      const summary = await SummarizationService.generateMarketAnalysisSummary(
        marketData,
        analysisDate || new Date().toISOString().split('T')[0],
      );

      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
