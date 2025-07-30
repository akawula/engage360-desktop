import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

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
