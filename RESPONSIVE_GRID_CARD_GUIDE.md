# Responsive Grid and Card Component Guide

## Overview
This guide provides detailed specifications for creating responsive grid layouts and card components that adapt seamlessly across mobile, tablet, desktop, and 4K displays in the Engage360 application.

## Current Grid Issues Analysis

### Problems Identified:
1. **Fixed Grid Columns**: Current grids use basic responsive classes without considering content density
2. **Card Sizing**: Cards don't optimize their internal layout for different screen sizes
3. **Content Overflow**: Text and images don't handle responsive scaling properly
4. **Touch Targets**: Interactive elements within cards are too small on mobile
5. **4K Optimization**: No consideration for ultra-high resolution displays

## Responsive Grid Strategy

### Grid Breakpoint System
```jsx
// Responsive grid patterns for different content types
const gridPatterns = {
  // Dense content (people, action items)
  dense: "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8",

  // Standard content (dashboard cards, groups)
  standard: "grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6",

  // Wide content (notes, detailed cards)
  wide: "grid-cols-1 xs:grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-4",

  // List view alternative
  list: "grid-cols-1"
};

// Gap sizing for different screen sizes
const gridGaps = {
  tight: "gap-3 md:gap-4 lg:gap-5 xl:gap-6",
  normal: "gap-4 md:gap-5 lg:gap-6 xl:gap-8",
  loose: "gap-6 md:gap-8 lg:gap-10 xl:gap-12"
};
```

## Responsive Grid Component

### Base Grid Container
```jsx
// src/components/layout/ResponsiveGrid.tsx
interface ResponsiveGridProps {
  children: ReactNode;
  pattern?: 'dense' | 'standard' | 'wide' | 'list';
  gap?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export function ResponsiveGrid({
  children,
  pattern = 'standard',
  gap = 'normal',
  className
}: ResponsiveGridProps) {
  const gridPatterns = {
    dense: "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 3xl:grid-cols-7 4xl:grid-cols-8",
    standard: "grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6",
    wide: "grid-cols-1 xs:grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-4",
    list: "grid-cols-1"
  };

  const gridGaps = {
    tight: "gap-3 md:gap-4 lg:gap-5 xl:gap-6",
    normal: "gap-4 md:gap-5 lg:gap-6 xl:gap-8",
    loose: "gap-6 md:gap-8 lg:gap-10 xl:gap-12"
  };

  return (
    <div className={clsx(
      "grid",
      gridPatterns[pattern],
      gridGaps[gap],
      className
    )}>
      {children}
    </div>
  );
}
```

## Responsive Card Components

### Base Card Component
```jsx
// src/components/cards/Card.tsx
interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  size?: 'compact' | 'standard' | 'large';
  className?: string;
  onClick?: () => void;
  href?: string;
}

export function Card({
  children,
  variant = 'default',
  size = 'standard',
  className,
  onClick,
  href
}: CardProps) {
  const baseClasses = "rounded-lg transition-all duration-200 overflow-hidden";

  const variantClasses = {
    default: "bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-800",
    elevated: "bg-white dark:bg-dark-900 shadow-md hover:shadow-lg border border-dark-200 dark:border-dark-800",
    outlined: "bg-transparent border-2 border-dark-300 dark:border-dark-700",
    interactive: "bg-white dark:bg-dark-900 border border-dark-200 dark:border-dark-800 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 cursor-pointer"
  };

  const sizeClasses = {
    compact: "p-3 xs:p-4",
    standard: "p-4 xs:p-5 lg:p-6",
    large: "p-6 xs:p-7 lg:p-8"
  };

  const Component = href ? Link : 'div';
  const props = href ? { to: href } : onClick ? { onClick } : {};

  return (
    <Component
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
```

### Person Card Component
```jsx
// src/components/cards/PersonCard.tsx
interface PersonCardProps {
  person: Person;
  showEngagement?: boolean;
  showGrowthProgress?: boolean;
  compact?: boolean;
}

export function PersonCard({
  person,
  showEngagement = true,
  showGrowthProgress = true,
  compact = false
}: PersonCardProps) {
  return (
    <Card
      variant="interactive"
      size={compact ? "compact" : "standard"}
      href={`/people/${person.id}`}
      className="h-full flex flex-col"
    >
      {/* Header Section */}
      <div className="flex items-start gap-3 xs:gap-4 mb-3 xs:mb-4">
        <div className="flex-shrink-0">
          {formatAvatarSrc(person.avatarUrl || person.avatar) ? (
            <img
              src={formatAvatarSrc(person.avatarUrl || person.avatar)!}
              alt={`${person.firstName} ${person.lastName}`}
              className="w-10 h-10 xs:w-12 xs:h-12 lg:w-14 lg:h-14 rounded-full object-cover ring-2 ring-dark-200 dark:ring-dark-700"
            />
          ) : (
            <div className="w-10 h-10 xs:w-12 xs:h-12 lg:w-14 lg:h-14 bg-primary-600 rounded-full flex items-center justify-center ring-2 ring-dark-200 dark:ring-dark-700">
              <span className="text-white font-medium text-sm xs:text-base lg:text-lg">
                {person.firstName[0]}{person.lastName[0]}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm xs:text-base lg:text-lg font-semibold text-dark-950 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {person.firstName} {person.lastName}
          </h3>

          {person.position && (
            <p className="text-xs xs:text-sm lg:text-base text-dark-700 dark:text-dark-400 mt-1 line-clamp-2">
              {person.position}
            </p>
          )}
        </div>
      </div>

      {/* Contact Information */}
      <div className="flex-1 space-y-2 mb-4">
        {person.email && (
          <div className="flex items-center text-xs xs:text-sm text-dark-600 dark:text-dark-500">
            <Mail className="w-3 h-3 xs:w-4 xs:h-4 mr-2 flex-shrink-0" />
            <span className="truncate">{person.email}</span>
          </div>
        )}

        {person.phone && (
          <div className="flex items-center text-xs xs:text-sm text-dark-600 dark:text-dark-500">
            <Phone className="w-3 h-3 xs:w-4 xs:h-4 mr-2 flex-shrink-0" />
            <span>{person.phone}</span>
          </div>
        )}

        {person.githubUsername && (
          <div className="flex items-center text-xs xs:text-sm text-dark-600 dark:text-dark-500">
            <Github className="w-3 h-3 xs:w-4 xs:h-4 mr-2 flex-shrink-0" />
            <span>@{person.githubUsername}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {person.tags && person.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 xs:gap-2 mb-4">
          {person.tags.slice(0, compact ? 2 : 3).map(tag => (
            <span
              key={tag}
              className="inline-block px-2 py-1 text-xs bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-300 rounded-full"
            >
              {tag}
            </span>
          ))}
          {person.tags.length > (compact ? 2 : 3) && (
            <span className="inline-block px-2 py-1 text-xs bg-dark-100 dark:bg-dark-800 text-dark-700 dark:text-dark-300 rounded-full">
              +{person.tags.length - (compact ? 2 : 3)}
            </span>
          )}
        </div>
      )}

      {/* Footer Section */}
      <div className="mt-auto pt-3 xs:pt-4 border-t border-dark-200 dark:border-dark-800 space-y-3">
        {/* Growth Progress */}
        {showGrowthProgress && (
          <GrowthProgress personId={person.id} compact={compact} />
        )}

        {/* Engagement Score and Last Interaction */}
        {showEngagement && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs xs:text-sm text-dark-600 dark:text-dark-500">
                Engagement:
              </span>
              <span className={`text-xs xs:text-sm font-medium px-2 py-1 rounded ${getEngagementColor(person.engagementScore || 0)}`}>
                {person.engagementScore}%
              </span>
            </div>
            {person.lastInteraction && (
              <span className="text-xs text-dark-500">
                Last: {format(new Date(person.lastInteraction), 'MMM d')}
              </span>
            )}
          </div>
        )}

        {/* Activity Counts */}
        <div className="flex items-center gap-3 xs:gap-4 text-xs text-dark-600 dark:text-dark-500">
          <span>{person.counts?.notes || 0} notes</span>
          <span>{person.counts?.achievements || 0} achievements</span>
          <span>{person.counts?.actions || 0} actions</span>
        </div>
      </div>
    </Card>
  );
}
```

### Action Item Card Component
```jsx
// src/components/cards/ActionItemCard.tsx
interface ActionItemCardProps {
  actionItem: ActionItem;
  viewMode?: 'grid' | 'list';
  showAssignee?: boolean;
  showPerson?: boolean;
  onStatusChange?: (id: string, status: string) => void;
  onEdit?: (item: ActionItem) => void;
  onDelete?: (item: ActionItem) => void;
}

export function ActionItemCard({
  actionItem,
  viewMode = 'grid',
  showAssignee = true,
  showPerson = true,
  onStatusChange,
  onEdit,
  onDelete
}: ActionItemCardProps) {
  const StatusIcon = getStatusIcon(actionItem.status);
  const PriorityIcon = getPriorityIcon(actionItem.priority);
  const dueDateText = getDueDateText(actionItem.dueDate);
  const isItemOverdue = isOverdue(actionItem.dueDate);

  if (viewMode === 'list') {
    return (
      <Card variant="interactive" size="compact" className="hover:shadow-md">
        <div className="flex items-center gap-3 xs:gap-4">
          {/* Status Icon */}
          <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <StatusIcon className="h-5 w-5 xs:h-6 xs:w-6 text-primary-600 dark:text-primary-400" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm xs:text-base text-dark-950 dark:text-white truncate">
                {actionItem.title}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(actionItem.status)}`}>
                {actionItem.status.replace('_', ' ')}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(actionItem.priority)}`}>
                <PriorityIcon className="h-3 w-3 mr-1" />
                {actionItem.priority}
              </span>
            </div>

            {actionItem.description && (
              <p className="text-xs xs:text-sm text-dark-700 dark:text-dark-400 line-clamp-1 mb-2">
                {actionItem.description}
              </p>
            )}

            <div className="flex items-center gap-3 xs:gap-4 text-xs text-dark-600 dark:text-dark-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {getRelativeTime(actionItem.updatedAt)}
              </span>

              {dueDateText && (
                <span className={`flex items-center gap-1 ${isItemOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
                  <Calendar className="h-3 w-3" />
                  {dueDateText}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <ActionButtons
              item={actionItem}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              size="sm"
            />
          </div>
        </div>
      </Card>
    );
  }

  // Grid view
  return (
    <Card
      variant="interactive"
      size="standard"
      className={clsx(
        "h-full flex flex-col",
        isItemOverdue && "ring-2 ring-red-400 dark:ring-red-500"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 xs:w-12 xs:h-12 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center">
            <StatusIcon className="h-5 w-5 xs:h-6 xs:w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex flex-col gap-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(actionItem.status)}`}>
              {actionItem.status.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(actionItem.priority)}`}>
              <PriorityIcon className="h-3 w-3 mr-1" />
              {actionItem.priority}
            </span>
          </div>
        </div>

        {showAssignee && actionItem.assignee && (
          <div className="flex items-center gap-1">
            <img
              src={actionItem.assignee.avatarUrl || '/default-avatar.png'}
              alt={actionItem.assignee.name}
              className="w-6 h-6 xs:w-8 xs:h-8 rounded-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 mb-4">
        <h3 className="font-semibold text-sm xs:text-base lg:text-lg text-dark-950 dark:text-white mb-2 line-clamp-2">
          {actionItem.title}
        </h3>
        {actionItem.description && (
          <p className="text-xs xs:text-sm text-dark-700 dark:text-dark-400 line-clamp-3">
            {actionItem.description}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-between text-xs text-dark-600 dark:text-dark-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {getRelativeTime(actionItem.updatedAt)}
          </span>
          {dueDateText && (
            <span className={`flex items-center gap-1 font-medium ${isItemOverdue ? 'text-red-600 dark:text-red-400' : ''}`}>
              <Calendar className="h-3 w-3" />
              {dueDateText}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-dark-200 dark:border-dark-800">
          <ActionButtons
            item={actionItem}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </Card>
  );
}
```

### Dashboard Card Component
```jsx
// src/components/cards/DashboardCard.tsx
interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  href: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

export function DashboardCard({
  title,
  description,
  icon: Icon,
  count,
  href,
  color = 'blue'
}: DashboardCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300",
    green: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
    purple: "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300",
    orange: "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300",
    red: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
  };

  return (
    <Card
      variant="interactive"
      size="standard"
      href={href}
      className="group h-full"
    >
      <div className="flex items-center gap-4 mb-4">
        <div className={clsx(
          "p-3 xs:p-4 rounded-lg",
          colorClasses[color]
        )}>
          <Icon className="w-6 h-6 xs:w-7 xs:h-7 lg:w-8 lg:h-8" />
        </div>
        <div className="flex-1">
          <h3 className="text-base xs:text-lg lg:text-xl font-semibold text-dark-950 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {title}
          </h3>
          {count !== undefined && (
            <p className="text-sm xs:text-base text-dark-600 dark:text-dark-400 mt-1">
              {count} {count === 1 ? title.slice(0, -1).toLowerCase() : title.toLowerCase()}
            </p>
          )}
        </div>
      </div>

      <p className="text-sm xs:text-base text-dark-600 dark:text-dark-400 leading-relaxed">
        {description}
      </p>
    </Card>
  );
}
```

## Responsive List Components

### List Container
```jsx
// src/components/layout/ResponsiveList.tsx
interface ResponsiveListProps {
  children: ReactNode;
  spacing?: 'tight' | 'normal' | 'loose';
  className?: string;
}

export function ResponsiveList({ children, spacing = 'normal', className }: ResponsiveListProps) {
  const spacingClasses = {
    tight: "space-y-2 xs:space-y-3",
    normal: "space-y-3 xs:space-y-4 lg:space-y-5",
    loose: "space-y-4 xs:space-y-6 lg:space-y-8"
  };

  return (
    <div className={clsx(spacingClasses[spacing], className)}>
      {children}
    </div>
  );
}
```

## Updated Page Implementations

### People Page with Responsive Grid
```jsx
// src/pages/People.tsx (updated grid section)
<ResponsiveGrid pattern="dense" gap="normal">
  {filteredPeople.map((person) => (
    <PersonCard
      key={person.id}
      person={person}
      showEngagement={true}
      showGrowthProgress={true}
    />
  ))}
</ResponsiveGrid>
```

### Action Items Page with View Toggle
```jsx
// src/pages/ActionItems.tsx (updated grid/list section)
{viewMode === 'grid' ? (
  <ResponsiveGrid pattern="standard" gap="normal">
    {displayedItems.map((item) => (
      <ActionItemCard
        key={item.id}
        actionItem={item}
        viewMode="grid"
        onStatusChange={handleStatusChange}
        onEdit={setEditingItem}
        onDelete={handleDeleteItem}
      />
    ))}
  </ResponsiveGrid>
) : (
  <ResponsiveList spacing="normal">
    {displayedItems.map((item) => (
      <ActionItemCard
        key={item.id}
        actionItem={item}
        viewMode="list"
        onStatusChange={handleStatusChange}
        onEdit={setEditingItem}
        onDelete={handleDeleteItem}
      />
    ))}
  </ResponsiveList>
)}
```

### Dashboard with Responsive Cards
```jsx
// src/pages/Dashboard.tsx (updated quick actions)
<ResponsiveGrid pattern="standard" gap="normal">
  <DashboardCard
    title="People"
    description="Manage your professional network and connections"
    icon={Users}
    count={peopleData?.people?.length || 0}
    href="/people"
    color="blue"
  />
  <DashboardCard
    title="Groups"
    description="Organize teams, projects, and communities"
    icon={Building2}
    count={groupsResponse?.success && groupsResponse?.data?.length || 0}
    href="/groups"
    color="green"
  />
  <DashboardCard
    title="Notes"
    description="Capture conversations and insights"
    icon={FileText}
    count={notesData?.pagination?.total || 0}
    href="/notes"
    color="purple"
  />
  <DashboardCard
    title="Tasks"
    description="Track follow-ups and reminders"
    icon={CheckSquare}
    count={actionItemsData?.active || 0}
    href="/action-items"
    color="orange"
  />
</ResponsiveGrid>
```

## Performance Optimizations

### Virtual Scrolling for Large Lists
```jsx
// For pages with many items, implement virtual scrolling
import { FixedSizeGrid as Grid } from 'react-window';

const VirtualizedGrid = ({ items, itemHeight = 300 }) => {
  const columnCount = useResponsiveColumns();

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={300}
      height={600}
      rowCount={Math.ceil(items.length / columnCount)}
      rowHeight={itemHeight}
      itemData={items}
    >
      {({ columnIndex, rowIndex, style, data }) => (
        <div style={style}>
          <PersonCard person={data[rowIndex * columnCount + columnIndex]} />
        </div>
      )}
    </Grid>
  );
};
```

### Image Loading Optimization
```jsx
// Responsive image loading with proper sizing
<img
  src={person.avatarUrl}
  alt={`${person.firstName} ${person.lastName}`}
  className="w-10 h-10 xs:w-12 xs:h-12 lg:w-14 lg:h-14 rounded-full object-cover"
  loading="lazy"
  sizes="(max-width: 475px) 40px, (max-width: 1024px) 48px, 56px"
  srcSet={`
    ${person.avatarUrl}?w=40 40w,
    ${person.avatarUrl}?w=48 48w,
    ${person.avatarUrl}?w=56 56w,
    ${person.avatarUrl}?w=80 80w
  `}
/>
```

## Testing Strategy

### Responsive Testing Checklist
- [ ] Grid layouts adapt properly at all breakpoints
- [ ] Cards maintain readability and usability
- [ ] Touch targets are appropriate for each screen size
- [ ] Content doesn't overflow or get cut off
- [ ] Images scale appropriately
- [ ] Performance remains smooth with many items
- [ ] Accessibility is maintained across all layouts

### Device-Specific Testing
1. **Mobile (320-767px)**: Single column, large touch targets
2. **Tablet (768-1023px)**: 2-3 columns, medium sizing
3. **Desktop (1024-1535px)**: 3-4 columns, standard sizing
4. **Large Desktop (1536-1919px)**: 4-5 columns, comfortable spacing
5. **4K (1920px+)**: 5-8 columns, optimized for high density

This comprehensive guide ensures that all grid layouts and card components in the Engage360 application provide optimal user experience across all target devices and screen sizes.
