import { ApiError } from '../../middleware/errorHandler';

export interface ClientProfile {
  id: string;
  age?: number;
  income?: number;
  netWorth?: number;
  riskTolerance?: string;
  goals?: string[];
  clientStatus?: string;
}

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  confidence: number;
  rationale: string;
  suggestedAction?: string;
  estimatedImpact?: string;
}

export const RecommendationService = {
  async generatePortfolioRecommendations(clientProfile: ClientProfile): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (!clientProfile.age) {
      throw new ApiError(400, 'INVALID_PROFILE', 'Client age is required for recommendations');
    }

    const yearsToRetirement = 65 - clientProfile.age;

    if (yearsToRetirement > 25) {
      recommendations.push({
        id: '1',
        type: 'asset_allocation',
        title: 'Increase Equity Exposure',
        description: 'With 25+ years until retirement, you have time to recover from market downturns. Consider increasing equity exposure for long-term growth.',
        priority: 'high',
        confidence: 0.85,
        rationale: 'Time horizon supports higher risk/volatility tolerance',
        suggestedAction: 'Rebalance to 80% equities, 20% fixed income',
        estimatedImpact: '2-3% additional annual returns',
      });
    } else if (yearsToRetirement > 10) {
      recommendations.push({
        id: '2',
        type: 'asset_allocation',
        title: 'Moderate Risk Portfolio',
        description: 'With 10-25 years to retirement, a balanced approach can provide growth with reduced volatility.',
        priority: 'high',
        confidence: 0.82,
        rationale: 'Moderate time horizon requires balanced risk management',
        suggestedAction: 'Rebalance to 60% equities, 40% fixed income',
        estimatedImpact: '1-2% additional annual returns',
      });
    } else {
      recommendations.push({
        id: '3',
        type: 'asset_allocation',
        title: 'Conservative Positioning',
        description: 'As retirement approaches, protecting capital becomes increasingly important. Consider a more conservative allocation.',
        priority: 'high',
        confidence: 0.88,
        rationale: 'Limited time to recovery from significant market downturns',
        suggestedAction: 'Rebalance to 40% equities, 60% fixed income',
        estimatedImpact: 'Reduced volatility and downside risk',
      });
    }

    if (clientProfile.riskTolerance === 'aggressive' && yearsToRetirement > 20) {
      recommendations.push({
        id: '4',
        type: 'growth_strategy',
        title: 'Consider Alternative Investments',
        description: 'Your risk tolerance and time horizon support exploration of alternative investments for diversification.',
        priority: 'medium',
        confidence: 0.75,
        rationale: 'Aggressive profile with long time horizon allows for alternative exposure',
        suggestedAction: 'Allocate 10-15% to alternatives (real estate, hedge funds)',
        estimatedImpact: 'Enhanced portfolio diversification',
      });
    }

    if (clientProfile.clientStatus === 'at_risk') {
      recommendations.push({
        id: '5',
        type: 'engagement',
        title: 'Schedule Quarterly Reviews',
        description: 'Regular check-ins help ensure your plan stays on track and allows for timely adjustments.',
        priority: 'high',
        confidence: 0.9,
        rationale: 'At-risk clients benefit from increased engagement frequency',
        suggestedAction: 'Schedule next quarter review within 30 days',
        estimatedImpact: 'Improved client retention and outcomes',
      });
    }

    return recommendations;
  },

  async generateRetirementRecommendations(clientProfile: ClientProfile): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (!clientProfile.age || !clientProfile.income || !clientProfile.netWorth) {
      throw new ApiError(400, 'INVALID_PROFILE', 'Age, income, and net worth required for retirement recommendations');
    }

    const yearsToRetirement = 65 - clientProfile.age;
    const projectedRetirementNeeds = clientProfile.income * 0.8 * yearsToRetirement;

    if (clientProfile.netWorth < projectedRetirementNeeds * 0.7) {
      recommendations.push({
        id: 'ret-1',
        type: 'retirement_savings',
        title: 'Increase Retirement Savings',
        description: 'Current projected assets may not meet your retirement spending needs. Consider increasing annual contributions.',
        priority: 'high',
        confidence: 0.88,
        rationale: 'Projected shortfall in retirement assets',
        suggestedAction: 'Increase annual contributions by 10-15%',
        estimatedImpact: 'Reduce retirement shortfall by $500K-$1M',
      });
    } else {
      recommendations.push({
        id: 'ret-2',
        type: 'retirement_planning',
        title: 'On Track for Retirement',
        description: 'Your current savings trajectory aligns well with retirement goals. Focus on tax efficiency.',
        priority: 'medium',
        confidence: 0.85,
        rationale: 'Projected assets exceed 70% of needs',
        suggestedAction: 'Implement tax-loss harvesting and Roth conversions',
        estimatedImpact: 'Save 1-2% annually in taxes',
      });
    }

    if (yearsToRetirement <= 5) {
      recommendations.push({
        id: 'ret-3',
        type: 'decumulation_strategy',
        title: 'Develop Withdrawal Strategy',
        description: 'Create a structured withdrawal plan to optimize tax efficiency and portfolio longevity in retirement.',
        priority: 'high',
        confidence: 0.9,
        rationale: 'Critical to establish withdrawal strategy near retirement',
        suggestedAction: 'Use 4% rule with bucketing strategy',
        estimatedImpact: 'Extend portfolio longevity by 5+ years',
      });
    }

    return recommendations;
  },

  async generateClientEngagementRecommendations(
    clientProfile: ClientProfile,
    lastContactDays: number,
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (lastContactDays > 180) {
      recommendations.push({
        id: 'eng-1',
        type: 'client_engagement',
        title: 'Schedule Client Review',
        description: `No contact for ${lastContactDays} days. Schedule a comprehensive review to reconnect and update plan.`,
        priority: 'high',
        confidence: 0.95,
        rationale: 'Extended period without contact increases churn risk',
        suggestedAction: 'Contact client within 7 days to schedule meeting',
        estimatedImpact: 'Improve retention probability by 15-25%',
      });
    } else if (lastContactDays > 90) {
      recommendations.push({
        id: 'eng-2',
        type: 'client_engagement',
        title: 'Quarterly Check-in',
        description: 'Schedule a brief quarterly review to discuss market changes and portfolio performance.',
        priority: 'medium',
        confidence: 0.88,
        rationale: 'Regular contact maintains client relationship and trust',
        suggestedAction: 'Send market update email with 15-min call offer',
        estimatedImpact: 'Strengthen client relationship',
      });
    }

    if (clientProfile.goals && clientProfile.goals.length === 0) {
      recommendations.push({
        id: 'eng-3',
        type: 'goal_planning',
        title: 'Establish Financial Goals',
        description: 'Client currently has no documented financial goals. Work together to identify and prioritize objectives.',
        priority: 'high',
        confidence: 0.92,
        rationale: 'Goals provide direction and measure of success',
        suggestedAction: 'Schedule goal-setting session',
        estimatedImpact: 'Improve plan alignment and client satisfaction',
      });
    }

    return recommendations;
  },

  async generateCrossSellingOpportunities(clientProfile: ClientProfile): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (clientProfile.netWorth && clientProfile.netWorth > 500000) {
      recommendations.push({
        id: 'upsell-1',
        type: 'service_offering',
        title: 'Wealth Management Services',
        description: 'Your net worth qualifies for comprehensive wealth management including advanced tax strategies.',
        priority: 'medium',
        confidence: 0.8,
        rationale: 'Client profile matches wealth management target',
        suggestedAction: 'Present wealth management service overview',
        estimatedImpact: 'Increase AUM and service fees',
      });
    }

    if (clientProfile.age && clientProfile.age > 55) {
      recommendations.push({
        id: 'upsell-2',
        type: 'service_offering',
        title: 'Retirement Plan Review',
        description: 'Comprehensive review of Social Security, RMDs, and pension optimization strategies.',
        priority: 'high',
        confidence: 0.85,
        rationale: 'Client approaching or in retirement phase',
        suggestedAction: 'Offer comprehensive retirement readiness analysis',
        estimatedImpact: 'Identify optimization opportunities worth $50K+',
      });
    }

    if (clientProfile.goals && clientProfile.goals.includes('Education')) {
      recommendations.push({
        id: 'upsell-3',
        type: 'service_offering',
        title: 'College Funding Strategy',
        description: 'Optimize college savings through 529 plans and tax-efficient strategies.',
        priority: 'medium',
        confidence: 0.82,
        rationale: 'Education goal indicates need for education funding services',
        suggestedAction: 'Present college funding options and benefits',
        estimatedImpact: 'Additional revenue stream and value-add service',
      });
    }

    return recommendations;
  },

  async prioritizeRecommendations(recommendations: Recommendation[]): Promise<Recommendation[]> {
    return recommendations.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityScore[b.priority] - priorityScore[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });
  },
};
