export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HOTEL_OWNER: 'hotel_owner',
  FINANCE_MANAGER: 'finance_manager',
  KITCHEN_MANAGER: 'kitchen_manager',
  TRANSPORT_MANAGER: 'transport_manager',
  ACCOMMODATION_MANAGER: 'accommodation_manager',
  HR_MANAGER: 'hr_manager',
  GUEST: 'guest',
  AUDIT_ACCESS: 'audit_access',
  REPORT_VIEW_ACCESS: 'report_view_access'
};

export const MODULE_KEYS = {
  DASHBOARD: 'dashboard',
  RESERVATIONS: 'reservations',
  ACCOUNTS: 'accounts',
  MAWAID: 'mawaid',
  TRANSPORT: 'transport',
  ACCOMMODATION: 'accommodation',
  HR: 'hr',
  REPORTS: 'reports',
  SYSTEM: 'system'
};

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: {
    dashboard: { read: true, write: true },
    reservations: { read: true, write: true },
    accounts: { read: true, write: true },
    mawaid: { read: true, write: true },
    transport: { read: true, write: true },
    accommodation: { read: true, write: true },
    hr: { read: true, write: true },
    reports: { read: true, write: true },
    system: { read: true, write: true }
  },

  [ROLES.HOTEL_OWNER]: {
    dashboard: { read: true, write: true },
    reservations: { read: true, write: true },
    accounts: { read: true, write: true },
    mawaid: { read: true, write: true },
    transport: { read: true, write: true },
    accommodation: { read: true, write: true },
    hr: { read: true, write: true },
    reports: { read: true, write: true },
    system: { read: false, write: false }
  },

  [ROLES.FINANCE_MANAGER]: {
    dashboard: { read: true, write: false },
    reservations: { read: true, write: false },
    accounts: { read: true, write: true },
    mawaid: { read: false, write: false },
    transport: { read: false, write: false },
    accommodation: { read: false, write: false },
    hr: { read: false, write: false },
    reports: { read: true, write: false },
    system: { read: false, write: false }
  },

  [ROLES.KITCHEN_MANAGER]: {
    dashboard: { read: true, write: false },
    reservations: { read: true, write: false },
    accounts: { read: false, write: false },
    mawaid: { read: true, write: true },
    transport: { read: false, write: false },
    accommodation: { read: false, write: false },
    hr: { read: false, write: false },
    reports: { read: true, write: false },
    system: { read: false, write: false }
  },

  [ROLES.TRANSPORT_MANAGER]: {
    dashboard: { read: true, write: false },
    reservations: { read: true, write: false },
    accounts: { read: false, write: false },
    mawaid: { read: false, write: false },
    transport: { read: true, write: true },
    accommodation: { read: false, write: false },
    hr: { read: false, write: false },
    reports: { read: true, write: false },
    system: { read: false, write: false }
  },

  [ROLES.ACCOMMODATION_MANAGER]: {
    dashboard: { read: true, write: false },
    reservations: { read: true, write: false },
    accounts: { read: false, write: false },
    mawaid: { read: false, write: false },
    transport: { read: false, write: false },
    accommodation: { read: true, write: true },
    hr: { read: false, write: false },
    reports: { read: true, write: false },
    system: { read: false, write: false }
  },

  [ROLES.HR_MANAGER]: {
    dashboard: { read: true, write: false },
    reservations: { read: true, write: false },
    accounts: { read: false, write: false },
    mawaid: { read: false, write: false },
    transport: { read: false, write: false },
    accommodation: { read: false, write: false },
    hr: { read: true, write: true },
    reports: { read: true, write: false },
    system: { read: false, write: false }
  },

  [ROLES.GUEST]: {
    dashboard: { read: false, write: false },
    reservations: { read: false, write: false },
    accounts: { read: false, write: false },
    mawaid: { read: false, write: false },
    transport: { read: false, write: false },
    accommodation: { read: false, write: false },
    hr: { read: false, write: false },
    reports: { read: false, write: false },
    system: { read: false, write: false }
  },

  [ROLES.AUDIT_ACCESS]: {
    dashboard: { read: true, write: false },
    reservations: { read: true, write: false },
    accounts: { read: true, write: false },
    mawaid: { read: true, write: false },
    transport: { read: true, write: false },
    accommodation: { read: true, write: false },
    hr: { read: true, write: false },
    reports: { read: true, write: false },
    system: { read: true, write: false }
  },

  [ROLES.REPORT_VIEW_ACCESS]: {
    dashboard: { read: false, write: false },
    reservations: { read: false, write: false },
    accounts: { read: false, write: false },
    mawaid: { read: false, write: false },
    transport: { read: false, write: false },
    accommodation: { read: false, write: false },
    hr: { read: false, write: false },
    reports: { read: true, write: false },
    system: { read: false, write: false }
  }
};

export const ROUTE_TO_MODULE_MAP = {
  '/owner/dashboard': MODULE_KEYS.DASHBOARD,
  '/owner/reservations': MODULE_KEYS.RESERVATIONS,
  '/owner/accounts': MODULE_KEYS.ACCOUNTS,
  '/owner/mawaid': MODULE_KEYS.MAWAID,
  '/owner/transport': MODULE_KEYS.TRANSPORT,
  '/owner/accommodation': MODULE_KEYS.ACCOMMODATION,
  '/owner/hr': MODULE_KEYS.HR,
  '/owner/reports': MODULE_KEYS.REPORTS,
  '/owner/system': MODULE_KEYS.SYSTEM
};
