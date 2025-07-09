import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
    theme: Theme;
    actualTheme: 'light' | 'dark'; // The actual theme being applied (resolves 'auto')
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(() => {
        // Try to get theme from localStorage, default to 'light'
        const saved = localStorage.getItem('engage360-theme');
        return (saved as Theme) || 'light';
    });

    const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

    // Function to determine the actual theme based on user preference and system preference
    const determineActualTheme = (userTheme: Theme): 'light' | 'dark' => {
        if (userTheme === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return userTheme;
    };

    // Update actual theme when theme changes or system preference changes
    useEffect(() => {
        const newActualTheme = determineActualTheme(theme);
        setActualTheme(newActualTheme);

        // Apply theme to document
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newActualTheme);

        // Save theme preference
        localStorage.setItem('engage360-theme', theme);
    }, [theme]);

    // Listen for system theme changes when in auto mode
    useEffect(() => {
        if (theme === 'auto') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                const newActualTheme = determineActualTheme(theme);
                setActualTheme(newActualTheme);

                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(newActualTheme);
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    const handleSetTheme = (newTheme: Theme) => {
        setTheme(newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, actualTheme, setTheme: handleSetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}
