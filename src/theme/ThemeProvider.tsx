import { FluentProvider, webDarkTheme, webLightTheme } from '@fluentui/react-components';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, type ThemeContextValue, type ThemeMode } from './themeContext';

const STORAGE_KEY = 'fastpass:theme';

function readStoredMode(): ThemeMode | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

function prefersDark(): boolean {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function persist(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* storage unavailable — keep the in-memory value */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }): JSX.Element {
  const [mode, setModeState] = useState<ThemeMode>(
    () => readStoredMode() ?? (prefersDark() ? 'dark' : 'light'),
  );

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    persist(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((current) => {
      const next: ThemeMode = current === 'dark' ? 'light' : 'dark';
      persist(next);
      return next;
    });
  }, []);

  useEffect(() => {
    document.documentElement.style.colorScheme = mode;
    document.body.classList.toggle('fp-theme-dark', mode === 'dark');
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, toggle, setMode }),
    [mode, toggle, setMode],
  );

  return (
    <ThemeContext.Provider value={value}>
      <FluentProvider theme={mode === 'dark' ? webDarkTheme : webLightTheme}>
        {children}
      </FluentProvider>
    </ThemeContext.Provider>
  );
}
