import { ROLE_PERMISSIONS, ROUTE_TO_MODULE_MAP } from '../config/rolePermissions';

/**
 * Get user's effective permissions (role defaults + overrides)
 * Now works with Supabase user profile structure
 */
export function getUserPermissions(profile) {
  if (!profile) return null;

  const role = profile.role;

  if (!role) return null;

  const basePermissions = ROLE_PERMISSIONS[role] || {};
  const overrides = profile.permissions || {};
  const effectivePermissions = { ...basePermissions };

  Object.keys(overrides).forEach(moduleKey => {
    if (moduleKey === 'routes') return;

    if (typeof overrides[moduleKey] === 'boolean') {
      effectivePermissions[moduleKey] = {
        read: overrides[moduleKey],
        write: overrides[moduleKey]
      };
    }
  });

  return effectivePermissions;
}

/**
 * Check if user can access a specific module
 */
export function canAccessModule(profile, moduleKey, action = 'read') {
  const permissions = getUserPermissions(profile);
  if (!permissions) return false;

  const modulePermission = permissions[moduleKey];
  if (!modulePermission) return false;

  return modulePermission[action] === true;
}

/**
 * Check if user can access a specific route
 */
export function canAccessRoute(profile, routePath, action = 'read') {
  if (!profile) return false;

  const routeOverrides = profile.permissions?.routes || {};
  if (routeOverrides.hasOwnProperty(routePath)) {
    return routeOverrides[routePath] === true;
  }

  const moduleKey = getModuleFromRoute(routePath);
  if (!moduleKey) return false;

  return canAccessModule(profile, moduleKey, action);
}

/**
 * Get module key from route path
 */
export function getModuleFromRoute(routePath) {
  const sortedRoutes = Object.keys(ROUTE_TO_MODULE_MAP).sort((a, b) => b.length - a.length);

  for (const route of sortedRoutes) {
    if (routePath.startsWith(route)) {
      return ROUTE_TO_MODULE_MAP[route];
    }
  }

  return null;
}

/**
 * Check if user has a specific role
 */
export function hasRole(profile, roleOrRoles) {
  if (!profile) return false;

  const userRole = profile.role;
  if (!userRole) return false;

  if (Array.isArray(roleOrRoles)) {
    return roleOrRoles.includes(userRole);
  }

  return userRole === roleOrRoles;
}

/**
 * Check if user is admin (super_admin or hotel_owner)
 */
export function isAdmin(profile) {
  return hasRole(profile, ['super_admin', 'hotel_owner']);
}

/**
 * Check if user can manage other users
 */
export function canManageUsers(profile) {
  return hasRole(profile, 'super_admin');
}
