import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import NavBar from './components/layout/NavBar';
import ProtectedRoute from './components/shared/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import MatrixPage from './pages/MatrixPage';
import TraineesPage from './pages/TraineesPage';
import PositionsPage from './pages/PositionsPage';
import TrainersPage from './pages/TrainersPage';
import PathsPage from './pages/PathsPage';
import PlannerPage from './pages/PlannerPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import OnboardingPage from './pages/OnboardingPage';
import TemplatesPage from './pages/TemplatesPage';
import LoginPage from './pages/LoginPage';
import EmailLoginPage from './pages/EmailLoginPage';
import StoreCodePage from './pages/StoreCodePage';
import CheckInPage from './pages/CheckInPage';
import MyProgressPage from './pages/MyProgressPage';

function AppShell() {
  return (
    <div className="appLayout">
      <NavBar />
      <main className="appMain">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard"   element={<ProtectedRoute requiredLevel="trainer"><DashboardPage /></ProtectedRoute>} />
          <Route path="/analytics"   element={<ProtectedRoute requiredLevel="trainer"><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/matrix"      element={<ProtectedRoute requiredLevel="trainer"><MatrixPage /></ProtectedRoute>} />
          <Route path="/trainees"    element={<ProtectedRoute requiredLevel="trainer"><TraineesPage /></ProtectedRoute>} />
          <Route path="/trainers"    element={<ProtectedRoute requiredLevel="trainer"><TrainersPage /></ProtectedRoute>} />
          <Route path="/paths"       element={<ProtectedRoute requiredLevel="trainer"><PathsPage /></ProtectedRoute>} />
          <Route path="/planner"     element={<ProtectedRoute requiredLevel="trainer"><PlannerPage /></ProtectedRoute>} />
          <Route path="/onboarding"  element={<ProtectedRoute requiredLevel="trainer"><OnboardingPage /></ProtectedRoute>} />
          <Route path="/positions"   element={<ProtectedRoute requiredLevel="manager"><PositionsPage /></ProtectedRoute>} />
          <Route path="/templates"   element={<ProtectedRoute requiredLevel="manager"><TemplatesPage /></ProtectedRoute>} />
          <Route path="/settings"    element={<ProtectedRoute requiredLevel="manager"><SettingsPage /></ProtectedRoute>} />
          <Route path="/my-progress" element={<ProtectedRoute requiredLevel="member"><MyProgressPage /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public routes — no NavBar */}
      <Route path="/email-login" element={<EmailLoginPage />} />
      <Route path="/store-code"  element={<StoreCodePage />} />
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/checkin"     element={<CheckInPage />} />

      {/* App shell — all other routes with NavBar */}
      <Route path="/*" element={<AppShell />} />
    </Routes>
  );
}

export default App;
