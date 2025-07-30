import type {
  DetectedActionItem,
  DetectionPattern,
  ActionItemType,
  Priority,
  TextPosition,
  ActionItemMetadata
} from '../types/realTimeAnalysis';

export class TextAnalysisEngine {
  private patterns: DetectionPattern[] = [
    // Imperative patterns - high confidence
    {
      pattern: /\b(?:need to|needs to|should|must|have to)\s+(.+?)(?:\.|$|,|\n)/gi,
      type: 'task',
      priority: 'medium',
      confidenceBase: 0.75,
      contextRequired: false,
      description: 'Imperative language indicating required actions'
    },
    {
      pattern: /\b(?:implement|fix|create|add|remove|update|refactor|test)\s+(.+?)(?:\.|$|,|\n)/gi,
      type: 'development',
      priority: 'medium',
      confidenceBase: 0.8,
      contextRequired: false,
      description: 'Development-specific action verbs'
    },

    // Deadline patterns - very high confidence
    {
      pattern: /\b(?:by|due|deadline|before)\s+(?:on\s+)?(.+?)(?:\.|$|,|\n)/gi,
      type: 'deadline',
      priority: 'high',
      confidenceBase: 0.85,
      contextRequired: true,
      description: 'Explicit deadline references'
    },
    {
      pattern: /\b(?:today|tomorrow|this week|next week|friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/gi,
      type: 'deadline',
      priority: 'high',
      confidenceBase: 0.7,
      contextRequired: true,
      description: 'Time-specific references'
    },

    // Assignment patterns - high confidence
    {
      pattern: /\b(?:assign|assigned to|@\w+|responsible for)\s+(.+?)(?:\.|$|,|\n)/gi,
      type: 'assignment',
      priority: 'medium',
      confidenceBase: 0.8,
      contextRequired: false,
      description: 'Assignment and responsibility indicators'
    },
    {
      pattern: /@(\w+)/g,
      type: 'assignment',
      priority: 'medium',
      confidenceBase: 0.75,
      contextRequired: true,
      description: 'Username mentions'
    },

    // Commitment patterns - medium-high confidence
    {
      pattern: /\b(?:I will|we will|I'll|we'll|promise to|commit to|guarantee)\s+(.+?)(?:\.|$|,|\n)/gi,
      type: 'commitment',
      priority: 'medium',
      confidenceBase: 0.7,
      contextRequired: false,
      description: 'Personal or team commitments'
    },

    // Task keyword patterns - very high confidence
    {
      pattern: /\b(?:TODO|FIXME|HACK|NOTE|BUG):\s*(.+?)(?:\.|$|,|\n)/gi,
      type: 'todo',
      priority: 'medium',
      confidenceBase: 0.9,
      contextRequired: false,
      description: 'Explicit task keywords'
    },
    {
      pattern: /\b(?:ACTION|TASK|REMINDER):\s*(.+?)(?:\.|$|,|\n)/gi,
      type: 'action',
      priority: 'medium',
      confidenceBase: 0.85,
      contextRequired: false,
      description: 'Action item keywords'
    },

    // List item patterns - medium confidence
    {
      pattern: /^\s*[-*]\s*(?:\[[\s\-x]\])?\s*(.+?)$/gm,
      type: 'task',
      priority: 'medium',
      confidenceBase: 0.6,
      contextRequired: true,
      description: 'Bullet point lists with optional checkboxes'
    },
    {
      pattern: /^\s*\d+\.\s*(.+?)$/gm,
      type: 'task',
      priority: 'medium',
      confidenceBase: 0.65,
      contextRequired: true,
      description: 'Numbered lists'
    },

    // Follow-up patterns - medium confidence
    {
      pattern: /\b(?:follow up|followup|check back|circle back)\s+(?:on\s+)?(.+?)(?:\.|$|,|\n)/gi,
      type: 'follow_up',
      priority: 'medium',
      confidenceBase: 0.7,
      contextRequired: false,
      description: 'Follow-up action indicators'
    },

    // Reminder patterns - medium confidence
    {
      pattern: /\b(?:remember to|don't forget to|remind me to)\s+(.+?)(?:\.|$|,|\n)/gi,
      type: 'reminder',
      priority: 'medium',
      confidenceBase: 0.75,
      contextRequired: false,
      description: 'Reminder phrases'
    }
  ];

  private urgencyKeywords = [
    'urgent', 'asap', 'immediately', 'critical', 'emergency', 'priority',
    'important', 'crucial', 'vital', 'essential', 'pressing'
  ];

  private lowPriorityKeywords = [
    'later', 'sometime', 'eventually', 'nice to have', 'optional',
    'when possible', 'if time permits', 'low priority'
  ];

  private datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, // MM/DD/YYYY or DD/MM/YYYY
    /\b\d{4}-\d{1,2}-\d{1,2}\b/g,     // YYYY-MM-DD
    /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{1,2}(?:,\s*\d{4})?\b/gi,
    /\b\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*(?:\s+\d{4})?\b/gi
  ];

  /**
   * Detect action item patterns in text using regex analysis
   */
  detectPatterns(text: string): DetectedActionItem[] {
    const detectedItems: DetectedActionItem[] = [];
    const processedPositions = new Set<string>();

    for (const pattern of this.patterns) {
      const matches = [...text.matchAll(pattern.pattern)];

      for (const match of matches) {
        if (!match[0] || !match.index) continue;

        const content = this.extractContent(match, pattern);
        if (!content || content.length < 3) continue;

        const position: TextPosition = {
          start: match.index,
          end: match.index + match[0].length
        };

        // Avoid duplicate detections at the same position
        const positionKey = `${position.start}-${position.end}`;
        if (processedPositions.has(positionKey)) continue;
        processedPositions.add(positionKey);

        const context = this.extractContext(text, position, 100);
        const confidence = this.calculateConfidenceScore(content, context, pattern, text);

        // Skip items below minimum confidence threshold
        if (confidence < 0.3) continue;

        const priority = this.determinePriority(content, context, pattern.priority);
        const metadata = this.extractMetadata(content, context);

        const detectedItem: DetectedActionItem = {
          id: this.generateId(),
          content: content.trim(),
          type: pattern.type,
          priority,
          confidence,
          suggestedTitle: this.generateTitle(content, pattern.type),
          suggestedDescription: this.generateDescription(content, context),
          suggestedDueDate: this.extractDueDate(content, context),
          suggestedAssignee: this.extractAssignee(content, context),
          textPosition: position,
          context,
          detectionMethod: 'regex',
          createdAt: new Date(),
          metadata
        };

        detectedItems.push(detectedItem);
      }
    }

    return this.deduplicateItems(detectedItems);
  }

  /**
   * Calculate confidence score based on multiple factors
   */
  calculateConfidenceScore(
    content: string,
    context: string,
    pattern: DetectionPattern,
    fullText: string
  ): number {
    let confidence = pattern.confidenceBase;

    // Adjust based on content clarity
    confidence += this.assessContentClarity(content);

    // Adjust based on context relevance
    if (pattern.contextRequired) {
      confidence += this.assessContextRelevance(context, pattern.type);
    }

    // Adjust based on urgency indicators
    confidence += this.assessUrgencyIndicators(content + ' ' + context);

    // Adjust based on structural cues
    confidence += this.assessStructuralCues(content, context);

    // Apply penalties for ambiguous language
    confidence -= this.assessAmbiguityPenalties(content, context);

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Extract relevant metadata from content and context
   */
  extractMetadata(content: string, context: string): ActionItemMetadata {
    const keywords = this.extractKeywords(content);
    const urgencyIndicators = this.extractUrgencyIndicators(content + ' ' + context);
    const assignmentIndicators = this.extractAssignmentIndicators(content + ' ' + context);

    return {
      keywords,
      urgencyIndicators,
      assignmentIndicators
    };
  }

  /**
   * Extract due date from content or context
   */
  extractDueDate(content: string, context: string): string | undefined {
    const text = content + ' ' + context;

    for (const pattern of this.datePatterns) {
      const matches = text.match(pattern);
      if (matches && matches[0]) {
        return this.normalizeDate(matches[0]);
      }
    }

    // Check for relative dates
    const relativePatterns = [
      { pattern: /\btoday\b/i, offset: 0 },
      { pattern: /\btomorrow\b/i, offset: 1 },
      { pattern: /\bthis week\b/i, offset: 7 },
      { pattern: /\bnext week\b/i, offset: 14 }
    ];

    for (const { pattern, offset } of relativePatterns) {
      if (pattern.test(text)) {
        const date = new Date();
        date.setDate(date.getDate() + offset);
        return date.toISOString().split('T')[0];
      }
    }

    return undefined;
  }

  /**
   * Extract assignee from content or context
   */
  extractAssignee(content: string, context: string): string | undefined {
    const text = content + ' ' + context;

    // Look for @mentions
    const mentionMatch = text.match(/@(\w+)/);
    if (mentionMatch) {
      return mentionMatch[1];
    }

    // Look for assignment phrases
    const assignmentMatch = text.match(/(?:assign(?:ed)?\s+to|responsible\s+for)\s+([A-Za-z\s]+)/i);
    if (assignmentMatch) {
      return assignmentMatch[1].trim();
    }

    return undefined;
  }

  /**
   * Determine priority based on content analysis
   */
  private determinePriority(content: string, context: string, basePriority: Priority): Priority {
    const text = (content + ' ' + context).toLowerCase();

    // Check for urgent keywords
    if (this.urgencyKeywords.some(keyword => text.includes(keyword))) {
      return 'urgent';
    }

    // Check for low priority keywords
    if (this.lowPriorityKeywords.some(keyword => text.includes(keyword))) {
      return 'low';
    }

    // Check for deadline proximity
    if (this.hasNearDeadline(text)) {
      return this.upgradePriority(basePriority);
    }

    return basePriority;
  }

  /**
   * Generate a concise title from content
   */
  private generateTitle(content: string, type: ActionItemType): string {
    // Remove common prefixes and clean up
    let title = content
      .replace(/^(need to|should|must|have to|implement|fix|create|add|remove|update)\s+/i, '')
      .replace(/^(TODO|FIXME|ACTION|TASK|REMINDER):\s*/i, '')
      .trim();

    // Capitalize first letter
    title = title.charAt(0).toUpperCase() + title.slice(1);

    // Truncate if too long
    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
    }

    return title;
  }

  /**
   * Generate description from content and context
   */
  private generateDescription(content: string, context: string): string | undefined {
    if (context.length > content.length + 20) {
      // Extract relevant context around the detected item
      const contextWords = context.split(/\s+/);
      const contentWords = content.split(/\s+/);

      // Find the position of content in context
      const contentStart = context.indexOf(content);
      if (contentStart > 0) {
        const before = context.substring(Math.max(0, contentStart - 50), contentStart).trim();
        const after = context.substring(contentStart + content.length, contentStart + content.length + 50).trim();

        if (before || after) {
          return `${before} ${content} ${after}`.trim();
        }
      }
    }

    return undefined;
  }

  /**
   * Extract content from regex match based on pattern type
   */
  private extractContent(match: RegExpMatchArray, pattern: DetectionPattern): string {
    // For patterns with capture groups, use the captured content
    if (match[1]) {
      return match[1].trim();
    }

    // For patterns without capture groups, use the full match
    return match[0].trim();
  }

  /**
   * Extract context around a text position
   */
  private extractContext(text: string, position: TextPosition, radius: number): string {
    const start = Math.max(0, position.start - radius);
    const end = Math.min(text.length, position.end + radius);
    return text.substring(start, end);
  }

  /**
   * Assess content clarity for confidence scoring
   */
  private assessContentClarity(content: string): number {
    let score = 0;

    // Longer, more specific content gets higher score
    if (content.length > 20) score += 0.1;
    if (content.length > 50) score += 0.1;

    // Presence of specific verbs
    const actionVerbs = ['implement', 'create', 'fix', 'update', 'review', 'test', 'deploy'];
    if (actionVerbs.some(verb => content.toLowerCase().includes(verb))) {
      score += 0.15;
    }

    return score;
  }

  /**
   * Assess context relevance for confidence scoring
   */
  private assessContextRelevance(context: string, type: ActionItemType): number {
    let score = 0;

    const typeKeywords = {
      development: ['code', 'bug', 'feature', 'api', 'database', 'frontend', 'backend'],
      meeting: ['discuss', 'agenda', 'meeting', 'call', 'presentation'],
      deadline: ['due', 'deadline', 'schedule', 'timeline', 'urgent']
    };

    const keywords = typeKeywords[type as keyof typeof typeKeywords] || [];
    const contextLower = context.toLowerCase();

    const matchingKeywords = keywords.filter(keyword => contextLower.includes(keyword));
    score += matchingKeywords.length * 0.05;

    return Math.min(0.2, score);
  }

  /**
   * Assess urgency indicators
   */
  private assessUrgencyIndicators(text: string): number {
    const textLower = text.toLowerCase();
    const urgentCount = this.urgencyKeywords.filter(keyword => textLower.includes(keyword)).length;
    return Math.min(0.2, urgentCount * 0.1);
  }

  /**
   * Assess structural cues
   */
  private assessStructuralCues(content: string, context: string): number {
    let score = 0;

    // Bullet points or numbered lists
    if (/^\s*[-*]\s/.test(context) || /^\s*\d+\.\s/.test(context)) {
      score += 0.1;
    }

    // All caps (might indicate importance)
    if (content === content.toUpperCase() && content.length > 3) {
      score += 0.05;
    }

    return score;
  }

  /**
   * Assess ambiguity penalties
   */
  private assessAmbiguityPenalties(content: string, context: string): number {
    let penalty = 0;

    const text = content + ' ' + context;
    const textLower = text.toLowerCase();

    // Question format reduces confidence
    if (text.includes('?')) penalty += 0.1;

    // Conditional statements reduce confidence
    if (/\b(if|maybe|perhaps|might|could)\b/.test(textLower)) {
      penalty += 0.15;
    }

    // Negation reduces confidence
    if (/\b(not|don't|won't|can't|shouldn't)\b/.test(textLower)) {
      penalty += 0.1;
    }

    return penalty;
  }

  /**
   * Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const keywords = words.filter(word =>
      word.length > 3 &&
      !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'man', 'men', 'put', 'say', 'she', 'too', 'use'].includes(word)
    );
    return [...new Set(keywords)].slice(0, 5);
  }

  /**
   * Extract urgency indicators
   */
  private extractUrgencyIndicators(text: string): string[] {
    const textLower = text.toLowerCase();
    return this.urgencyKeywords.filter(keyword => textLower.includes(keyword));
  }

  /**
   * Extract assignment indicators
   */
  private extractAssignmentIndicators(text: string): string[] {
    const indicators: string[] = [];

    // @mentions
    const mentions = text.match(/@\w+/g);
    if (mentions) indicators.push(...mentions);

    // Assignment phrases
    const assignmentPhrases = ['assign to', 'assigned to', 'responsible for', 'owner'];
    const textLower = text.toLowerCase();
    assignmentPhrases.forEach(phrase => {
      if (textLower.includes(phrase)) indicators.push(phrase);
    });

    return indicators;
  }

  /**
   * Check if text contains near deadline indicators
   */
  private hasNearDeadline(text: string): boolean {
    const nearTerms = ['today', 'tomorrow', 'urgent', 'asap', 'immediately'];
    return nearTerms.some(term => text.includes(term));
  }

  /**
   * Upgrade priority level
   */
  private upgradePriority(priority: Priority): Priority {
    const priorityLevels: Priority[] = ['low', 'medium', 'high', 'urgent'];
    const currentIndex = priorityLevels.indexOf(priority);
    return priorityLevels[Math.min(currentIndex + 1, priorityLevels.length - 1)];
  }

  /**
   * Normalize date string to ISO format
   */
  private normalizeDate(dateStr: string): string {
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return dateStr;
  }

  /**
   * Remove duplicate items based on content similarity
   */
  private deduplicateItems(items: DetectedActionItem[]): DetectedActionItem[] {
    const unique: DetectedActionItem[] = [];
    const seen = new Set<string>();

    for (const item of items) {
      const key = item.content.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }

    return unique.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate unique ID for detected items
   */
  private generateId(): string {
    return `detected_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const textAnalysisEngine = new TextAnalysisEngine();
