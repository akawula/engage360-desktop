export type ActionItemType =
  | 'todo'           // General TODO items
  | 'task'           // Specific tasks
  | 'action'         // Action items from meetings
  | 'reminder'       // Reminders and follow-ups
  | 'deadline'       // Time-sensitive items
  | 'development'    // Code/technical tasks
  | 'follow_up'      // Follow-up actions
  | 'assignment'     // Assigned tasks
  | 'commitment'     // Personal commitments
  | 'general'        // Catch-all category

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export interface TextPosition {
  start: number
  end: number
  line?: number
  column?: number
}

export interface ActionItemMetadata {
  language?: string
  keywords: string[]
  urgencyIndicators: string[]
  assignmentIndicators: string[]
}

export interface DetectedActionItem {
  id: string
  content: string
  type: ActionItemType
  priority: Priority
  confidence: number // 0-1
  suggestedTitle: string
  suggestedDescription?: string
  suggestedDueDate?: string
  suggestedAssignee?: string
  textPosition: TextPosition
  context: string
  detectionMethod: 'ai' | 'regex' | 'hybrid'
  createdAt: Date
  metadata: ActionItemMetadata
}

export interface AnalysisMetadata {
  processingTime: number
  modelUsed: string
  textLength: number
  language: string
  cacheHit: boolean
  analysisMethod: 'ai' | 'regex' | 'hybrid'
}

export interface PerformanceData {
  startTime: number
  endTime: number
  queuePosition?: number
}

export interface AnalysisSuggestion {
  type: 'formatting' | 'priority' | 'assignment' | 'deadline'
  message: string
  confidence: number
  actionable: boolean
}

export interface AnalysisResult {
  detectedItems: DetectedActionItem[]
  analysisMetadata: AnalysisMetadata
  suggestions: AnalysisSuggestion[]
  performance: PerformanceData
}

export interface AnalysisSettings {
  enabled: boolean
  debounceMs: number
  minConfidenceThreshold: number
  maxItemsToShow: number
  enabledDetectionTypes: ActionItemType[]
  ollamaModel: string
  fallbackToRegex: boolean
  cacheEnabled: boolean
  showLowConfidenceItems: boolean
  autoCreateThreshold: number
}

export interface AnalysisContext {
  noteType?: string
  associatedPerson?: string
  associatedGroup?: string
  previousAnalysis?: AnalysisResult
}

export interface RealTimeAnalysisOptions {
  debounceMs?: number
  minConfidenceThreshold?: number
  maxItems?: number
  contextWindow?: number
  enableCaching?: boolean
  ollamaModel?: string
}

export interface RealTimeAnalysisResult {
  detectedItems: DetectedActionItem[]
  processingTime: number
  cacheHit: boolean
  modelUsed: string
  textHash: string
}

export interface DetectionPattern {
  pattern: RegExp
  type: ActionItemType
  priority: Priority
  confidenceBase: number
  contextRequired: boolean
  description: string
}

export interface CacheEntry {
  result: AnalysisResult
  timestamp: number
  accessCount: number
  textHash: string
}

export interface PerformanceMetrics {
  averageAnalysisTime: number
  cacheHitRate: number
  totalAnalyses: number
  errorRate: number
  userAcceptanceRate: number
  detectionAccuracy: number
}

export interface TextDiff {
  added: string[]
  removed: string[]
  modified: string[]
  unchanged: string[]
  changePositions: TextPosition[]
}

export interface AnalysisRequest {
  id: string
  text: string
  context?: AnalysisContext
  options?: RealTimeAnalysisOptions
  timestamp: number
  priority: number
}

export interface AnalysisCallback {
  (result: AnalysisResult): void
}

// Event types for real-time analysis
export interface AnalysisEvent {
  type: 'started' | 'progress' | 'completed' | 'error' | 'cancelled'
  requestId: string
  data?: any
  error?: Error
  timestamp: number
}

// Settings for user preferences
export interface UserAnalysisSettings {
  realTimeAnalysis: {
    enabled: boolean
    sensitivity: 'low' | 'medium' | 'high'
    showConfidenceScores: boolean
    autoCreateThreshold: number
  }
  detectionTypes: {
    [key in ActionItemType]: boolean
  }
  ui: {
    sidebarPosition: 'left' | 'right'
    compactMode: boolean
    showPreview: boolean
  }
}

// System configuration
export interface SystemAnalysisConfig {
  performance: {
    debounceMs: number
    maxCacheSize: number
    analysisTimeout: number
  }
  ollama: {
    defaultModel: string
    fallbackModels: string[]
    warmupOnStart: boolean
  }
  detection: {
    minTextLength: number
    maxAnalysisLength: number
    confidenceThresholds: Record<ActionItemType, number>
  }
}
