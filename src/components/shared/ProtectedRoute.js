import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';

const LEVEL_ORDER = { member: 0, trainer: 1, manager: 2 };

export default function ProtectedRoute({ children, requiredLevel = 'trainer' }) {
  const { authSession, authLoading, currentUser, preferences, storeId } = useAppContext();
  const location = useLocation();

  // Desktop app: skip all auth gates — go straight to content
  if (navigator.userAgent.includes('Electron')) return children;

  // Still checking Supabase session — show nothing while loading
  if (authLoading) return null;

  // Gate 1: Must have a Supabase auth session (email/password login)
  if (!authSession) {
    return <Navigate to="/email-login" state={{ from: location }} replace />;
  }

  // Gate 2: Must have selected a store
  if (!storeId) {
    return <Navigate to="/store-code" replace />;
  }

  // Gate 3: Must have picked a team member (PIN-based multi-member screen)
  if (preferences.authEnabled && !currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Gate 4: Access level check
  if (currentUser) {
    const userLevel = LEVEL_ORDER[currentUser.accessLevel] ?? 0;
    const required = LEVEL_ORDER[requiredLevel] ?? 0;
    if (userLevel < required) {
      return <Navigate to="/my-progress" replace />;
    }
  }

  return children;
}
