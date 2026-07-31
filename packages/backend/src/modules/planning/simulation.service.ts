import { ApiError } from '../../middleware/errorHandler';

export interface MonteCarloParameters {
  initialValue: number;
  annualContribution: number;
  yearsToSimulate: number;
  expectedReturn: number; // Annual return as decimal (e.g., 0.07 for 7%)
  standardDeviation: number; // Volatility as decimal (e.g., 0.15 for 15%)
  inflationRate?: number;
  numberOfSimulations?: number; // Default 1000
}

export interface SimulationResult {
  percentile10: number; // 10th percentile outcome
  percentile25: number; // 25th percentile outcome
  percentile50: number; // Median outcome
  percentile75: number; // 75th percentile outcome
  percentile90: number; // 90th percentile outcome
  mean: number; // Average outcome
  standardDeviation: number;
  successRate: number; // Percentage reaching goal
  paths: number[][]; // Sample paths from simulation
}

export interface InflationAdjustedReturn {
  nominalReturn: number;
  realReturn: number;
  purchasingPower: number;
}

export const SimulationService = {
  /**
   * Monte Carlo simulation for portfolio projections
   * Simulates multiple paths of portfolio growth with random market variations
   */
  monteCarloSimulation(params: MonteCarloParameters): SimulationResult {
    const {
      initialValue,
      annualContribution,
      yearsToSimulate,
      expectedReturn,
      standardDeviation,
      inflationRate = 0.03,
      numberOfSimulations = 1000,
    } = params;

    const simulations: number[][] = [];
    const endingValues: number[] = [];

    for (let sim = 0; sim < numberOfSimulations; sim++) {
      const path: number[] = [initialValue];
      let currentValue = initialValue;

      for (let year = 1; year <= yearsToSimulate; year++) {
        // Generate random return using normal distribution
        const randomReturn = this.generateNormalRandom(expectedReturn, standardDeviation);

        // Apply return and contribution
        currentValue = (currentValue + annualContribution) * (1 + randomReturn);
        path.push(currentValue);
      }

      simulations.push(path);
      endingValues.push(currentValue);
    }

    // Calculate percentiles
    endingValues.sort((a, b) => a - b);
    const percentile10 = endingValues[Math.floor(numberOfSimulations * 0.1)];
    const percentile25 = endingValues[Math.floor(numberOfSimulations * 0.25)];
    const percentile50 = endingValues[Math.floor(numberOfSimulations * 0.5)];
    const percentile75 = endingValues[Math.floor(numberOfSimulations * 0.75)];
    const percentile90 = endingValues[Math.floor(numberOfSimulations * 0.9)];

    // Calculate statistics
    const mean = endingValues.reduce((a, b) => a + b, 0) / numberOfSimulations;
    const variance = endingValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numberOfSimulations;
    const stdDev = Math.sqrt(variance);

    // Sample 10 paths for visualization
    const samplePaths = simulations.slice(0, 10);

    return {
      percentile10,
      percentile25,
      percentile50,
      percentile75,
      percentile90,
      mean,
      standardDeviation: stdDev,
      successRate: 0, // Would be calculated against specific goal
      paths: samplePaths,
    };
  },

  /**
   * Retirement projection calculation
   */
  retirementProjection(params: {
    currentAge: number;
    retirementAge: number;
    currentSavings: number;
    annualSavings: number;
    expectedReturn: number;
    inflationRate: number;
    retirementSpending: number; // Annual spending needed in today's dollars
    lifeExpectancy: number;
  }): {
    projectedRetirementValue: number;
    requiredRetirementValue: number;
    monthlySustainableSpendings: number;
    shortfallOrSurplus: number;
    years: Array<{ age: number; value: number; spending: number }>;
  } {
    const {
      currentAge,
      retirementAge,
      currentSavings,
      annualSavings,
      expectedReturn,
      inflationRate,
      retirementSpending,
      lifeExpectancy,
    } = params;

    const yearsToRetirement = retirementAge - currentAge;
    const yearsInRetirement = lifeExpectancy - retirementAge;

    let projectedValue = currentSavings;
    const years: Array<{ age: number; value: number; spending: number }> = [];

    // Accumulation phase
    for (let year = 0; year <= yearsToRetirement; year++) {
      const age = currentAge + year;
      years.push({ age, value: projectedValue, spending: 0 });

      if (year < yearsToRetirement) {
        projectedValue = (projectedValue + annualSavings) * (1 + expectedReturn);
      }
    }

    const projectedRetirementValue = projectedValue;

    // Decumulation phase
    let retirementValue = projectedRetirementValue;
    let adjustedSpending = retirementSpending;

    for (let year = 1; year <= yearsInRetirement; year++) {
      const age = retirementAge + year;
      adjustedSpending *= 1 + inflationRate;
      retirementValue = retirementValue * (1 + expectedReturn) - adjustedSpending;

      if (retirementValue >= 0) {
        years.push({ age, value: retirementValue, spending: adjustedSpending });
      } else {
        break;
      }
    }

    // Calculate required value using present value of annuity
    const requiredRetirementValue = this.presentValueOfAnnuity(
      retirementSpending,
      expectedReturn,
      inflationRate,
      yearsInRetirement,
    );

    const monthlySustainableSpendings = (projectedRetirementValue * expectedReturn) / 12;
    const shortfallOrSurplus = projectedRetirementValue - requiredRetirementValue;

    return {
      projectedRetirementValue,
      requiredRetirementValue,
      monthlySustainableSpendings,
      shortfallOrSurplus,
      years,
    };
  },

  /**
   * Calculate college savings needed
   */
  collegeSavingsProjection(params: {
    currentAge: number;
    collegeStartAge: number;
    currentSavings: number;
    annualSavings: number;
    expectedReturn: number;
    inflationRate: number;
    annualCollegeCost: number; // In today's dollars
    yearsOfCollege: number;
  }): {
    requiredAtCollegeStart: number;
    projectedSavings: number;
    shortfallOrSurplus: number;
    projectedCollegeCost: number;
  } {
    const {
      currentAge,
      collegeStartAge,
      currentSavings,
      annualSavings,
      expectedReturn,
      inflationRate,
      annualCollegeCost,
      yearsOfCollege,
    } = params;

    const yearsUntilCollege = collegeStartAge - currentAge;

    // Calculate projected college cost (adjusted for inflation)
    let projectedCollegeCost = 0;
    for (let year = 0; year < yearsOfCollege; year++) {
      projectedCollegeCost += annualCollegeCost * Math.pow(1 + inflationRate, yearsUntilCollege + year);
    }

    // Calculate required amount at college start (present value)
    const requiredAtCollegeStart = this.presentValueOfAnnuity(
      annualCollegeCost,
      expectedReturn,
      inflationRate,
      yearsOfCollege,
    );

    // Calculate projected savings
    let projectedSavings = currentSavings;
    for (let year = 0; year < yearsUntilCollege; year++) {
      projectedSavings = (projectedSavings + annualSavings) * (1 + expectedReturn);
    }

    const shortfallOrSurplus = projectedSavings - requiredAtCollegeStart;

    return {
      requiredAtCollegeStart,
      projectedSavings,
      shortfallOrSurplus,
      projectedCollegeCost,
    };
  },

  /**
   * Calculate inflation impact on purchasing power
   */
  inflationAnalysis(params: {
    currentAmount: number;
    years: number;
    inflationRate: number;
  }): InflationAdjustedReturn {
    const { currentAmount, years, inflationRate } = params;
    const purchasingPower = currentAmount / Math.pow(1 + inflationRate, years);
    const realReturn = (currentAmount - purchasingPower) / currentAmount;

    return {
      nominalReturn: currentAmount,
      realReturn,
      purchasingPower,
    };
  },

  /**
   * Calculate required rate of return to reach goal
   */
  requiredReturnToGoal(params: {
    currentValue: number;
    targetValue: number;
    years: number;
    annualContribution?: number;
  }): number {
    const { currentValue, targetValue, years, annualContribution = 0 } = params;

    if (years <= 0) return 0;

    // Simple approximation using binary search
    let low = -0.5; // -50% return
    let high = 1.0; // 100% return
    let rate = 0.07; // Default assumption

    for (let i = 0; i < 100; i++) {
      const mid = (low + high) / 2;
      const futureValue = this.futureValue(currentValue, annualContribution, mid, years);

      if (futureValue < targetValue) {
        low = mid;
      } else {
        high = mid;
      }

      rate = mid;
    }

    return rate;
  },

  /**
   * Helper: Generate random number from normal distribution
   */
  private generateNormalRandom(mean: number, stdDev: number): number {
    let u1 = Math.random();
    let u2 = Math.random();
    return mean + stdDev * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  },

  /**
   * Helper: Calculate future value of annuity
   */
  private futureValue(
    principal: number,
    annualPayment: number,
    rate: number,
    years: number,
  ): number {
    if (rate === 0) {
      return principal + annualPayment * years;
    }

    const fvPrincipal = principal * Math.pow(1 + rate, years);
    const fvAnnuity = annualPayment * ((Math.pow(1 + rate, years) - 1) / rate);
    return fvPrincipal + fvAnnuity;
  },

  /**
   * Helper: Calculate present value of annuity
   */
  private presentValueOfAnnuity(
    payment: number,
    discountRate: number,
    inflationRate: number,
    years: number,
  ): number {
    if (discountRate === 0) return payment * years;

    const realRate = (discountRate - inflationRate) / (1 + inflationRate);
    if (Math.abs(realRate) < 0.0001) {
      return (payment / (1 + inflationRate)) * years;
    }

    const pv = (payment / (1 + inflationRate)) * ((1 - Math.pow(1 + realRate, -years)) / realRate);
    return Math.max(0, pv);
  },
};
