import { ApiError } from '../../middleware/errorHandler';

export interface DocumentSummary {
  documentId: string;
  originalLength: number;
  summaryLength: number;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  confidenceScore: number;
}

export interface ConversationSummary {
  conversationId: string;
  duration: number;
  summary: string;
  keyDecisions: string[];
  nextSteps: string[];
  followUpDate?: string;
}

export interface MarketAnalysisSummary {
  date: string;
  summary: string;
  topMovers: string[];
  riskFactors: string[];
  opportunities: string[];
  recommendation: string;
}

export const SummarizationService = {
  async summarizeDocument(
    documentContent: string,
    documentType: string,
  ): Promise<DocumentSummary> {
    if (!documentContent || documentContent.length === 0) {
      throw new ApiError(400, 'INVALID_INPUT', 'Document content is required');
    }

    const originalLength = documentContent.length;

    // Simulate summarization logic
    const summary = this.generateSummary(documentContent);
    const keyPoints = this.extractKeyPoints(documentContent, documentType);
    const actionItems = this.extractActionItems(documentContent);
    const sentiment = this.analyzeSentiment(documentContent);

    return {
      documentId: `doc_${Date.now()}`,
      originalLength,
      summaryLength: summary.length,
      summary,
      keyPoints,
      actionItems,
      sentiment,
      confidenceScore: 0.82,
    };
  },

  async summarizeConversation(
    conversationTranscript: string,
    conversationDate: string,
  ): Promise<ConversationSummary> {
    if (!conversationTranscript || conversationTranscript.length === 0) {
      throw new ApiError(400, 'INVALID_INPUT', 'Conversation transcript is required');
    }

    const summary = this.generateConversationSummary(conversationTranscript);
    const keyDecisions = this.extractKeyDecisions(conversationTranscript);
    const nextSteps = this.extractNextSteps(conversationTranscript);

    return {
      conversationId: `conv_${Date.now()}`,
      duration: Math.round(conversationTranscript.length / 50), // Estimate based on content length
      summary,
      keyDecisions,
      nextSteps,
      followUpDate: this.calculateFollowUpDate(nextSteps),
    };
  },

  async generateMarketAnalysisSummary(
    marketData: string,
    analysisDate: string,
  ): Promise<MarketAnalysisSummary> {
    const summary = this.generateMarketSummary(marketData);
    const topMovers = this.extractTopMovers(marketData);
    const riskFactors = this.extractRiskFactors(marketData);
    const opportunities = this.extractOpportunities(marketData);
    const recommendation = this.generateRecommendation(riskFactors, opportunities);

    return {
      date: analysisDate,
      summary,
      topMovers,
      riskFactors,
      opportunities,
      recommendation,
    };
  },

  private generateSummary(content: string): string {
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const summaryLength = Math.max(1, Math.ceil(sentences.length * 0.3));
    const importantSentences = sentences
      .map((s, i) => ({ text: s.trim(), index: i, score: this.scoreSentence(s) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, summaryLength)
      .sort((a, b) => a.index - b.index)
      .map((s) => s.text);

    return importantSentences.join('. ') + '.';
  },

  private generateConversationSummary(transcript: string): string {
    const lines = transcript.split('\n').filter((l) => l.trim().length > 0);
    const importantLines = lines.slice(0, Math.ceil(lines.length * 0.4));
    return importantLines.join(' ');
  },

  private generateMarketSummary(marketData: string): string {
    const lines = marketData.split('\n').filter((l) => l.trim().length > 0);
    const summary = lines.slice(0, 3).join('. ') + '.';
    return summary;
  },

  private extractKeyPoints(content: string, documentType: string): string[] {
    const points: string[] = [];

    if (documentType === 'financial_report') {
      points.push('Portfolio performance reviewed');
      points.push('Asset allocation analyzed');
      points.push('Risk metrics assessed');
    } else if (documentType === 'plan_document') {
      points.push('Financial goals documented');
      points.push('Action items identified');
      points.push('Timeline established');
    } else if (documentType === 'market_analysis') {
      points.push('Market trends identified');
      points.push('Sector performance reviewed');
      points.push('Economic indicators analyzed');
    }

    return points;
  },

  private extractActionItems(content: string): string[] {
    const items: string[] = [];
    const actionKeywords = ['should', 'must', 'need to', 'recommend', 'schedule', 'increase', 'decrease'];

    const sentences = content.split(/[.!?]+/);
    sentences.forEach((sentence) => {
      const lower = sentence.toLowerCase();
      if (actionKeywords.some((keyword) => lower.includes(keyword))) {
        const cleaned = sentence.trim();
        if (cleaned.length > 10 && cleaned.length < 200) {
          items.push(cleaned);
        }
      }
    });

    return items.slice(0, 5);
  },

  private extractKeyDecisions(transcript: string): string[] {
    const decisions: string[] = [];
    const decisionKeywords = ['decided', 'agreed', 'approved', 'confirmed', 'committed'];

    const lines = transcript.split('\n');
    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (decisionKeywords.some((keyword) => lower.includes(keyword))) {
        const cleaned = line.trim();
        if (cleaned.length > 10) {
          decisions.push(cleaned);
        }
      }
    });

    return decisions.slice(0, 5);
  },

  private extractNextSteps(transcript: string): string[] {
    const steps: string[] = [];
    const stepKeywords = ['next', 'follow up', 'send', 'schedule', 'review', 'update'];

    const lines = transcript.split('\n');
    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (stepKeywords.some((keyword) => lower.includes(keyword))) {
        const cleaned = line.trim();
        if (cleaned.length > 10 && cleaned.length < 150) {
          steps.push(cleaned);
        }
      }
    });

    return steps.slice(0, 5);
  },

  private extractTopMovers(marketData: string): string[] {
    const movers = ['Technology sector', 'Healthcare stocks', 'Energy sector', 'Financial services'];
    return movers.slice(0, 3);
  },

  private extractRiskFactors(marketData: string): string[] {
    const factors = [
      'Market volatility elevated',
      'Interest rate uncertainty',
      'Geopolitical tensions',
      'Inflation concerns',
    ];
    return factors.slice(0, 3);
  },

  private extractOpportunities(marketData: string): string[] {
    const opportunities = [
      'Oversold sectors present value',
      'Dividend stocks attractive',
      'Emerging markets recovery potential',
      'Bond opportunities improving',
    ];
    return opportunities.slice(0, 3);
  },

  private calculateFollowUpDate(nextSteps: string[]): string | undefined {
    if (nextSteps.length === 0) return undefined;

    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 7);
    return followUpDate.toISOString().split('T')[0];
  },

  private scoreSentence(sentence: string): number {
    let score = 0;

    const importantWords = ['important', 'critical', 'significant', 'major', 'key', 'recommend', 'should'];
    importantWords.forEach((word) => {
      if (sentence.toLowerCase().includes(word)) {
        score += 2;
      }
    });

    score += sentence.split(/\s+/).length > 10 ? 1 : 0;

    return score;
  },

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    const lower = content.toLowerCase();
    const positiveWords = ['good', 'excellent', 'strong', 'positive', 'improvement', 'growth', 'success'];
    const negativeWords = ['bad', 'poor', 'weak', 'negative', 'decline', 'loss', 'risk', 'concern'];

    const positiveCount = positiveWords.filter((word) => lower.includes(word)).length;
    const negativeCount = negativeWords.filter((word) => lower.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  },

  private generateRecommendation(riskFactors: string[], opportunities: string[]): string {
    if (opportunities.length > riskFactors.length) {
      return 'Market conditions favor modest opportunistic positions with appropriate risk management.';
    } else if (riskFactors.length > opportunities.length) {
      return 'Consider defensive positioning and wait for better entry opportunities.';
    }
    return 'Maintain balanced approach with selective adjustments to tactical opportunities.';
  },
};
