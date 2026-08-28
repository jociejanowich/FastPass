import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { TasksPage } from './pages/TasksPage';
import { AssistantPage } from './pages/AssistantPage';
import { MilestonesPage } from './pages/MilestonesPage';
import { CareerPage } from './pages/CareerPage';
import { AboutMePage } from './pages/AboutMePage';
import { ManagerDashboardPage } from './pages/ManagerDashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { homePathForRole } from './navigation';
import { useAppState } from './state/appHooks';

/**
 * Employees and managers are separate experiences. The employee routes are not
 * reachable for a manager (and vice versa) — the router redirects rather than
 * showing a page that does not apply to the signed-in role.
 */
export function AppRoutes(): JSX.Element {
  const { viewer } = useAppState();

  if (viewer.role === 'manager') {
    return (
      <Routes>
        <Route path="/team" element={<ManagerDashboardPage />} />
        <Route path="*" element={<Navigate to="/team" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homePathForRole('employee')} replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/tasks" element={<TasksPage />} />
      <Route path="/assistant" element={<AssistantPage />} />
      <Route path="/milestones" element={<MilestonesPage />} />
      <Route path="/career" element={<CareerPage />} />
      <Route path="/about" element={<AboutMePage />} />
      {/* Kept so a direct link shows the "Manager access only" gate. */}
      <Route path="/team" element={<ManagerDashboardPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
