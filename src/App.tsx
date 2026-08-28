import { AppShell } from './components/AppShell';
import { ThemeProvider } from './theme/ThemeProvider';
import { AppProvider } from './state/AppContext';
import { AppRoutes } from './AppRoutes';

export function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AppProvider>
        <a className="fp-skip-link" href="#main-content">
          Skip to main content
        </a>
        <AppShell>
          <AppRoutes />
        </AppShell>
      </AppProvider>
    </ThemeProvider>
  );
}
