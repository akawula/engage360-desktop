# Engage360 Responsive Design Specification

## Overview
This document provides a comprehensive specification for implementing responsive design across the Engage360 application, targeting mobile phones, tablets, laptops, desktops, and 4K displays.

## Breakpoint Strategy

### Enhanced Tailwind Configuration
```javascript
// tailwind.config.js updates needed
{
  screens: {
    'xs': '475px',    // Large phones
    'sm': '640px',    // Small tablets
    'md': '768px',    // Tablets
    'lg': '1024px',   // Small laptops
    'xl': '1280px',   // Laptops
    '2xl': '1536px',  // Large screens
    '3xl': '1920px',  // 4K displays
    '4xl': '2560px'   // Ultra-wide 4K
  },
  extend: {
    spacing: {
      '18': '4.5rem',
      '88': '22rem',
      '128': '32rem',
    },
    fontSize: {
      // Enhanced typography scale for better readability
    },
    maxWidth: {
      '8xl': '88rem',
      '9xl': '96rem',
    },
    minHeight: {
      'screen-mobile': '100dvh',
    },
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in-out',
      'slide-in': 'slideIn 0.3s ease-out',
      'scale-in': 'scaleIn 0.2s ease-out',
    }
  },
  plugins: [
    // Custom utilities for touch interfaces and safe areas
  ]
}
```

## Component-Specific Responsive Requirements

### 1. Layout Component (`src/components/Layout.tsx`)

#### Current Issues:
- Fixed sidebar width doesn't work on mobile
- No mobile navigation pattern
- Header spacing issues on small screens

#### Mobile (xs-sm):
```jsx
// Hide sidebar completely, show mobile nav
<div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-dark-900">
  <MobileHeader />
</div>

// Overlay sidebar for mobile
{isMobileMenuOpen && (
  <div className="lg:hidden fixed inset-0 z-40">
    <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeMobileMenu} />
    <div className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-dark-900">
      <MobileSidebar />
    </div>
  </div>
)}
```

#### Tablet (md-lg):
```jsx
// Collapsible sidebar with reduced width
<div className={clsx(
  "hidden lg:flex flex-col bg-white dark:bg-dark-900",
  isCollapsed ? "w-16 md:w-20" : "w-64 md:w-72"
)}>
```

#### Desktop (xl-2xl):
```jsx
// Full sidebar with standard width
<div className={clsx(
  "hidden lg:flex flex-col bg-white dark:bg-dark-900",
  isCollapsed ? "w-24" : "w-80"
)}>
```

#### 4K (3xl-4xl):
```jsx
// Expanded sidebar with additional context
<div className={clsx(
  "hidden lg:flex flex-col bg-white dark:bg-dark-900",
  isCollapsed ? "w-28" : "w-96 3xl:w-[28rem]"
)}>
```

### 2. Modal Component (`src/components/Modal.tsx`)

#### Current Issues:
- Fixed `max-w-md` doesn't scale
- No mobile-specific layout
- Poor touch interaction

#### Responsive Implementation:
```jsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div className={clsx(
    "bg-white dark:bg-dark-900 rounded-lg w-full overflow-y-auto",
    // Mobile: Full screen modal
    "xs:max-h-[90vh] xs:max-w-full",
    // Tablet: Larger modal
    "md:max-w-2xl md:max-h-[80vh]",
    // Desktop: Standard modal
    "lg:max-w-3xl lg:max-h-[75vh]",
    // 4K: Larger modal for readability
    "3xl:max-w-4xl"
  )}>
```

### 3. Dashboard Component (`src/pages/Dashboard.tsx`)

#### Grid Responsive Patterns:
```jsx
// Quick Actions Grid
<div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 3xl:grid-cols-6 gap-4 lg:gap-6">

// Calendar Integration
<div className="grid grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3 gap-6">
```

#### Typography Scaling:
```jsx
<h1 className="text-2xl xs:text-3xl lg:text-4xl 3xl:text-5xl font-bold">
<p className="text-sm xs:text-base lg:text-lg 3xl:text-xl">
```

### 4. People Page (`src/pages/People.tsx`)

#### Grid Optimization:
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 gap-4 lg:gap-6">
```

#### Card Responsive Design:
```jsx
<div className="bg-white dark:bg-dark-900 rounded-lg shadow hover:shadow-md transition-all p-4 lg:p-6 group flex flex-col h-full">
  // Mobile: Compact layout
  <div className="flex items-start space-x-3 lg:space-x-4 mb-3 lg:mb-4">
    // Avatar sizing
    <img className="w-10 h-10 lg:w-12 lg:h-12 rounded-full" />

    // Content scaling
    <div className="flex-1 min-w-0">
      <h3 className="text-base lg:text-lg font-medium truncate">
      <p className="text-xs lg:text-sm text-dark-700 dark:text-dark-400 mt-1">
```

### 5. Action Items Page (`src/pages/ActionItems.tsx`)

#### View Mode Responsive Behavior:
```jsx
// Auto-switch to list view on mobile
const [viewMode, setViewMode] = useState<'grid' | 'list'>(
  window.innerWidth < 768 ? 'list' : 'grid'
);

// Grid responsive classes
<div className={
  viewMode === 'grid'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 gap-4 lg:gap-6'
    : 'space-y-3 lg:space-y-4'
}>
```

#### Filter Bar Responsive:
```jsx
<div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
  // Search bar
  <div className="flex-1 relative">
    <input className="w-full pl-10 pr-4 py-2 lg:py-3" />
  </div>

  // Filter buttons - horizontal scroll on mobile
  <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
```

### 6. Rich Text Editor (`src/components/RichTextEditor.tsx`)

#### Toolbar Responsive Design:
```jsx
<div className="border-b border-dark-300 dark:border-dark-700 bg-dark-100 dark:bg-dark-800 p-2 transition-colors">
  // Mobile: Collapsible toolbar
  <div className="lg:hidden mb-2">
    <button onClick={() => setToolbarExpanded(!toolbarExpanded)}>
      <Menu className="w-4 h-4" />
    </button>
  </div>

  // Responsive toolbar layout
  <div className={clsx(
    "flex gap-1 transition-all duration-200",
    // Mobile: Stack or hide some tools
    "flex-wrap lg:flex-nowrap",
    !toolbarExpanded && "lg:flex hidden lg:block"
  )}>
```

#### Editor Height Adaptation:
```jsx
<div className={clsx(
  "flex-1 bg-white dark:bg-dark-900 transition-colors overflow-hidden",
  // Mobile: Larger touch targets
  "min-h-[300px] lg:min-h-[400px] 3xl:min-h-[500px]"
)}>
```

### 7. Note Detail Page (`src/pages/NoteDetail.tsx`)

#### Layout Responsive Behavior:
```jsx
// Mobile: Stack everything vertically
// Desktop: Sidebar layout for action items
<div className="h-full flex flex-col lg:flex-row bg-dark-100 dark:bg-dark-950 relative">

  // Main content
  <div className="flex-1 flex flex-col min-w-0">

  // Action items panel - mobile: bottom sheet, desktop: sidebar
  {isActionItemsPanelOpen && (
    <div className={clsx(
      "bg-white dark:bg-dark-900 border-dark-300 dark:border-dark-800 flex-shrink-0 flex flex-col",
      // Mobile: Bottom sheet
      "lg:hidden fixed bottom-0 left-0 right-0 max-h-[50vh] border-t",
      // Desktop: Right sidebar
      "hidden lg:flex lg:w-80 lg:border-l lg:relative lg:max-h-none"
    )}>
```

## Form and Input Responsive Patterns

### Form Layout:
```jsx
<form className="space-y-4 lg:space-y-6">
  // Mobile: Full width inputs
  // Desktop: Constrained width for better UX
  <div className="w-full lg:max-w-md">
    <input className="w-full px-3 py-2 lg:py-3 text-base lg:text-sm" />
  </div>
```

### Button Sizing:
```jsx
<button className={clsx(
  "px-4 py-2 lg:px-6 lg:py-3 rounded-lg font-medium transition-all",
  // Mobile: Larger touch targets
  "min-h-[44px] lg:min-h-[40px]",
  // Text sizing
  "text-base lg:text-sm"
)}>
```

## Typography Responsive Scale

### Heading Scale:
```jsx
// H1: Page titles
"text-xl xs:text-2xl lg:text-3xl 3xl:text-4xl"

// H2: Section headers
"text-lg xs:text-xl lg:text-2xl 3xl:text-3xl"

// H3: Card titles
"text-base xs:text-lg lg:text-xl 3xl:text-2xl"

// Body text
"text-sm xs:text-base lg:text-base 3xl:text-lg"

// Small text
"text-xs xs:text-sm lg:text-sm 3xl:text-base"
```

## Touch Interface Optimizations

### Minimum Touch Targets:
- Mobile: 44px minimum (iOS/Android standard)
- Desktop: 32px minimum
- 4K: 48px minimum for comfort

### Interactive Elements:
```jsx
// Buttons
"min-h-[44px] lg:min-h-[40px] 3xl:min-h-[48px] px-4 lg:px-6"

// Icon buttons
"w-11 h-11 lg:w-10 lg:h-10 3xl:w-12 3xl:h-12"

// Form inputs
"min-h-[44px] lg:min-h-[40px] 3xl:min-h-[48px] px-3 lg:px-4"
```

## Performance Considerations

### Image Optimization:
```jsx
// Responsive images with proper sizing
<img
  className="w-8 h-8 lg:w-10 lg:h-10 3xl:w-12 3xl:h-12 rounded-full object-cover"
  loading="lazy"
  sizes="(max-width: 768px) 32px, (max-width: 1920px) 40px, 48px"
/>
```

### Conditional Rendering:
```jsx
// Hide complex components on mobile for performance
{!isMobile && <ComplexVisualization />}

// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

## Animation and Transitions

### Mobile-First Animations:
```jsx
// Reduced motion on mobile for performance
<div className={clsx(
  "transition-all duration-200",
  // Disable complex animations on mobile
  "lg:hover:scale-105 lg:hover:shadow-lg"
)}>
```

### Safe Area Handling:
```jsx
// iOS safe area support
<div className="safe-area-inset-top safe-area-inset-bottom">
```

## Testing Strategy

### Breakpoint Testing:
1. **320px**: iPhone SE (smallest)
2. **375px**: iPhone standard
3. **768px**: iPad portrait
4. **1024px**: iPad landscape / small laptop
5. **1280px**: Standard laptop
6. **1920px**: Desktop / 4K
7. **2560px**: Ultra-wide 4K

### Device Testing Priority:
1. iPhone (Safari/Chrome)
2. Android (Chrome)
3. iPad (Safari)
4. Desktop (Chrome/Firefox/Safari)
5. 4K displays

## Implementation Priority

### Phase 1: Critical Mobile Issues
1. Layout component mobile navigation
2. Modal responsiveness
3. Form touch targets
4. Basic grid layouts

### Phase 2: Enhanced Responsive Features
1. Advanced grid systems
2. Typography scaling
3. Rich text editor mobile optimization
4. Performance optimizations

### Phase 3: 4K and Polish
1. 4K display optimizations
2. Advanced animations
3. Performance fine-tuning
4. Accessibility improvements

## Accessibility Considerations

### Touch Accessibility:
- Minimum 44px touch targets
- Proper focus indicators
- Keyboard navigation support

### Visual Accessibility:
- Sufficient color contrast at all sizes
- Scalable text (up to 200% zoom)
- Clear visual hierarchy

### Screen Reader Support:
- Proper heading structure
- Descriptive labels
- ARIA attributes for complex interactions

This specification provides the foundation for implementing comprehensive responsive design across the Engage360 application. Each component should be updated following these patterns to ensure consistent behavior across all target devices and resolutions.
