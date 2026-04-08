'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  /** The stored preference ('light' | 'dark' | 'system') */
  theme: Theme;
  /** The actual rendered theme after resolving 'system' */
  resolvedTheme: ResolvedTheme;
  /** Whether dark mode is active */
  isDark: boolean;
  /** Set an explicit preference */
  setTheme: (theme: Theme) => void;
  /** Cycle: light → dark → system → light */
  cycleTheme: () => void;
  /** Toggle between light and dark (skips system) */
  toggleTheme: () => void;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const STORAGE_KEY = 'pdf-chat-theme';
const THEME_CYCLE: Theme[] = ['light', 'dark', 'system'];

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? getSystemTheme() : theme;
}

function getSavedTheme(): Theme {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved && THEME_CYCLE.includes(saved)) return saved;
  } catch {
    // localStorage blocked (privacy mode etc.)
  }
  return 'system';
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;

  // Add a short transition guard so the colour change is smooth
  root.style.setProperty('--theme-transition', '200ms');

  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Clean up the transition guard after it fires
  const timer = setTimeout(() => {
    root.style.removeProperty('--theme-transition');
  }, 250);

  return () => clearTimeout(timer);
}

// ─────────────────────────────────────────────
// Inline script — inject before first paint
// Prevents flash of wrong theme (FOFT)
// ─────────────────────────────────────────────

export const ThemeScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        (function() {
          try {
            var stored = localStorage.getItem('${STORAGE_KEY}');
            var theme = (stored === 'dark' || stored === 'light') ? stored
              : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
            if (theme === 'dark') document.documentElement.classList.add('dark');
          } catch(e) {}
        })();
      `,
    }}
  />
);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
  /** Default preference when nothing is stored */
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark');
  const [mounted, setMounted] = useState(false);

  // Hydrate from storage after mount (avoids SSR mismatch)
  useEffect(() => {
    const saved = getSavedTheme();
    setThemeState(saved);
    const resolved = resolveTheme(saved);
    setResolvedTheme(resolved);
    applyTheme(resolved);
    setMounted(true);
  }, []);

  // Watch for OS-level preference changes when theme === 'system'
  useEffect(() => {
    if (!mounted) return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const handler = () => {
      if (theme === 'system') {
        const resolved = getSystemTheme();
        setResolvedTheme(resolved);
        applyTheme(resolved);
      }
    };

    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, mounted]);

  // Persist and apply whenever theme changes
  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      const resolved = resolveTheme(next);
      setResolvedTheme(resolved);
      applyTheme(resolved);
    },
    []
  );

  const cycleTheme = useCallback(() => {
    const idx = THEME_CYCLE.indexOf(theme);
    const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
    setTheme(next);
  }, [theme, setTheme]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [resolvedTheme, setTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      isDark: resolvedTheme === 'dark',
      setTheme,
      cycleTheme,
      toggleTheme,
    }),
    [theme, resolvedTheme, setTheme, cycleTheme, toggleTheme]
  );

  // Render children even before mount so layout isn't blocked.
  // The ThemeScript handles FOFT; visibility is fine.
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}

// ─────────────────────────────────────────────
// Convenience re-export
// ─────────────────────────────────────────────

export type { Theme, ResolvedTheme, ThemeContextValue };