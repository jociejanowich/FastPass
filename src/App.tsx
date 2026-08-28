import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ThemeProvider } from './theme/ThemeProvider';
import { AppProvider } from './state/AppContext';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { AssistantPage } from './pages/AssistantPage';
import { MilestonesPage } from './pages/MilestonesPage';
import { CareerPage } from './pages/CareerPage';
import { AboutMePage } from './pages/AboutMePage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App(): JSX.Element {
  return (
    <ThemeProvider>
      <AppProvider>
        <a className="fp-skip-link" href="#main-content">
          Skip to main content
        </a>
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/assistant" element={<AssistantPage />} />
            <Route path="/milestones" element={<MilestonesPage />} />
            <Route path="/career" element={<CareerPage />} />
            <Route path="/about" element={<AboutMePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppShell>
      </AppProvider>
    </ThemeProvider>
  );
}
