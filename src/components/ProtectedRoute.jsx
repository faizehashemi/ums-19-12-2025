import { useAuth } from '../contexts/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { canAccessRoute } from '../utils/permissions';

/**
 * Wraps routes that require authentication and specific permissions
 */
export default function ProtectedRoute({
  children,
  requireAuth = true,
  requiredRole = null,
  redirectTo = '/',
  fallback = null
}) {
  const { isLoaded, isAuthenticated, profile } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // A user is authenticated but has no profile.
  // Redirect them to complete their profile information.
  // This is a critical step to ensure data integrity and proper authorization.
  // We also check if the user is already on the information page, to prevent a redirect loop
  if (
    isAuthenticated &&
    !profile &&
    location.pathname !== '/information'
  ) {
    return <Navigate to="/information" state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const userRole = profile?.role;

    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(userRole)) {
        return fallback || <Navigate to="/unauthorized" replace />;
      }
    } else if (userRole !== requiredRole) {
      return fallback || <Navigate to="/unauthorized" replace />;
    }
  }

  if (isAuthenticated && profile) {
    const currentPath = location.pathname;

    if (!canAccessRoute(profile, currentPath)) {
      return fallback || <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
