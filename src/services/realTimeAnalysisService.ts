import { enhancedOllamaService } from './enhancedOllamaService';
import { textAnalysisEngine } from './textAnalysisEngine';
import type {
  AnalysisResult,
  AnalysisContext,
  AnalysisSettings,
  AnalysisCallback,
  AnalysisRequest,
  AnalysisEvent,
  DetectedActionItem,
  RealTimeAnalysisOptions
} from '../types/realTimeAnalysis';

class RealTimeAnalysisService {
  private debounceTimer: number | null = null;
  private currentAnalysis: Promise<AnalysisResult> | null = null;
  private analysisQueue: AnalysisRequest[] = [];
  private isProcessingQueue = false;
  private activeCallbacks = new Set<AnalysisCallback>();
  private eventListeners = new Map<string, ((event: AnalysisEvent) => void)[]>();
  private requestCounter = 0;

  private defaultSettings: AnalysisSettings = {
    enabled: true,
    debounceMs: 400,
    minConfidenceThreshold: 0.5,
    maxItemsToShow: 10,
    enabledDetectionTypes: ['todo', 'task', 'action', 'deadline', 'reminder', 'development'],
    ollamaModel: 'llama3.2:1b',
    fallbackToRegex: true,
    cacheEnabled: true,
    showLowConfidenceItems: false,
    autoCreateThreshold: 0.8
  };

  private currentSettings: AnalysisSettings = { ...this.defaultSettings };

  /**
   * Analyze text with debouncing and queue management
   */
  async analyzeText(
    text: string,
    context?: AnalysisContext,
    options?: Partial<RealTimeAnalysisOptions>
  ): Promise<AnalysisResult> {
    if (!this.currentSettings.enabled || !text.trim()) {
      return this.createEmptyResult();
    }

    const requestId = this.generateRequestId();
    const analysisOptions: RealTimeAnalysisOptions = {
      debounceMs: this.currentSettings.debounceMs,
      minConfidenceThreshold: this.currentSettings.minConfidenceThreshold,
      maxItems: this.currentSettings.maxItemsToShow,
      enableCaching: this.currentSettings.cacheEnabled,
      ollamaModel: this.currentSettings.ollamaModel,
      ...options
    };

    this.emitEvent({
      type: 'started',
      requestId,
      timestamp: Date.now()
    });

    try {
      // Use enhanced Ollama service for analysis
      const result = await enhancedOllamaService.analyzeTextRealTime(text, context, analysisOptions);

      // Convert to full AnalysisResult format
      const analysisResult: AnalysisResult = {
        detectedItems: this.filterAndSortItems(result.detectedItems),
        analysisMetadata: {
          processingTime: result.processingTime,
          modelUsed: result.modelUsed,
          textLength: text.length,
          language: 'unknown', // Will be detected by AI
          cacheHit: result.cacheHit,
          analysisMethod: result.modelUsed.includes('regex') ? 'regex' : 'ai'
        },
        suggestions: this.generateSuggestions(result.detectedItems),
        performance: {
          startTime: Date.now() - result.processingTime,
          endTime: Date.now()
        }
      };

      this.emitEvent({
        type: 'completed',
        requestId,
        data: analysisResult,
        timestamp: Date.now()
      });

      return analysisResult;
    } catch (error) {
      this.emitEvent({
        type: 'error',
        requestId,
        error: error as Error,
        timestamp: Date.now()
      });

      // Return fallback result
      return this.createFallbackResult(text, context);
    }
  }

  /**
   * Start real-time analysis with debouncing
   */
  startRealTimeAnalysis(callback: AnalysisCallback): void {
    this.activeCallbacks.add(callback);
  }

  /**
   * Stop real-time analysis
   */
  stopRealTimeAnalysis(callback?: AnalysisCallback): void {
    if (callback) {
      this.activeCallbacks.delete(callback);
    } else {
      this.activeCallbacks.clear();
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Analyze text with debouncing for real-time scenarios
   */
  debouncedAnalysis(
    text: string,
    context?: AnalysisContext,
    options?: Partial<RealTimeAnalysisOptions>
  ): void {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Set new timer
    this.debounceTimer = setTimeout(async () => {
      try {
        const result = await this.analyzeText(text, context, options);

        // Notify all active callbacks
        this.activeCallbacks.forEach(callback => {
          try {
            callback(result);
          } catch (error) {
            console.error('Error in analysis callback:', error);
          }
        });
      } catch (error) {
        console.error('Debounced analysis failed:', error);
      }
    }, options?.debounceMs || this.currentSettings.debounceMs);
  }

  /**
   * Add analysis request to queue for batch processing
   */
  queueAnalysis(
    text: string,
    context?: AnalysisContext,
    priority: number = 0
  ): string {
    const requestId = this.generateRequestId();

    const request: AnalysisRequest = {
      id: requestId,
      text,
      context,
      timestamp: Date.now(),
      priority
    };

    // Insert in priority order
    const insertIndex = this.analysisQueue.findIndex(req => req.priority < priority);
    if (insertIndex === -1) {
      this.analysisQueue.push(request);
    } else {
      this.analysisQueue.splice(insertIndex, 0, request);
    }

    // Start processing if not already running
    if (!this.isProcessingQueue) {
      this.processAnalysisQueue();
    }

    return requestId;
  }

  /**
   * Process queued analysis requests
   */
  private async processAnalysisQueue(): Promise<void> {
    if (this.isProcessingQueue || this.analysisQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.analysisQueue.length > 0) {
      const request = this.analysisQueue.shift()!;

      try {
        this.emitEvent({
          type: 'progress',
          requestId: request.id,
          data: { queuePosition: this.analysisQueue.length },
          timestamp: Date.now()
        });

        const result = await this.analyzeText(request.text, request.context);

        // Notify callbacks for this specific request
        this.activeCallbacks.forEach(callback => {
          try {
            callback(result);
          } catch (error) {
            console.error('Error in queued analysis callback:', error);
          }
        });

      } catch (error) {
        console.error('Queued analysis failed:', error);
        this.emitEvent({
          type: 'error',
          requestId: request.id,
          error: error as Error,
          timestamp: Date.now()
        });
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Update analysis settings
   */
  updateSettings(newSettings: Partial<AnalysisSettings>): void {
    this.currentSettings = {
      ...this.currentSettings,
      ...newSettings
    };

    // Clear cache if caching was disabled
    if (newSettings.cacheEnabled === false) {
      enhancedOllamaService.clearCache();
    }
  }

  /**
   * Get current analysis settings
   */
  getSettings(): AnalysisSettings {
    return { ...this.currentSettings };
  }

  /**
   * Reset settings to defaults
   */
  resetSettings(): void {
    this.currentSettings = { ...this.defaultSettings };
  }

  /**
   * Filter and sort detected items based on settings
   */
  private filterAndSortItems(items: DetectedActionItem[]): DetectedActionItem[] {
    let filtered = items.filter(item => {
      // Filter by confidence threshold
      if (item.confidence < this.currentSettings.minConfidenceThreshold) {
        return this.currentSettings.showLowConfidenceItems;
      }

      // Filter by enabled detection types
      return this.currentSettings.enabledDetectionTypes.includes(item.type);
    });

    // Sort by confidence (highest first) and then by priority
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];

      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    // Limit number of items
    return filtered.slice(0, this.currentSettings.maxItemsToShow);
  }

  /**
   * Generate suggestions based on analysis results
   */
  private generateSuggestions(items: DetectedActionItem[]) {
    const suggestions = [];

    // Check for items that could be auto-created
    const highConfidenceItems = items.filter(item =>
      item.confidence >= this.currentSettings.autoCreateThreshold
    );

    if (highConfidenceItems.length > 0) {
      suggestions.push({
        type: 'formatting' as const,
        message: `${highConfidenceItems.length} high-confidence items detected. Consider auto-creating them.`,
        confidence: 0.9,
        actionable: true
      });
    }

    // Check for missing due dates
    const itemsWithoutDates = items.filter(item =>
      item.type === 'deadline' && !item.suggestedDueDate
    );

    if (itemsWithoutDates.length > 0) {
      suggestions.push({
        type: 'deadline' as const,
        message: `${itemsWithoutDates.length} deadline items missing specific dates.`,
        confidence: 0.7,
        actionable: true
      });
    }

    // Check for unassigned items
    const unassignedItems = items.filter(item =>
      item.type === 'assignment' && !item.suggestedAssignee
    );

    if (unassignedItems.length > 0) {
      suggestions.push({
        type: 'assignment' as const,
        message: `${unassignedItems.length} items need assignment clarification.`,
        confidence: 0.8,
        actionable: true
      });
    }

    return suggestions;
  }

  /**
   * Create empty analysis result
   */
  private createEmptyResult(): AnalysisResult {
    return {
      detectedItems: [],
      analysisMetadata: {
        processingTime: 0,
        modelUsed: 'none',
        textLength: 0,
        language: 'unknown',
        cacheHit: false,
        analysisMethod: 'regex'
      },
      suggestions: [],
      performance: {
        startTime: Date.now(),
        endTime: Date.now()
      }
    };
  }

  /**
   * Create fallback result using regex analysis
   */
  private async createFallbackResult(
    text: string,
    context?: AnalysisContext
  ): Promise<AnalysisResult> {
    const startTime = Date.now();

    try {
      const detectedItems = textAnalysisEngine.detectPatterns(text);

      return {
        detectedItems: this.filterAndSortItems(detectedItems),
        analysisMetadata: {
          processingTime: Date.now() - startTime,
          modelUsed: 'regex-fallback',
          textLength: text.length,
          language: 'unknown',
          cacheHit: false,
          analysisMethod: 'regex'
        },
        suggestions: this.generateSuggestions(detectedItems),
        performance: {
          startTime,
          endTime: Date.now()
        }
      };
    } catch (error) {
      console.error('Fallback analysis failed:', error);
      return this.createEmptyResult();
    }
  }

  /**
   * Event management
   */
  addEventListener(eventType: string, listener: (event: AnalysisEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  removeEventListener(eventType: string, listener: (event: AnalysisEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(event: AnalysisEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  /**
   * Utility methods
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestCounter}`;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return enhancedOllamaService.getPerformanceMetrics();
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    enhancedOllamaService.clearCache();
  }

  /**
   * Get cache information
   */
  getCacheInfo() {
    return {
      size: enhancedOllamaService.getCacheSize(),
      enabled: this.currentSettings.cacheEnabled
    };
  }

  /**
   * Check if analysis is currently running
   */
  isAnalyzing(): boolean {
    return this.currentAnalysis !== null || this.isProcessingQueue;
  }

  /**
   * Get queue status
   */
  getQueueStatus() {
    return {
      length: this.analysisQueue.length,
      isProcessing: this.isProcessingQueue,
      activeCallbacks: this.activeCallbacks.size
    };
  }

  /**
   * Cancel all pending analyses
   */
  cancelAll(): void {
    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Clear queue
    this.analysisQueue.length = 0;
    this.isProcessingQueue = false;

    // Emit cancellation events
    this.emitEvent({
      type: 'cancelled',
      requestId: 'all',
      timestamp: Date.now()
    });
  }

  /**
   * Health check for the analysis service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      ollama: boolean;
      cache: boolean;
      queue: boolean;
      settings: boolean;
    };
  }> {
    const details = {
      ollama: false,
      cache: true,
      queue: this.analysisQueue.length < 100, // Healthy if queue not too long
      settings: this.currentSettings.enabled
    };

    try {
      const ollamaStatus = await enhancedOllamaService.checkOllamaStatus();
      details.ollama = ollamaStatus.isInstalled && ollamaStatus.isRunning;
    } catch (error) {
      details.ollama = false;
    }

    const healthyCount = Object.values(details).filter(Boolean).length;
    const status = healthyCount === 4 ? 'healthy' :
                  healthyCount >= 2 ? 'degraded' : 'unhealthy';

    return { status, details };
  }
}

// Export singleton instance
export const realTimeAnalysisService = new RealTimeAnalysisService();
