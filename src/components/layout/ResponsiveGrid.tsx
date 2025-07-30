import { ReactNode } from 'react';
import { clsx } from 'clsx';

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
    // Dense content (people, action items) - more columns on larger screens
    dense: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",

    // Standard content (dashboard cards, groups) - balanced layout
    standard: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",

    // Wide content (notes, detailed cards) - fewer columns for readability
    wide: "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",

    // List view alternative - single column
    list: "grid-cols-1"
  };

  const gridGaps = {
    tight: "gap-4",
    normal: "gap-6",
    loose: "gap-8"
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

export default ResponsiveGrid;
