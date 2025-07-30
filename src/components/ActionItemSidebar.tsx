import React, { useState, useMemo, useCallback } from 'react';
import {
  Brain,
  Loader,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Plus,
  X,
  Clock,
  User,
  AlertTriangle,
  Zap,
  Target
} from 'lucide-react';
import type {
  DetectedActionItem,
  AnalysisSettings,
  AnalysisResult
} from '../types/realTimeAnalysis';

interface ActionItemSidebarProps {
  detectedItems: DetectedActionItem[];
  isAnalyzing: boolean;
  analysisProgress?: number;
  onCreateActionItem: (item: DetectedActionItem) => Promise<void>;
  onDismissItem: (itemId: string) => void;
  onRefreshAnalysis: () => void;
  onUpdateSettings?: (settings: Partial<AnalysisSettings>) => void;
  settings: AnalysisSettings;
  className?: string;
  analysisResult?: AnalysisResult;
}

interface GroupedItems {
  'high-confidence': DetectedActionItem[];
  'medium-confidence': DetectedActionItem[];
  'low-confidence': DetectedActionItem[];
}

export default function ActionItemSidebar({
  detectedItems,
  isAnalyzing,
  analysisProgress,
  onCreateActionItem,
  onDismissItem,
  onRefreshAnalysis,
  onUpdateSettings,
  settings,
  className = '',
  analysisResult
}: ActionItemSidebarProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['high-confidence', 'medium-confidence']));
  const [showSettings, setShowSettings] = useState(false);
  const [creatingItems, setCreatingItems] = useState<Set<string>>(new Set());

  // Group items by confidence level
  const groupedItems = useMemo((): GroupedItems => {
    const groups: GroupedItems = {
      'high-confidence': [],
      'medium-confidence': [],
      'low-confidence': []
    };

    detectedItems.forEach(item => {
      if (item.confidence >= 0.8) {
        groups['high-confidence'].push(item);
      } else if (item.confidence >= 0.6) {
        groups['medium-confidence'].push(item);
      } else {
        groups['low-confidence'].push(item);
      }
    });

    return groups;
  }, [detectedItems]);

  const totalItems = detectedItems.length;
  const selectedCount = selectedItems.size;

  // Handle item selection
  const handleToggleSelection = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  // Handle group expansion
  const handleToggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  // Handle single item creation
  const handleCreateItem = useCallback(async (item: DetectedActionItem) => {
    setCreatingItems(prev => new Set(prev).add(item.id));
    try {
      await onCreateActionItem(item);
      onDismissItem(item.id); // Remove from sidebar after creation
    } catch (error) {
      console.error('Failed to create action item:', error);
    } finally {
      setCreatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  }, [onCreateActionItem, onDismissItem]);

  // Handle batch creation
  const handleBatchCreate = useCallback(async () => {
    const itemsToCreate = detectedItems.filter(item => selectedItems.has(item.id));

    for (const item of itemsToCreate) {
      setCreatingItems(prev => new Set(prev).add(item.id));
      try {
        await onCreateActionItem(item);
        onDismissItem(item.id);
      } catch (error) {
        console.error('Failed to create action item:', error);
      } finally {
        setCreatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(item.id);
          return newSet;
        });
      }
    }

    setSelectedItems(new Set());
  }, [detectedItems, selectedItems, onCreateActionItem, onDismissItem]);

  // Handle batch dismiss
  const handleBatchDismiss = useCallback(() => {
    selectedItems.forEach(itemId => onDismissItem(itemId));
    setSelectedItems(new Set());
  }, [selectedItems, onDismissItem]);

  // Handle select all in group
  const handleSelectAllInGroup = useCallback((groupItems: DetectedActionItem[]) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      groupItems.forEach(item => newSet.add(item.id));
      return newSet;
    });
  }, []);

  return (
    <div className={`w-80 bg-white dark:bg-dark-900 border-l border-dark-300 dark:border-dark-700 flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-dark-300 dark:border-dark-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary-500" />
            <h3 className="font-semibold text-dark-900 dark:text-white">
              Action Items
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={onRefreshAnalysis}
              disabled={isAnalyzing}
              className="p-1.5 text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-200 dark:hover:bg-dark-800 rounded-md transition-colors disabled:opacity-50"
              title="Refresh analysis"
            >
              <RefreshCw className={`h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1.5 text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-200 dark:hover:bg-dark-800 rounded-md transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {isAnalyzing ? (
              <>
                <div className="relative">
                  <Loader className="h-4 w-4 animate-spin text-primary-500" />
                  {analysisProgress !== undefined && (
                    <div className="absolute -inset-1">
                      <div
                        className="w-6 h-6 border-2 border-primary-200 dark:border-primary-800 rounded-full"
                        style={{
                          background: `conic-gradient(from 0deg, rgb(59 130 246) ${analysisProgress * 3.6}deg, transparent ${analysisProgress * 3.6}deg)`
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-dark-600 dark:text-dark-400 font-medium">
                    Analyzing with AI...
                  </span>
                  {analysisProgress !== undefined && (
                    <span className="text-xs text-dark-500">
                      {Math.round(analysisProgress)}% complete
                    </span>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-dark-600 dark:text-dark-400">
                    {totalItems} detected
                  </span>
                </div>
                {analysisResult && (
                  <span className="text-xs text-dark-500">
                    {analysisResult.analysisMetadata.processingTime.toFixed(0)}ms
                  </span>
                )}
              </>
            )}
          </div>
          {selectedCount > 0 && (
            <span className="text-primary-600 dark:text-primary-400 font-medium">
              {selectedCount} selected
            </span>
          )}
        </div>

        {/* Analysis method indicator */}
        {analysisResult && (
          <div className="mt-2 flex items-center gap-2 text-xs text-dark-500">
            <span className={`px-2 py-1 rounded-full ${
              analysisResult.analysisMetadata.analysisMethod === 'ai'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
            }`}>
              {analysisResult.analysisMetadata.analysisMethod === 'ai' ? 'AI' : 'Pattern'}
            </span>
            {analysisResult.analysisMetadata.cacheHit && (
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                Cached
              </span>
            )}
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && onUpdateSettings && (
        <div className="flex-shrink-0 p-4 border-b border-dark-300 dark:border-dark-700 bg-dark-50 dark:bg-dark-800">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-dark-700 dark:text-dark-300 mb-1">
                Confidence Threshold
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.minConfidenceThreshold}
                onChange={(e) => onUpdateSettings({ minConfidenceThreshold: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="text-xs text-dark-500 mt-1">
                {Math.round(settings.minConfidenceThreshold * 100)}%
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-dark-700 dark:text-dark-300 mb-1">
                Max Items
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.maxItemsToShow}
                onChange={(e) => onUpdateSettings({ maxItemsToShow: parseInt(e.target.value) })}
                className="w-full px-2 py-1 text-xs border border-dark-300 dark:border-dark-600 rounded bg-white dark:bg-dark-700 text-dark-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showLowConfidence"
                checked={settings.showLowConfidenceItems}
                onChange={(e) => onUpdateSettings({ showLowConfidenceItems: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="showLowConfidence" className="text-xs text-dark-700 dark:text-dark-300">
                Show low confidence items
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="flex-1 overflow-y-auto">
        {isAnalyzing && totalItems === 0 ? (
          <div className="p-6 text-center">
            <div className="relative mx-auto mb-4 w-12 h-12">
              <Loader className="h-12 w-12 animate-spin text-primary-500 mx-auto" />
              <Brain className="h-6 w-6 text-primary-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-sm text-dark-600 dark:text-dark-400 mb-1 font-medium">
              AI is analyzing your text...
            </p>
            <p className="text-xs text-dark-500">
              Looking for action items, tasks, and deadlines
            </p>
            {analysisProgress !== undefined && (
              <div className="mt-3 w-full bg-dark-200 dark:bg-dark-700 rounded-full h-1.5">
                <div
                  className="bg-primary-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(analysisProgress, 100)}%` }}
                />
              </div>
            )}
          </div>
        ) : totalItems === 0 ? (
          <div className="p-6 text-center">
            <Target className="h-8 w-8 text-dark-400 mx-auto mb-2" />
            <p className="text-sm text-dark-600 dark:text-dark-400 mb-1">
              No action items detected
            </p>
            <p className="text-xs text-dark-500">
              Start typing to see suggestions
            </p>
          </div>
        ) : (
          Object.entries(groupedItems).map(([groupKey, items]) => {
            if (items.length === 0) return null;

            const isExpanded = expandedGroups.has(groupKey);
            const groupTitle = groupKey.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            const groupIcon = groupKey === 'high-confidence' ? Zap :
                            groupKey === 'medium-confidence' ? Target : AlertTriangle;
            const IconComponent = groupIcon;

            return (
              <div key={groupKey} className="border-b border-dark-200 dark:border-dark-700 last:border-b-0">
                {/* Group Header */}
                <div className="sticky top-0 bg-white dark:bg-dark-900 z-10">
                  <button
                    onClick={() => handleToggleGroup(groupKey)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={`h-4 w-4 ${
                        groupKey === 'high-confidence' ? 'text-green-500' :
                        groupKey === 'medium-confidence' ? 'text-yellow-500' : 'text-orange-500'
                      }`} />
                      <span className="text-sm font-medium text-dark-900 dark:text-white">
                        {groupTitle}
                      </span>
                      <span className="text-xs text-dark-500 bg-dark-200 dark:bg-dark-700 px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {items.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAllInGroup(items);
                          }}
                          className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 px-2 py-1 rounded"
                          title="Select all in group"
                        >
                          Select all
                        </button>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-dark-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-dark-500" />
                      )}
                    </div>
                  </button>
                </div>

                {/* Group Items */}
                {isExpanded && (
                  <div className="pb-2">
                    {items.map((item: DetectedActionItem) => (
                      <DetectedActionItemCard
                        key={item.id}
                        item={item}
                        isSelected={selectedItems.has(item.id)}
                        isCreating={creatingItems.has(item.id)}
                        onToggleSelection={handleToggleSelection}
                        onCreateItem={handleCreateItem}
                        onDismissItem={onDismissItem}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Batch Actions Footer */}
      {selectedCount > 0 && (
        <div className="flex-shrink-0 p-4 border-t border-dark-300 dark:border-dark-700 bg-dark-50 dark:bg-dark-800">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchCreate}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              Create {selectedCount}
            </button>
            <button
              onClick={handleBatchDismiss}
              className="px-3 py-2 text-dark-600 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-200 dark:hover:bg-dark-700 rounded-lg transition-colors"
              title="Dismiss selected"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Individual item card component
interface DetectedActionItemCardProps {
  item: DetectedActionItem;
  isSelected: boolean;
  isCreating: boolean;
  onToggleSelection: (itemId: string) => void;
  onCreateItem: (item: DetectedActionItem) => Promise<void>;
  onDismissItem: (itemId: string) => void;
}

function DetectedActionItemCard({
  item,
  isSelected,
  isCreating,
  onToggleSelection,
  onCreateItem,
  onDismissItem
}: DetectedActionItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const priorityColors = {
    urgent: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400',
    high: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400',
    medium: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400',
    low: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
  };

  const typeIcons = {
    todo: '📝',
    task: '✅',
    action: '⚡',
    reminder: '🔔',
    deadline: '⏰',
    development: '💻',
    follow_up: '🔄',
    assignment: '👤',
    commitment: '🤝',
    general: '📋'
  };

  return (
    <div className={`px-4 py-3 border-l-2 ${
      isSelected ? 'bg-primary-50 dark:bg-primary-900/20 border-l-primary-500' : 'border-l-transparent'
    } hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors`}>
      {/* Item Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleSelection(item.id)}
          className="mt-0.5 text-dark-400 hover:text-dark-600 dark:hover:text-dark-300"
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-primary-600" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* Title and confidence */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-medium text-dark-900 dark:text-white line-clamp-2">
              {item.suggestedTitle}
            </h4>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs text-dark-500">
                {Math.round(item.confidence * 100)}%
              </span>
              <div className={`w-2 h-2 rounded-full ${
                item.confidence >= 0.8 ? 'bg-green-500' :
                item.confidence >= 0.6 ? 'bg-yellow-500' : 'bg-orange-500'
              }`} />
            </div>
          </div>

          {/* Content preview */}
          <p className="text-xs text-dark-600 dark:text-dark-400 line-clamp-2 mb-2">
            {item.content}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs">{typeIcons[item.type]}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[item.priority]}`}>
              {item.priority}
            </span>
            {item.suggestedDueDate && (
              <div className="flex items-center gap-1 text-xs text-dark-500">
                <Clock className="h-3 w-3" />
                {new Date(item.suggestedDueDate).toLocaleDateString()}
              </div>
            )}
            {item.suggestedAssignee && (
              <div className="flex items-center gap-1 text-xs text-dark-500">
                <User className="h-3 w-3" />
                {item.suggestedAssignee}
              </div>
            )}
          </div>

          {/* Expanded details */}
          {isExpanded && item.suggestedDescription && (
            <div className="mt-2 p-2 bg-dark-100 dark:bg-dark-800 rounded text-xs text-dark-600 dark:text-dark-400">
              {item.suggestedDescription}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              {item.suggestedDescription && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  {isExpanded ? 'Less' : 'More'}
                </button>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onCreateItem(item)}
                disabled={isCreating}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {isCreating ? (
                  <Loader className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                Create
              </button>
              <button
                onClick={() => onDismissItem(item.id)}
                className="p-1 text-dark-500 hover:text-dark-700 dark:hover:text-dark-300 rounded"
                title="Dismiss"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
