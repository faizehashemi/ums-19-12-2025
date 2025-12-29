import { useUser } from '@clerk/clerk-react';
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
  const { user, isLoaded } = useUser();

  const permissions = user ? getUserPermissions(user) : null;
  const userRole = user?.publicMetadata?.role || null;

  return {
    permissions,
    role: userRole,
    isLoaded,
    canAccessModule: (moduleKey, action = 'read') => canAccessModule(user, moduleKey, action),
    canAccessRoute: (routePath, action = 'read') => canAccessRoute(user, routePath, action),
    hasRole: (roleOrRoles) => hasRole(user, roleOrRoles),
    isAdmin: () => isAdmin(user),
    canManageUsers: () => canManageUsers(user)
  };
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(roleOrRoles) {
  const { user } = useUser();
  return hasRole(user, roleOrRoles);
}

/**
 * Hook to check module access
 */
export function useCanAccessModule(moduleKey, action = 'read') {
  const { user } = useUser();
  return canAccessModule(user, moduleKey, action);
}
