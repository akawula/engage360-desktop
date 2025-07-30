# Real-Time Text Analysis Implementation Plan

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)

#### 1.1 Enhanced Ollama Service
**File**: `src/services/enhancedOllamaService.ts`

```typescript
// Key enhancements to existing ollamaService.ts
interface RealTimeAnalysisOptions {
  debounceMs?: number
  minConfidenceThreshold?: number
  maxItems?: number
  contextWindow?: number
  enableCaching?: boolean
}

interface RealTimeAnalysisResult {
  detectedItems: DetectedActionItem[]
  processingTime: number
  cacheHit: boolean
  modelUsed: string
  textHash: string
}

class EnhancedOllamaService extends OllamaService {
  private analysisCache = new Map<string, RealTimeAnalysisResult>()
  private modelWarmed = false

  async analyzeTextRealTime(
    text: string,
    options: RealTimeAnalysisOptions = {}
  ): Promise<RealTimeAnalysisResult>

  async warmupModel(modelName: string): Promise<void>

  private generateTextHash(text: string): string
  private extractActionItems(aiResponse: any): DetectedActionItem[]
  private calculateConfidenceScore(item: any, context: string): number
}
```

#### 1.2 Real-Time Analysis Service
**File**: `src/services/realTimeAnalysisService.ts`

```typescript
interface AnalysisCallback {
  (result: AnalysisResult): void
}

interface AnalysisContext {
  noteType?: string
  associatedPerson?: string
  associatedGroup?: string
  previousAnalysis?: AnalysisResult
}

class RealTimeAnalysisService {
  private debounceTimer: NodeJS.Timeout | null = null
  private currentAnalysis: Promise<AnalysisResult> | null = null
  private analysisQueue: AnalysisRequest[] = []

  // Core methods
  async analyzeText(text: string, context?: AnalysisContext): Promise<AnalysisResult>
  startRealTimeAnalysis(callback: AnalysisCallback): void
  stopRealTimeAnalysis(): void

  // Queue management
  private processAnalysisQueue(): void
  private debouncedAnalysis(text: string, callback: AnalysisCallback): void

  // Pattern detection fallbacks
  private regexBasedDetection(text: string): DetectedActionItem[]
  private hybridAnalysis(text: string): Promise<AnalysisResult>
}
```

#### 1.3 Data Models and Types
**File**: `src/types/realTimeAnalysis.ts`

```typescript
export interface DetectedActionItem {
  id: string
  content: string
  type: ActionItemType
  priority: Priority
  confidence: number
  suggestedTitle: string
  suggestedDescription?: string
  suggestedDueDate?: string
  suggestedAssignee?: string
  textPosition: {
    start: number
    end: number
    line?: number
    column?: number
  }
  context: string
  detectionMethod: 'ai' | 'regex' | 'hybrid'
  createdAt: Date
  metadata: {
    language?: string
    keywords: string[]
    urgencyIndicators: string[]
    assignmentIndicators: string[]
  }
}

export interface AnalysisResult {
  detectedItems: DetectedActionItem[]
  analysisMetadata: {
    processingTime: number
    modelUsed: string
    textLength: number
    language: string
    cacheHit: boolean
    analysisMethod: 'ai' | 'regex' | 'hybrid'
  }
  suggestions: AnalysisSuggestion[]
  performance: {
    startTime: number
    endTime: number
    queuePosition?: number
  }
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
```

### Phase 2: Real-Time Processing Engine (Week 2-3)

#### 2.1 Text Analysis Engine
**File**: `src/services/textAnalysisEngine.ts`

```typescript
interface DetectionPattern {
  pattern: RegExp
  type: ActionItemType
  priority: Priority
  confidenceBase: number
  contextRequired: boolean
}

class TextAnalysisEngine {
  private patterns: DetectionPattern[] = [
    // Imperative patterns
    {
      pattern: /\b(?:need to|needs to|should|must|have to)\s+(.+?)(?:\.|$|,)/gi,
      type: 'task',
      priority: 'medium',
      confidenceBase: 0.7,
      contextRequired: false
    },
    // Deadline patterns
    {
      pattern: /\b(?:by|due|deadline|before)\s+(?:on\s+)?(.+?)(?:\.|$|,)/gi,
      type: 'deadline',
      priority: 'high',
      confidenceBase: 0.8,
      contextRequired: true
    },
    // Assignment patterns
    {
      pattern: /\b(?:assign|assigned to|@\w+|responsible for)\s+(.+?)(?:\.|$|,)/gi,
      type: 'assignment',
      priority: 'medium',
      confidenceBase: 0.75,
      contextRequired: false
    }
    // ... more patterns
  ]

  detectPatterns(text: string): DetectedActionItem[]
  calculateContextualConfidence(item: DetectedActionItem, fullText: string): number
  extractDateReferences(text: string): Date[]
  extractAssigneeReferences(text: string): string[]
  prioritizeByUrgency(items: DetectedActionItem[]): DetectedActionItem[]
}
```

### Phase 3: User Interface Components (Week 3-4)

#### 3.1 Action Item Sidebar Component
**File**: `src/components/ActionItemSidebar.tsx`

```typescript
interface ActionItemSidebarProps {
  detectedItems: DetectedActionItem[]
  isAnalyzing: boolean
  onCreateActionItem: (item: DetectedActionItem) => Promise<void>
  onDismissItem: (itemId: string) => void
  onRefreshAnalysis: () => void
  settings: AnalysisSettings
}

export default function ActionItemSidebar({
  detectedItems,
  isAnalyzing,
  onCreateActionItem,
  onDismissItem,
  settings
}: ActionItemSidebarProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  // Group items by confidence/priority
  const groupedItems = useMemo(() => {
    return groupBy(detectedItems, (item) => {
      if (item.confidence >= 0.8) return 'high-confidence'
      if (item.confidence >= 0.6) return 'medium-confidence'
      return 'low-confidence'
    })
  }, [detectedItems])

  return (
    <div className="w-80 bg-white dark:bg-dark-900 border-l border-dark-300 dark:border-dark-700 flex flex-col h-full">
      {/* Header with analysis status */}
      <SidebarHeader
        isAnalyzing={isAnalyzing}
        itemCount={detectedItems.length}
        onRefresh={onRefreshAnalysis}
      />

      {/* Detected items list */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedItems).map(([confidence, items]) => (
          <ItemGroup
            key={confidence}
            title={confidence}
            items={items}
            onCreateItem={onCreateActionItem}
            onDismissItem={onDismissItem}
          />
        ))}
      </div>

      {/* Batch actions footer */}
      <SidebarFooter
        selectedItems={selectedItems}
        onBatchCreate={() => handleBatchCreate(selectedItems)}
      />
    </div>
  )
}
```

### Phase 4: Enhanced Rich Text Editor Integration (Week 4-5)

#### 4.1 Enhanced RichTextEditor
**File**: `src/components/RichTextEditor.tsx` (modifications)

```typescript
// Add new props to existing interface
interface RichTextEditorProps {
  // ... existing props
  enableRealTimeAnalysis?: boolean
  onAnalysisUpdate?: (result: AnalysisResult) => void
  analysisSettings?: AnalysisSettings
  analysisContext?: AnalysisContext
}

// Enhanced component implementation
const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  // ... existing props
  enableRealTimeAnalysis = false,
  onAnalysisUpdate,
  analysisSettings,
  analysisContext
}, ref) => {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Real-time analysis service
  const analysisService = useMemo(() => new RealTimeAnalysisService(), [])

  // Debounced analysis function
  const debouncedAnalysis = useMemo(
    () => debounce(async (text: string) => {
      if (!enableRealTimeAnalysis || !text.trim()) return

      setIsAnalyzing(true)
      try {
        const result = await analysisService.analyzeText(text, analysisContext)
        setAnalysisResult(result)
        onAnalysisUpdate?.(result)
      } catch (error) {
        console.error('Real-time analysis failed:', error)
      } finally {
        setIsAnalyzing(false)
      }
    }, analysisSettings?.debounceMs || 400),
    [enableRealTimeAnalysis, analysisService, analysisContext, onAnalysisUpdate, analysisSettings]
  )

  // Enhanced editor configuration
  const editor = useEditor({
    // ... existing configuration
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const text = editor.getText()

      onChange(html)

      // Trigger real-time analysis
      if (enableRealTimeAnalysis) {
        debouncedAnalysis(text)
      }
    }
  })

  // Analysis indicator component
  const AnalysisIndicator = () => (
    <div className="flex items-center gap-2 pl-2 border-l border-dark-400 dark:border-dark-700">
      {isAnalyzing ? (
        <div className="flex items-center gap-1">
          <Loader className="w-4 h-4 animate-spin text-primary-500" />
          <span className="text-xs text-dark-600 dark:text-dark-400">Analyzing...</span>
        </div>
      ) : analysisResult ? (
        <div className="flex items-center gap-1">
          <Brain className="w-4 h-4 text-primary-500" />
          <span className="text-xs text-dark-600 dark:text-dark-400">
            {analysisResult.detectedItems.length} items detected
          </span>
        </div>
      ) : null}
    </div>
  )

  return (
    <div className={`border border-dark-400 dark:border-dark-700 rounded-lg overflow-hidden flex flex-col ${className}`}>
      {/* Enhanced toolbar with analysis indicator */}
      <div className="border-b border-dark-300 dark:border-dark-700 bg-dark-100 dark:bg-dark-800 p-2 flex flex-wrap gap-1 transition-colors">
        {/* ... existing toolbar buttons */}

        {/* Analysis indicator */}
        {enableRealTimeAnalysis && <AnalysisIndicator />}
      </div>

      {/* Editor content */}
      <div className="flex-1 bg-white dark:bg-dark-900 transition-colors overflow-hidden">
        <EditorContent
          editor={editor}
          className="h-full overflow-y-auto focus-within:ring-2 focus-within:ring-primary-500"
        />
      </div>
    </div>
  )
})
```

### Phase 5: Integration and Testing (Week 5-6)

#### 5.1 Enhanced CreateNote Page Integration
**File**: `src/pages/CreateNote.tsx` (modifications)

```typescript
// Add state for real-time analysis
const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
const [showAnalysisSidebar, setShowAnalysisSidebar] = useState(true)
const [analysisSettings, setAnalysisSettings] = useState<AnalysisSettings>(() => {
  return {
    enabled: true,
    debounceMs: 400,
    minConfidenceThreshold: 0.6,
    maxItemsToShow: 10,
    enabledDetectionTypes: ['todo', 'task', 'action', 'deadline', 'reminder'],
    ollamaModel: 'llama3.2:1b',
    fallbackToRegex: true,
    cacheEnabled: true,
    showLowConfidenceItems: false,
    autoCreateThreshold: 0.8
  }
})

// Analysis context based on note associations
const analysisContext = useMemo((): AnalysisContext => ({
  noteType: formData.type,
  associatedPerson: formData.personId || undefined,
  associatedGroup: formData.groupId || undefined
}), [formData.type, formData.personId, formData.groupId])

// Handle analysis updates
const handleAnalysisUpdate = useCallback((result: AnalysisResult) => {
  setAnalysisResult(result)
}, [])

// Handle creating action item from detected item
const handleCreateActionItemFromDetected = useCallback(async (detectedItem: DetectedActionItem) => {
  try {
    // Pre-fill action item data from detected item
    const actionItemData = {
      title: detectedItem.suggestedTitle,
      description: detectedItem.suggestedDescription || detectedItem.content,
      priority: detectedItem.priority,
      dueDate: detectedItem.suggestedDueDate,
      personId: formData.personId,
      groupId: formData.groupId,
      noteId: undefined // Will be set after note is created
    }

    // Open action item modal with pre-filled data
    setPrefilledActionItem(actionItemData)
    setShowActionItemModal(true)
  } catch (error) {
    console.error('Failed to create action item from detected item:', error)
  }
}, [formData.personId, formData.groupId])

// Enhanced layout with sidebar
return (
  <div className="h-full flex bg-dark-100 dark:bg-dark-950 relative">
    {/* Main Content Area */}
    <div className="flex-1 flex flex-col min-w-0">
      {/* ... existing header and form sections */}

      {/* Maximized Content Editor */}
      <div className="flex-1 bg-white dark:bg-dark-900 overflow-hidden">
        <div className="h-full p-6">
          <RichTextEditor
            ref={editorRef}
            content={formData.content}
            onChange={handleContentChange}
            placeholder="Start writing your note here..."
            className="h-full prose prose-lg max-w-none dark:prose-invert prose-primary"
            enableRealTimeAnalysis={analysisSettings.enabled}
            onAnalysisUpdate={handleAnalysisUpdate}
            analysisSettings={analysisSettings}
            analysisContext={analysisContext}
          />
        </div>
      </div>
    </div>

    {/* Analysis Sidebar */}
    {showAnalysisSidebar && analysisResult && (
      <ActionItemSidebar
        detectedItems={analysisResult.detectedItems}
        isAnalyzing={false}
        onCreateActionItem={handleCreateActionItemFromDetected}
        onDismissItem={(itemId) => {
          // Remove item from current analysis result
          setAnalysisResult(prev => prev ? {
            ...prev,
            detectedItems: prev.detectedItems.filter(item => item.id !== itemId)
          } : null)
        }}
        onRefreshAnalysis={() => {
          // Trigger manual analysis
          const currentContent = editorRef.current?.getContent() || ''
          if (currentContent.trim()) {
            handleAnalysisUpdate(analysisResult)
          }
        }}
        settings={analysisSettings}
      />
    )}
  </div>
)
```

## Technical Implementation Details

### Ollama Prompt Optimization for Real-Time Analysis

```typescript
const REAL_TIME_ANALYSIS_PROMPT = `
Analyze the following text for actionable items. Return ONLY valid JSON:

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

Detection criteria:
- Imperative language: "need to", "should", "must", "implement", "fix"
- Deadlines: "by Friday", "due tomorrow", date patterns
- Assignments: "@username", "assign to", "responsible for"
- Commitments: "I will", "we'll", "promise to"
- Task keywords: "TODO", "FIXME", "ACTION", "TASK"

Text to analyze:
{TEXT}
`
```

### Performance Monitoring and Metrics

```typescript
interface PerformanceMetrics {
  averageAnalysisTime: number
  cacheHitRate: number
  totalAnalyses: number
  errorRate: number
  userAcceptanceRate: number
  detectionAccuracy: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    averageAnalysisTime: 0,
    cacheHitRate: 0,
    totalAnalyses: 0,
    errorRate: 0,
    userAcceptanceRate: 0,
    detectionAccuracy: 0
  }

  trackAnalysis(result: AnalysisResult): void
  trackUserAction(action: 'accept' | 'dismiss' | 'edit', itemId: string): void
  getMetrics(): PerformanceMetrics
  exportMetrics(): string
}
```

## Testing Strategy

### Unit Tests
- Text analysis engine pattern detection
- Confidence scoring algorithms
- Caching mechanisms
- Debouncing functionality

### Integration Tests
- Ollama service integration
- Real-time analysis workflow
- UI component interactions
- Performance under load

### User Acceptance Tests
- Detection accuracy validation
- User workflow integration
- Performance benchmarks
- Accessibility compliance

## Deployment Considerations

### Configuration Management
- User preference storage
- Model selection and fallbacks
- Performance tuning parameters
- Feature flags for gradual rollout

### Error Handling
- Ollama service unavailability
- Network connectivity issues
- Model loading failures
- Analysis timeout scenarios

### Performance Optimization
- Model warming strategies
- Cache management
- Memory usage monitoring
- Background processing queues

This implementation plan provides a comprehensive roadmap for building a sophisticated real-time text analysis system that enhances productivity while maintaining excellent user experience and performance.
