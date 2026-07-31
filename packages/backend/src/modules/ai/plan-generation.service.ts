import { ApiError } from '../../middleware/errorHandler';

export interface PlanGenerationRequest {
  clientId: string;
  clientAge: number;
  retirementAge: number;
  currentIncome: number;
  currentSavings: number;
  currentDebt?: number;
  lifeExpectancy: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  goals?: string[];
}

export interface FinancialPlanSummary {
  planId: string;
  clientId: string;
  title: string;
  executiveSummary: string;
  goals: Goal[];
  assetAllocation: AssetAllocation;
  projectedOutcomes: ProjectedOutcome;
  riskAssessment: RiskAssessment;
  actionItems: ActionItem[];
  estimatedSuccess: number;
}

export interface Goal {
  title: string;
  targetAmount: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  strategy: string;
}

export interface AssetAllocation {
  stocks: number;
  bonds: number;
  cash: number;
  alternatives: number;
}

export interface ProjectedOutcome {
  projectedRetirementAge: number;
  estimatedRetirementValue: number;
  monthlySustainableIncome: number;
  successProbability: number;
}

export interface RiskAssessment {
  currentRisk: string;
  recommendedRisk: string;
  volatilityExpectation: string;
  downriskScenario: string;
}

export interface ActionItem {
  priority: number;
  action: string;
  timeframe: string;
  expectedOutcome: string;
}

export const PlanGenerationService = {
  async generateComprehensivePlan(
    request: PlanGenerationRequest,
  ): Promise<FinancialPlanSummary> {
    if (request.clientAge >= request.retirementAge) {
      throw new ApiError(400, 'INVALID_REQUEST', 'Client age must be less than retirement age');
    }

    const yearsToRetirement = request.retirementAge - request.clientAge;
    const yearsInRetirement = request.lifeExpectancy - request.retirementAge;

    // Generate asset allocation based on risk tolerance and time horizon
    const assetAllocation = this.generateAssetAllocation(
      request.riskTolerance,
      yearsToRetirement,
    );

    // Project retirement outcomes
    const projectedOutcomes = this.projectRetirementOutcomes(
      request.currentSavings,
      request.currentIncome,
      yearsToRetirement,
      yearsInRetirement,
      assetAllocation,
    );

    // Generate goals based on income and current situation
    const goals = this.generateGoals(request);

    // Assess risk
    const riskAssessment = this.assessRisk(request.riskTolerance, yearsToRetirement);

    // Generate action items
    const actionItems = this.generateActionItems(request, assetAllocation);

    // Calculate estimated success
    const estimatedSuccess = this.calculateSuccessProbability(
      request,
      projectedOutcomes,
      yearsInRetirement,
    );

    return {
      planId: `plan_${Date.now()}`,
      clientId: request.clientId,
      title: `Comprehensive Financial Plan - Age ${request.clientAge} to ${request.lifeExpectancy}`,
      executiveSummary: this.generateExecutiveSummary(request, projectedOutcomes, estimatedSuccess),
      goals,
      assetAllocation,
      projectedOutcomes: {
        ...projectedOutcomes,
        successProbability: estimatedSuccess,
      },
      riskAssessment,
      actionItems,
      estimatedSuccess,
    };
  },

  private generateAssetAllocation(
    riskTolerance: string,
    yearsToRetirement: number,
  ): AssetAllocation {
    let baseAllocation: AssetAllocation;

    if (riskTolerance === 'aggressive') {
      baseAllocation = { stocks: 85, bonds: 10, cash: 3, alternatives: 2 };
    } else if (riskTolerance === 'moderate') {
      baseAllocation = { stocks: 60, bonds: 30, cash: 5, alternatives: 5 };
    } else {
      baseAllocation = { stocks: 40, bonds: 50, cash: 7, alternatives: 3 };
    }

    // Adjust for time horizon - de-risk as retirement approaches
    if (yearsToRetirement <= 5) {
      return {
        stocks: Math.max(baseAllocation.stocks - 20, 30),
        bonds: Math.min(baseAllocation.bonds + 20, 60),
        cash: baseAllocation.cash + 3,
        alternatives: Math.max(baseAllocation.alternatives - 3, 0),
      };
    } else if (yearsToRetirement <= 10) {
      return {
        stocks: Math.max(baseAllocation.stocks - 10, 35),
        bonds: Math.min(baseAllocation.bonds + 10, 55),
        cash: baseAllocation.cash + 2,
        alternatives: baseAllocation.alternatives,
      };
    }

    return baseAllocation;
  },

  private projectRetirementOutcomes(
    currentSavings: number,
    currentIncome: number,
    yearsToRetirement: number,
    yearsInRetirement: number,
    assetAllocation: AssetAllocation,
  ): Omit<ProjectedOutcome, 'successProbability'> {
    const expectedReturn = (assetAllocation.stocks * 0.08 +
      assetAllocation.bonds * 0.04 +
      assetAllocation.cash * 0.02 +
      assetAllocation.alternatives * 0.06) / 100;

    const annualContribution = currentIncome * 0.15;

    let projectedValue = currentSavings;
    for (let i = 0; i < yearsToRetirement; i++) {
      projectedValue = (projectedValue + annualContribution) * (1 + expectedReturn);
    }

    const monthlySustainableIncome = (projectedValue * expectedReturn) / 12;

    return {
      projectedRetirementAge: 65,
      estimatedRetirementValue: Math.round(projectedValue),
      monthlySustainableIncome: Math.round(monthlySustainableIncome),
    };
  },

  private generateGoals(request: PlanGenerationRequest): Goal[] {
    const goals: Goal[] = [];

    const yearsToRetirement = request.retirementAge - request.clientAge;
    const projectedValue = request.currentSavings * Math.pow(1.06, yearsToRetirement);

    goals.push({
      title: 'Retirement Security',
      targetAmount: projectedValue,
      targetDate: `${request.retirementAge}`,
      priority: 'high',
      strategy: 'Accumulate retirement assets through systematic investing and contributions',
    });

    if (request.currentDebt && request.currentDebt > 0) {
      goals.push({
        title: 'Debt Elimination',
        targetAmount: 0,
        targetDate: `${Math.min(request.clientAge + 10, request.retirementAge - 5)}`,
        priority: 'high',
        strategy: 'Prioritize paying off high-interest debt while maintaining savings',
      });
    }

    if (request.goals?.includes('Education')) {
      goals.push({
        title: 'Education Funding',
        targetAmount: 200000,
        targetDate: `${request.clientAge + 10}`,
        priority: 'medium',
        strategy: 'Use 529 plans and education savings vehicles for tax efficiency',
      });
    }

    if (request.goals?.includes('Home Purchase')) {
      goals.push({
        title: 'Home Purchase',
        targetAmount: 100000,
        targetDate: `${request.clientAge + 5}`,
        priority: 'medium',
        strategy: 'Build down payment fund with stable, liquid investments',
      });
    }

    return goals;
  },

  private assessRisk(
    riskTolerance: string,
    yearsToRetirement: number,
  ): RiskAssessment {
    let currentRisk = 'Moderate';
    let recommendedRisk = 'Moderate';
    let volatilityExpectation = 'Medium';

    if (riskTolerance === 'aggressive') {
      currentRisk = 'Aggressive';
      if (yearsToRetirement > 20) {
        recommendedRisk = 'Aggressive';
        volatilityExpectation = 'High (±15-25% annually)';
      } else {
        recommendedRisk = 'Moderate-Aggressive';
        volatilityExpectation = 'Medium-High (±10-20% annually)';
      }
    } else if (riskTolerance === 'conservative') {
      currentRisk = 'Conservative';
      recommendedRisk = 'Conservative-Moderate';
      volatilityExpectation = 'Low-Medium (±5-10% annually)';
    }

    const downriskScenario = riskTolerance === 'aggressive'
      ? 'Portfolio could decline 30-40% in severe market downturns'
      : 'Portfolio decline limited to 15-20% in severe scenarios';

    return {
      currentRisk,
      recommendedRisk,
      volatilityExpectation,
      downriskScenario,
    };
  },

  private generateActionItems(
    request: PlanGenerationRequest,
    assetAllocation: AssetAllocation,
  ): ActionItem[] {
    const items: ActionItem[] = [];

    items.push({
      priority: 1,
      action: `Establish asset allocation: ${assetAllocation.stocks}% stocks, ${assetAllocation.bonds}% bonds`,
      timeframe: 'Within 30 days',
      expectedOutcome: 'Portfolio aligned with retirement plan',
    });

    items.push({
      priority: 2,
      action: `Increase retirement contributions to ${Math.round(request.currentIncome * 0.15)} annually`,
      timeframe: 'Next payroll cycle',
      expectedOutcome: 'Accelerate retirement savings accumulation',
    });

    if (request.currentDebt && request.currentDebt > 0) {
      items.push({
        priority: 3,
        action: 'Create debt payoff schedule',
        timeframe: 'Within 60 days',
        expectedOutcome: 'Clear path to debt elimination',
      });
    }

    items.push({
      priority: 4,
      action: 'Set up automatic rebalancing quarterly',
      timeframe: 'Within 90 days',
      expectedOutcome: 'Maintain target allocation and risk profile',
    });

    items.push({
      priority: 5,
      action: 'Review and update plan annually or after major life changes',
      timeframe: 'Ongoing',
      expectedOutcome: 'Plan remains current and relevant',
    });

    return items;
  },

  private calculateSuccessProbability(
    request: PlanGenerationRequest,
    projectedOutcomes: Omit<ProjectedOutcome, 'successProbability'>,
    yearsInRetirement: number,
  ): number {
    const retirementNeeds = request.currentIncome * 0.8 * yearsInRetirement;
    const projectedValue = projectedOutcomes.estimatedRetirementValue;

    if (projectedValue >= retirementNeeds) {
      return Math.min(95, 85 + (projectedValue - retirementNeeds) / retirementNeeds * 10);
    } else if (projectedValue >= retirementNeeds * 0.8) {
      return 75;
    } else if (projectedValue >= retirementNeeds * 0.6) {
      return 60;
    }
    return 45;
  },

  private generateExecutiveSummary(
    request: PlanGenerationRequest,
    projectedOutcomes: Omit<ProjectedOutcome, 'successProbability'>,
    successProbability: number,
  ): string {
    const yearsToRetirement = request.retirementAge - request.clientAge;
    const monthlyNeeded = Math.round(request.currentIncome * 0.8 / 12);

    return `This comprehensive financial plan projects that by age ${request.retirementAge}, ` +
      `after ${yearsToRetirement} years of disciplined savings and investing, your portfolio could grow to approximately ` +
      `${projectedOutcomes.estimatedRetirementValue.toLocaleString()} dollars. This would provide approximately ` +
      `${Math.round(projectedOutcomes.monthlySustainableIncome).toLocaleString()} in sustainable monthly income, ` +
      `compared to your estimated need of ${monthlyNeeded.toLocaleString()}. ` +
      `The probability of success for this plan is estimated at ${successProbability.toFixed(0)}%. ` +
      `Regular reviews and adjustments will help keep the plan on track as circumstances change.`;
  },
};
