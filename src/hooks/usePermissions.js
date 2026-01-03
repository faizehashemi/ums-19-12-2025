import { useAuth } from '../contexts/AuthContext';
import {
  getUserPermissions,
  canAccessModule,
  canAccessRoute,
  hasRole,
  isAdmin,
  canManageUsers
} from '../utils/permissions';

/**
 * Hook to get all user permissions
 */
export function usePermissions() {
  const { profile, isLoaded } = useAuth();

  const permissions = profile ? getUserPermissions(profile) : null;
  const userRole = profile?.role || null;

  return {
    permissions,
    role: userRole,
    isLoaded,
    canAccessModule: (moduleKey, action = 'read') => canAccessModule(profile, moduleKey, action),
    canAccessRoute: (routePath, action = 'read') => canAccessRoute(profile, routePath, action),
    hasRole: (roleOrRoles) => hasRole(profile, roleOrRoles),
    isAdmin: () => isAdmin(profile),
    canManageUsers: () => canManageUsers(profile)
  };
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(roleOrRoles) {
  const { profile } = useAuth();
  return hasRole(profile, roleOrRoles);
}

/**
 * Hook to check module access
 */
export function useCanAccessModule(moduleKey, action = 'read') {
  const { profile } = useAuth();
  return canAccessModule(profile, moduleKey, action);
}
