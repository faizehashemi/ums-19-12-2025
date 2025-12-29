import { useUser } from '@clerk/clerk-react';
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
  const { isLoaded, isSignedIn, user } = useUser();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (requireAuth && !isSignedIn) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (requiredRole) {
    const userRole = user?.publicMetadata?.role;

    if (Array.isArray(requiredRole)) {
      if (!requiredRole.includes(userRole)) {
        return fallback || <Navigate to="/unauthorized" replace />;
      }
    } else if (userRole !== requiredRole) {
      return fallback || <Navigate to="/unauthorized" replace />;
    }
  }

  if (isSignedIn && user) {
    const currentPath = location.pathname;

    if (!canAccessRoute(user, currentPath)) {
      return fallback || <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
}
