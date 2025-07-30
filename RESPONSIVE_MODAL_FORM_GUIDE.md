# Responsive Modal and Form Implementation Guide

## Overview
This guide provides detailed specifications for creating responsive modals and forms that work seamlessly across mobile, tablet, desktop, and 4K displays in the Engage360 application.

## Current Modal Issues

### Problems Identified:
1. **Fixed Width**: Current modals use `max-w-md` which doesn't scale appropriately
2. **Poor Mobile UX**: Small modals on mobile create cramped interfaces
3. **Touch Targets**: Form elements too small for comfortable mobile interaction
4. **Keyboard Handling**: No mobile keyboard optimization
5. **Viewport Issues**: No consideration for mobile viewport units or safe areas

## Responsive Modal Architecture

### Modal Size Strategy
```jsx
// Responsive modal sizing based on content type and screen size
const modalSizes = {
  // Small modals (confirmations, simple forms)
  sm: "w-full xs:max-w-md md:max-w-lg lg:max-w-xl",

  // Medium modals (standard forms, content)
  md: "w-full xs:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-4xl",

  // Large modals (complex forms, data tables)
  lg: "w-full xs:max-w-xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl 3xl:max-w-7xl",

  // Full screen on mobile, large on desktop
  responsive: "w-full h-full xs:h-auto xs:max-w-2xl md:max-w-4xl lg:max-w-5xl"
};
```

## Enhanced Modal Component

### Base Modal Implementation
```jsx
// src/components/Modal.tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
  fullScreenOnMobile?: boolean;
  preventClose?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  fullScreenOnMobile = false,
  preventClose = false
}: ModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Add padding to prevent layout shift on desktop
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventClose) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, preventClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "w-full max-w-md xs:max-w-lg md:max-w-xl",
    md: "w-full max-w-lg xs:max-w-xl md:max-w-2xl lg:max-w-3xl",
    lg: "w-full max-w-xl xs:max-w-2xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl",
    responsive: fullScreenOnMobile
      ? "w-full h-full xs:h-auto xs:max-w-2xl md:max-w-4xl lg:max-w-5xl"
      : "w-full max-w-lg xs:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl"
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-200"
        onClick={!preventClose ? onClose : undefined}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-0 xs:p-4">
        <div
          className={clsx(
            "relative bg-white dark:bg-dark-900 shadow-xl transition-all duration-200",
            // Mobile: Full screen or nearly full screen
            fullScreenOnMobile
              ? "xs:rounded-lg h-full xs:h-auto"
              : "xs:rounded-lg max-h-[95vh] xs:max-h-[90vh]",
            // Responsive sizing
            sizeClasses[size],
            // Safe area handling for mobile
            "safe-area-inset-top safe-area-inset-bottom"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 xs:p-6 border-b border-dark-200 dark:border-dark-800">
            <h2 className="text-lg xs:text-xl font-semibold text-dark-950 dark:text-white">
              {title}
            </h2>
            {!preventClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors touch-manipulation"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 xs:h-6 xs:w-6 text-dark-500 dark:text-dark-400" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(95vh-8rem)] xs:max-h-[calc(90vh-8rem)]">
            <div className="p-4 xs:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Responsive Form Components

### Form Container
```jsx
// src/components/forms/FormContainer.tsx
interface FormContainerProps {
  children: ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  className?: string;
}

export function FormContainer({ children, onSubmit, className }: FormContainerProps) {
  return (
    <form
      onSubmit={onSubmit}
      className={clsx(
        "space-y-4 xs:space-y-6",
        className
      )}
    >
      {children}
    </form>
  );
}
```

### Form Field Component
```jsx
// src/components/forms/FormField.tsx
interface FormFieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
  helpText?: string;
}

export function FormField({ label, children, error, required, helpText }: FormFieldProps) {
  return (
    <div className="space-y-1 xs:space-y-2">
      <label className="block text-sm xs:text-base font-medium text-dark-800 dark:text-dark-200">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {helpText && (
        <p className="text-xs xs:text-sm text-dark-600 dark:text-dark-400">
          {helpText}
        </p>
      )}
      {error && (
        <p className="text-xs xs:text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
```

### Input Component
```jsx
// src/components/forms/Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

export function Input({ error, icon: Icon, className, ...props }: InputProps) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-4 w-4 xs:h-5 xs:w-5 text-dark-500" />
        </div>
      )}
      <input
        className={clsx(
          // Base styles
          "w-full rounded-lg border transition-colors duration-200",
          // Mobile-first sizing
          "px-3 py-3 xs:py-2 text-base xs:text-sm",
          // Touch-friendly on mobile
          "min-h-[44px] xs:min-h-[40px]",
          // Icon spacing
          Icon && "pl-10 xs:pl-9",
          // States
          error
            ? "border-red-400 dark:border-red-600 focus:ring-red-500 focus:border-red-500"
            : "border-dark-300 dark:border-dark-700 focus:ring-primary-500 focus:border-primary-500",
          // Background
          "bg-white dark:bg-dark-800 text-dark-900 dark:text-white",
          "placeholder-dark-500 dark:placeholder-dark-400",
          // Focus styles
          "focus:ring-2 focus:ring-offset-0",
          className
        )}
        {...props}
      />
    </div>
  );
}
```

### Textarea Component
```jsx
// src/components/forms/Textarea.tsx
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  autoResize?: boolean;
}

export function Textarea({ error, autoResize, className, ...props }: TextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize functionality
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      const adjustHeight = () => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      };

      textarea.addEventListener('input', adjustHeight);
      adjustHeight(); // Initial adjustment

      return () => textarea.removeEventListener('input', adjustHeight);
    }
  }, [autoResize]);

  return (
    <textarea
      ref={textareaRef}
      className={clsx(
        // Base styles
        "w-full rounded-lg border transition-colors duration-200 resize-none",
        // Mobile-first sizing
        "px-3 py-3 xs:py-2 text-base xs:text-sm",
        // Minimum height for touch
        "min-h-[88px] xs:min-h-[80px]",
        // States
        error
          ? "border-red-400 dark:border-red-600 focus:ring-red-500 focus:border-red-500"
          : "border-dark-300 dark:border-dark-700 focus:ring-primary-500 focus:border-primary-500",
        // Background
        "bg-white dark:bg-dark-800 text-dark-900 dark:text-white",
        "placeholder-dark-500 dark:placeholder-dark-400",
        // Focus styles
        "focus:ring-2 focus:ring-offset-0",
        className
      )}
      {...props}
    />
  );
}
```

### Select Component
```jsx
// src/components/forms/Select.tsx
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export function Select({ error, options, placeholder, className, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={clsx(
          // Base styles
          "w-full rounded-lg border transition-colors duration-200 appearance-none",
          // Mobile-first sizing
          "px-3 py-3 xs:py-2 text-base xs:text-sm",
          // Touch-friendly on mobile
          "min-h-[44px] xs:min-h-[40px]",
          // Padding for dropdown arrow
          "pr-10",
          // States
          error
            ? "border-red-400 dark:border-red-600 focus:ring-red-500 focus:border-red-500"
            : "border-dark-300 dark:border-dark-700 focus:ring-primary-500 focus:border-primary-500",
          // Background
          "bg-white dark:bg-dark-800 text-dark-900 dark:text-white",
          // Focus styles
          "focus:ring-2 focus:ring-offset-0",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <ChevronDown className="h-4 w-4 xs:h-5 xs:w-5 text-dark-500" />
      </div>
    </div>
  );
}
```

### Button Component
```jsx
// src/components/forms/Button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon: Icon,
  fullWidth,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 touch-manipulation focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-3 py-2 text-sm min-h-[36px] xs:min-h-[32px]",
    md: "px-4 py-3 xs:py-2 text-base xs:text-sm min-h-[44px] xs:min-h-[40px]",
    lg: "px-6 py-4 xs:py-3 text-lg xs:text-base min-h-[52px] xs:min-h-[48px]"
  };

  const variantClasses = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-md hover:shadow-lg",
    secondary: "bg-white dark:bg-dark-800 text-dark-900 dark:text-white border border-dark-300 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-700 focus:ring-primary-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md hover:shadow-lg",
    ghost: "text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-800 focus:ring-primary-500"
  };

  return (
    <button
      className={clsx(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 xs:w-5 xs:h-5" />}
          {children}
        </div>
      )}
    </button>
  );
}
```

## Updated AddActionItemModal Example

```jsx
// src/components/AddActionItemModal.tsx (responsive version)
export default function AddActionItemModal({ isOpen, onClose, ...props }: AddActionItemModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Action Item"
      size="md"
      fullScreenOnMobile={true}
    >
      <FormContainer onSubmit={handleSubmit}>
        <FormField label="Title" required>
          <Input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter action item title"
            required
          />
        </FormField>

        <FormField label="Description">
          <Textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter action item description"
            autoResize
            rows={3}
          />
        </FormField>

        <FormField label="Priority">
          <Select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' }
            ]}
          />
        </FormField>

        <FormField label="Due Date">
          <Input
            type="datetime-local"
            name="dueDate"
            value={formData.dueDate}
            onChange={handleChange}
            icon={Calendar}
          />
        </FormField>

        <FormField label="Associated Person">
          <Select
            name="personId"
            value={formData.personId}
            onChange={handleChange}
            placeholder="Select a person"
            options={people?.people?.map(person => ({
              value: person.id,
              label: `${person.firstName} ${person.lastName}`
            })) || []}
          />
        </FormField>

        {/* Action Buttons */}
        <div className="flex flex-col xs:flex-row gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            fullWidth
            className="xs:flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            fullWidth
            className="xs:flex-1"
          >
            Create Action Item
          </Button>
        </div>
      </FormContainer>
    </Modal>
  );
}
```

## Mobile-Specific Optimizations

### Keyboard Handling
```jsx
// Handle mobile keyboard appearance
useEffect(() => {
  const handleResize = () => {
    // Adjust modal height when mobile keyboard appears
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  window.addEventListener('resize', handleResize);
  handleResize();

  return () => window.removeEventListener('resize', handleResize);
}, []);
```

### Touch Optimizations
```jsx
// Prevent zoom on input focus (iOS)
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />

// Or use font-size: 16px to prevent zoom
"text-base" // 16px base font size
```

### Safe Area Support
```css
/* CSS custom properties for safe areas */
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
}

/* Tailwind utilities */
.safe-area-inset-top {
  padding-top: env(safe-area-inset-top);
}

.safe-area-inset-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

## Testing Checklist

### Mobile Testing
- [ ] Forms are easily fillable with thumbs
- [ ] Touch targets are minimum 44px
- [ ] Keyboard doesn't obscure form fields
- [ ] Modal scrolling works smoothly
- [ ] Safe areas are respected on notched devices

### Tablet Testing
- [ ] Modals use appropriate screen real estate
- [ ] Forms work in both portrait and landscape
- [ ] Touch targets are comfortable for finger use

### Desktop Testing
- [ ] Modals don't become too wide
- [ ] Keyboard navigation works properly
- [ ] Focus management is correct
- [ ] Hover states are appropriate

### 4K Testing
- [ ] Text remains readable at large sizes
- [ ] Modals scale appropriately
- [ ] Touch targets aren't too small relative to screen

This comprehensive guide ensures that all modals and forms in the Engage360 application provide an optimal user experience across all target devices and screen sizes.
