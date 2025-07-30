import { ollamaService, type OllamaStatus, type DetectedTask, type TaskDetectionResult } from './ollamaService';
import type {
  DetectedActionItem,
  RealTimeAnalysisOptions,
  RealTimeAnalysisResult,
  AnalysisResult,
  AnalysisContext,
  CacheEntry,
  PerformanceMetrics
} from '../types/realTimeAnalysis';
import { textAnalysisEngine } from './textAnalysisEngine';

interface OllamaAPIResponse {
  detectedLanguage: string;
  items: Array<{
    content: string;
    suggestedTitle: string;
    suggestedDescription?: string;
    type: string;
    priority: string;
    confidence: number;
    suggestedDueDate?: string;
    suggestedAssignee?: string;
    keywords: string[];
    urgencyIndicators: string[];
    assignmentIndicators: string[];
  }>;
}

export class EnhancedOllamaService {
  private analysisCache = new Map<string, CacheEntry>();
  private modelWarmed = false;
  private readonly maxCacheSize = 100;
  private readonly cacheExpiryMs = 5 * 60 * 1000; // 5 minutes
  private performanceMetrics: PerformanceMetrics = {
    averageAnalysisTime: 0,
    cacheHitRate: 0,
    totalAnalyses: 0,
    errorRate: 0,
    userAcceptanceRate: 0,
    detectionAccuracy: 0
  };

  /**
   * Analyze text in real-time with caching and performance optimization
   */
  async analyzeTextRealTime(
    text: string,
    context?: AnalysisContext,
    options: RealTimeAnalysisOptions = {}
  ): Promise<RealTimeAnalysisResult> {
    const startTime = performance.now();
    const textHash = this.generateTextHash(text);

    // Check cache first
    if (options.enableCaching !== false) {
      const cachedResult = this.getCachedResult(textHash);
      if (cachedResult) {
        this.updatePerformanceMetrics(performance.now() - startTime, true);
        return {
          detectedItems: cachedResult.detectedItems,
          processingTime: performance.now() - startTime,
          cacheHit: true,
          modelUsed: cachedResult.analysisMetadata.modelUsed,
          textHash
        };
      }
    }

    try {
      // Check if text is too short or too long
      if (text.trim().length < 10) {
        return {
          detectedItems: [],
          processingTime: performance.now() - startTime,
          cacheHit: false,
          modelUsed: 'none',
          textHash
        };
      }

      if (text.length > 10000) {
        // For very long texts, use chunking
        return await this.analyzeTextInChunks(text, context, options);
      }

      // Warm up model if needed
      const modelName = options.ollamaModel || 'llama3.2:1b';
      if (!this.modelWarmed) {
        await this.warmupModel(modelName);
      }

      // Check Ollama status
      const ollamaStatus = await ollamaService.checkOllamaStatus();

      let analysisResult: AnalysisResult;

      if (ollamaStatus.isInstalled && ollamaStatus.isRunning) {
        // Use AI analysis
        analysisResult = await this.performAIAnalysis(text, context, modelName);
      } else {
        // Fallback to regex analysis
        analysisResult = await this.performRegexAnalysis(text, context);
      }

      // Cache the result
      if (options.enableCaching !== false) {
        this.setCachedResult(textHash, analysisResult);
      }

      this.updatePerformanceMetrics(performance.now() - startTime, false);

      return {
        detectedItems: analysisResult.detectedItems,
        processingTime: performance.now() - startTime,
        cacheHit: false,
        modelUsed: analysisResult.analysisMetadata.modelUsed,
        textHash
      };

    } catch (error) {
      console.error('Enhanced Ollama analysis failed:', error);
      this.performanceMetrics.errorRate++;

      // Fallback to regex analysis
      const fallbackResult = await this.performRegexAnalysis(text, context);

      return {
        detectedItems: fallbackResult.detectedItems,
        processingTime: performance.now() - startTime,
        cacheHit: false,
        modelUsed: 'regex-fallback',
        textHash
      };
    }
  }

  /**
   * Warm up the Ollama model for faster responses
   */
  async warmupModel(modelName: string): Promise<void> {
    try {
      console.log(`Warming up Ollama model: ${modelName}`);

      // Send a small test request to warm up the model
      const warmupText = "This is a test to warm up the model.";
      await this.callOllamaAPI(modelName, warmupText);

      this.modelWarmed = true;
      console.log(`Model ${modelName} warmed up successfully`);
    } catch (error) {
      console.warn(`Failed to warm up model ${modelName}:`, error);
      // Don't throw error, just log warning
    }
  }

  /**
   * Perform AI-based analysis using Ollama
   */
  private async performAIAnalysis(
    text: string,
    context?: AnalysisContext,
    modelName: string = 'llama3.2:1b'
  ): Promise<AnalysisResult> {
    const startTime = performance.now();

    try {
      const aiResponse = await this.callOllamaAPI(modelName, text, context);
      const detectedItems = this.convertAIResponseToActionItems(aiResponse, text);

      return {
        detectedItems,
        analysisMetadata: {
          processingTime: performance.now() - startTime,
          modelUsed: modelName,
          textLength: text.length,
          language: aiResponse.detectedLanguage || 'unknown',
          cacheHit: false,
          analysisMethod: 'ai'
        },
        suggestions: this.generateSuggestions(detectedItems),
        performance: {
          startTime,
          endTime: performance.now()
        }
      };
    } catch (error) {
      console.error('AI analysis failed, falling back to regex:', error);
      return await this.performRegexAnalysis(text, context);
    }
  }

  /**
   * Perform regex-based analysis as fallback
   */
  private async performRegexAnalysis(
    text: string,
    context?: AnalysisContext
  ): Promise<AnalysisResult> {
    const startTime = performance.now();

    const detectedItems = textAnalysisEngine.detectPatterns(text);

    return {
      detectedItems,
      analysisMetadata: {
        processingTime: performance.now() - startTime,
        modelUsed: 'regex-engine',
        textLength: text.length,
        language: 'unknown',
        cacheHit: false,
        analysisMethod: 'regex'
      },
      suggestions: this.generateSuggestions(detectedItems),
      performance: {
        startTime,
        endTime: performance.now()
      }
    };
  }

  /**
   * Analyze text in chunks for very long documents
   */
  private async analyzeTextInChunks(
    text: string,
    context?: AnalysisContext,
    options: RealTimeAnalysisOptions = {}
  ): Promise<RealTimeAnalysisResult> {
    const chunkSize = 2000;
    const chunks = this.splitTextIntoChunks(text, chunkSize);
    const allDetectedItems: DetectedActionItem[] = [];
    let totalProcessingTime = 0;

    for (const chunk of chunks) {
      const chunkResult = await this.analyzeTextRealTime(chunk.text, context, {
        ...options,
        enableCaching: false // Don't cache chunks
      });

      // Adjust text positions for the chunk offset
      const adjustedItems = chunkResult.detectedItems.map(item => ({
        ...item,
        textPosition: {
          ...item.textPosition,
          start: item.textPosition.start + chunk.offset,
          end: item.textPosition.end + chunk.offset
        }
      }));

      allDetectedItems.push(...adjustedItems);
      totalProcessingTime += chunkResult.processingTime;
    }

    return {
      detectedItems: this.deduplicateItems(allDetectedItems),
      processingTime: totalProcessingTime,
      cacheHit: false,
      modelUsed: 'chunked-analysis',
      textHash: this.generateTextHash(text)
    };
  }

  /**
   * Call Ollama API with optimized prompt for real-time analysis
   */
  private async callOllamaAPI(
    modelName: string,
    text: string,
    context?: AnalysisContext
  ): Promise<OllamaAPIResponse> {
    const prompt = this.buildOptimizedPrompt(text, context);

    try {
      // Try HTTP API first
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          prompt: prompt,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.1, // Lower temperature for more consistent results
            top_p: 0.9,
            num_predict: 1000 // Limit response length for speed
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.response) {
        throw new Error('No response from Ollama API');
      }

      return JSON.parse(result.response);
    } catch (error) {
      console.error('Ollama HTTP API failed, trying command line:', error);

      // Fallback to command line
      const result = await ollamaService.detectTasks(modelName, text);
      return this.convertLegacyResponse(result);
    }
  }

  /**
   * Build optimized prompt for real-time analysis
   */
  private buildOptimizedPrompt(text: string, context?: AnalysisContext): string {
    const contextInfo = context ? `
Context: This is a ${context.noteType || 'general'} note${
      context.associatedPerson ? ` associated with ${context.associatedPerson}` : ''
    }${context.associatedGroup ? ` for group ${context.associatedGroup}` : ''}.
` : '';

    return `${contextInfo}
Analyze the following text for actionable items. Return ONLY valid JSON in this exact format:

{
  "detectedLanguage": "English",
  "items": [
    {
      "content": "exact text from input",
      "suggestedTitle": "concise action title",
      "suggestedDescription": "optional details",
      "type": "todo|task|action|reminder|deadline|development|follow_up|assignment|commitment|general",
      "priority": "low|medium|high|urgent",
      "confidence": 0.85,
      "suggestedDueDate": "YYYY-MM-DD or null",
      "suggestedAssignee": "person name or null",
      "keywords": ["keyword1", "keyword2"],
      "urgencyIndicators": ["urgent", "asap"],
      "assignmentIndicators": ["@john", "assign to"]
    }
  ]
}

Focus on:
- Imperative language: "need to", "should", "must", "implement", "fix"
- Deadlines: "by Friday", "due tomorrow", date patterns
- Assignments: "@username", "assign to", "responsible for"
- Commitments: "I will", "we'll", "promise to"
- Task keywords: "TODO", "FIXME", "ACTION", "TASK"

Text to analyze:
${text}`;
  }

  /**
   * Convert AI response to DetectedActionItem format
   */
  private convertAIResponseToActionItems(
    aiResponse: OllamaAPIResponse,
    originalText: string
  ): DetectedActionItem[] {
    if (!aiResponse.items || !Array.isArray(aiResponse.items)) {
      return [];
    }

    return aiResponse.items.map(item => {
      // Find the position of the content in the original text
      const position = this.findTextPosition(originalText, item.content);

      return {
        id: this.generateId(),
        content: item.content,
        type: this.validateActionItemType(item.type),
        priority: this.validatePriority(item.priority),
        confidence: Math.max(0, Math.min(1, item.confidence || 0.5)),
        suggestedTitle: item.suggestedTitle || this.generateTitle(item.content),
        suggestedDescription: item.suggestedDescription,
        suggestedDueDate: item.suggestedDueDate || undefined,
        suggestedAssignee: item.suggestedAssignee || undefined,
        textPosition: position,
        context: this.extractContext(originalText, position, 100),
        detectionMethod: 'ai',
        createdAt: new Date(),
        metadata: {
          language: aiResponse.detectedLanguage,
          keywords: item.keywords || [],
          urgencyIndicators: item.urgencyIndicators || [],
          assignmentIndicators: item.assignmentIndicators || []
        }
      };
    });
  }

  /**
   * Convert legacy Ollama response format
   */
  private convertLegacyResponse(legacyResult: TaskDetectionResult): OllamaAPIResponse {
    return {
      detectedLanguage: legacyResult.detectedLanguage,
      items: legacyResult.tasks.map(task => ({
        content: task.content,
        suggestedTitle: task.content.substring(0, 50),
        type: task.type,
        priority: task.priority,
        confidence: task.confidence,
        keywords: [],
        urgencyIndicators: [],
        assignmentIndicators: []
      }))
    };
  }

  /**
   * Generate suggestions based on detected items
   */
  private generateSuggestions(detectedItems: DetectedActionItem[]) {
    const suggestions = [];

    // Suggest formatting improvements
    const lowConfidenceItems = detectedItems.filter(item => item.confidence < 0.6);
    if (lowConfidenceItems.length > 0) {
      suggestions.push({
        type: 'formatting' as const,
        message: `Consider using clearer action language for ${lowConfidenceItems.length} detected items`,
        confidence: 0.7,
        actionable: true
      });
    }

    // Suggest priority adjustments
    const urgentItems = detectedItems.filter(item => item.priority === 'urgent');
    if (urgentItems.length > 3) {
      suggestions.push({
        type: 'priority' as const,
        message: 'Many urgent items detected. Consider prioritizing the most critical ones.',
        confidence: 0.8,
        actionable: true
      });
    }

    return suggestions;
  }

  /**
   * Cache management methods
   */
  private getCachedResult(textHash: string): AnalysisResult | null {
    const entry = this.analysisCache.get(textHash);
    if (!entry) return null;

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > this.cacheExpiryMs) {
      this.analysisCache.delete(textHash);
      return null;
    }

    entry.accessCount++;
    return entry.result;
  }

  private setCachedResult(textHash: string, result: AnalysisResult): void {
    // Clean up expired entries if cache is full
    if (this.analysisCache.size >= this.maxCacheSize) {
      this.cleanupExpiredCache();
    }

    // If still full, remove least recently used
    if (this.analysisCache.size >= this.maxCacheSize) {
      const oldestKey = Array.from(this.analysisCache.entries())
        .sort((a, b) => a[1].accessCount - b[1].accessCount)[0][0];
      this.analysisCache.delete(oldestKey);
    }

    this.analysisCache.set(textHash, {
      result,
      timestamp: Date.now(),
      accessCount: 1,
      textHash
    });
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.analysisCache.entries()) {
      if (now - entry.timestamp > this.cacheExpiryMs) {
        this.analysisCache.delete(key);
      }
    }
  }

  /**
   * Utility methods
   */
  private generateTextHash(text: string): string {
    // Simple hash function for caching
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  private findTextPosition(text: string, content: string) {
    const index = text.indexOf(content);
    return {
      start: index >= 0 ? index : 0,
      end: index >= 0 ? index + content.length : content.length
    };
  }

  private extractContext(text: string, position: { start: number; end: number }, radius: number): string {
    const start = Math.max(0, position.start - radius);
    const end = Math.min(text.length, position.end + radius);
    return text.substring(start, end);
  }

  private splitTextIntoChunks(text: string, chunkSize: number) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push({
        text: text.substring(i, i + chunkSize),
        offset: i
      });
    }
    return chunks;
  }

  private deduplicateItems(items: DetectedActionItem[]): DetectedActionItem[] {
    const unique = new Map<string, DetectedActionItem>();

    for (const item of items) {
      const key = item.content.toLowerCase().replace(/\s+/g, ' ').trim();
      if (!unique.has(key) || unique.get(key)!.confidence < item.confidence) {
        unique.set(key, item);
      }
    }

    return Array.from(unique.values()).sort((a, b) => b.confidence - a.confidence);
  }

  private validateActionItemType(type: string): DetectedActionItem['type'] {
    const validTypes = ['todo', 'task', 'action', 'reminder', 'deadline', 'development', 'follow_up', 'assignment', 'commitment', 'general'];
    return validTypes.includes(type) ? type as DetectedActionItem['type'] : 'general';
  }

  private validatePriority(priority: string): DetectedActionItem['priority'] {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    return validPriorities.includes(priority) ? priority as DetectedActionItem['priority'] : 'medium';
  }

  private generateTitle(content: string): string {
    return content.length > 50 ? content.substring(0, 47) + '...' : content;
  }

  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private updatePerformanceMetrics(processingTime: number, cacheHit: boolean): void {
    this.performanceMetrics.totalAnalyses++;

    if (cacheHit) {
      this.performanceMetrics.cacheHitRate =
        (this.performanceMetrics.cacheHitRate * (this.performanceMetrics.totalAnalyses - 1) + 1) /
        this.performanceMetrics.totalAnalyses;
    } else {
      this.performanceMetrics.averageAnalysisTime =
        (this.performanceMetrics.averageAnalysisTime * (this.performanceMetrics.totalAnalyses - 1) + processingTime) /
        this.performanceMetrics.totalAnalyses;
    }
  }

  /**
   * Public methods for monitoring and management
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  clearCache(): void {
    this.analysisCache.clear();
  }

  getCacheSize(): number {
    return this.analysisCache.size;
  }

  async checkOllamaStatus(): Promise<OllamaStatus> {
    return await ollamaService.checkOllamaStatus();
  }
}

export const enhancedOllamaService = new EnhancedOllamaService();
