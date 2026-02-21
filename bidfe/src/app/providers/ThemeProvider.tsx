import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('app-theme') as Theme;
        console.log('[Theme] Initial load - Saved theme in localStorage:', savedTheme);

        if (savedTheme) return savedTheme;

        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        console.log('[Theme] Initial load - System prefers dark:', systemPrefersDark);

        return systemPrefersDark ? 'dark' : 'light';
    });

    useEffect(() => {
        console.log(`[Theme] useEffect triggered - Applying theme: "${theme}" to <html> element`);
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        console.log(`[Theme] toggleTheme called - Current theme is: "${theme}"`);
        setTheme((prev) => {
            const nextTheme = prev === 'light' ? 'dark' : 'light';
            console.log(`[Theme] State updating to: "${nextTheme}"`);
            return nextTheme;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};