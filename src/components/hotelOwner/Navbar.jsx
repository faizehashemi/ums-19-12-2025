import { useState, useMemo } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { UserButton } from '@clerk/clerk-react'
import { usePermissions } from '../../hooks/usePermissions'
import { MODULE_KEYS } from '../../config/rolePermissions'

const Navbar = () => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);
  const { canAccessModule, isLoaded } = usePermissions();

  // Full nav tree (must match Sidebar.jsx)
  const nav = useMemo(
    () => [
      { key: "dashboard", title: "Dashboard", path: "/owner/dashboard", icon: assets.dashboardIcon },

      {
        key: "reservations",
        title: "Reservations",
        icon: assets.reservationIcon,
        children: [
          { key: "res-pending", title: "Pending", path: "/owner/reservations/pending" },
          { key: "res-approved", title: "Approved", path: "/owner/reservations/approved" },
          {
            key: "res-create",
            title: "Create Reservations",
            children: [
              { key: "res-create-tour", title: "Tour Operator", path: "/owner/reservations/create/tour-operator" },
              { key: "res-create-ind", title: "Individuals", path: "/owner/reservations/create/individuals" }
            ]
          }
        ]
      },

      {
        key: "accounts",
        title: "Accounts",
        icon: assets.accountsIcon,
        children: [
          { key: "acc-lawazim", title: "Lawazim Collection", path: "/owner/accounts/lawazim-collection" },
          { key: "acc-niyaz", title: "Niyaz Collection", path: "/owner/accounts/niyaz-collection" },
          { key: "acc-cash", title: "Cash Submission", path: "/owner/accounts/cash-submission" },
          { key: "acc-salaries", title: "Salaries", path: "/owner/accounts/salaries" },
          {
            key: "acc-expenses",
            title: "Expenses",
            children: [
              { key: "acc-exp-transport", title: "Transport", path: "/owner/accounts/expenses/transport" },
              { key: "acc-exp-maintenance", title: "Maintenance", path: "/owner/accounts/expenses/maintenance" },
              { key: "acc-exp-mawaid", title: "Mawaid", path: "/owner/accounts/expenses/mawaid" },
              { key: "acc-exp-other", title: "Other", path: "/owner/accounts/expenses/other" }
            ]
          }
        ]
      },

      {
        key: "mawaid",
        title: "Mawaid",
        icon: assets.utensilsIcon,
        children: [
          { key: "mawaid-thal", title: "Thal Counts", path: "/owner/mawaid/thal-counts" },
          { key: "mawaid-recipes", title: "Make Recipes", path: "/owner/mawaid/make-recipes" },
          { key: "mawaid-menu", title: "Menu Planning", path: "/owner/mawaid/menu-planning" },
          { key: "mawaid-ops", title: "Kitchen Operations", path: "/owner/mawaid/kitchen-operations" },
          { key: "mawaid-dining", title: "Dining Hall", path: "/owner/mawaid/dining-hall" },
          { key: "mawaid-supply", title: "Supply Chain", path: "/owner/mawaid/supply-chain" },
          { key: "mawaid-inv", title: "Inventory", path: "/owner/mawaid/inventory" },
          { key: "mawaid-vendors", title: "Vendors", path: "/owner/mawaid/vendors" },
          { key: "mawaid-reports", title: "Reports", path: "/owner/mawaid/reports" }
        ]
      },

      {
        key: "transport",
        title: "Transport",
        icon: assets.busIcon,
        children: [
          { key: "tr-roster", title: "Roster", path: "/owner/transport/roster" },
          {
            key: "tr-journeys",
            title: "Journeys",
            children: [
              { key: "tr-istiqbal", title: "Istiqbal", path: "/owner/transport/journeys/istiqbal" },
              { key: "tr-salawaat", title: "Salawaat", path: "/owner/transport/journeys/salawaat" },
              { key: "tr-madina", title: "Madina", path: "/owner/transport/journeys/madina" },
              { key: "tr-ziyarah", title: "Ziyarah", path: "/owner/transport/journeys/ziyarah" }
            ]
          },
          { key: "tr-vehicle", title: "Vehicle Maintenance", path: "/owner/transport/vehicle-maintenance" },
          { key: "tr-drivers", title: "Driver Management", path: "/owner/transport/driver-management" }
        ]
      },

      {
        key: "accommodation",
        title: "Accommodation",
        icon: assets.bedIcon,
        children: [
          { key: "ac-housekeeping", title: "Housekeeping", path: "/owner/accommodation/housekeeping" },
          { key: "ac-maint", title: "Maintenance", path: "/owner/accommodation/maintenance" },
          { key: "ac-alloc", title: "Allocation", path: "/owner/accommodation/allocation" },
          { key: "ac-check", title: "Check-ins & Check-outs", path: "/owner/accommodation/checkins-checkouts" },
          { key: "ac-grid", title: "Grid Layout", path: "/owner/accommodation/grid-layout" },
          { key: "ac-vacancy", title: "Vacancy Forecast", path: "/owner/accommodation/vacancy-forecast" }
        ]
      },

      {
        key: "hr",
        title: "Human Resources",
        icon: assets.hrIcon,
        children: [
          { key: "hr-staff", title: "Staff Directory", path: "/owner/hr/staff-directory" },
          { key: "hr-scheduling", title: "Scheduling", path: "/owner/hr/scheduling" },
          { key: "hr-leave", title: "Leave Management", path: "/owner/hr/leave-management" },
          { key: "hr-training", title: "Training", path: "/owner/hr/training" }
        ]
      },

      {
        key: "reports",
        title: "Reports",
        icon: assets.reportsIcon,
        children: [
          { key: "rep-res", title: "Reservations", path: "/owner/reports/reservations" },
          { key: "rep-acc", title: "Accounts", path: "/owner/reports/accounts" },
          { key: "rep-tr", title: "Transport", path: "/owner/reports/transport" },
          { key: "rep-mawaid", title: "Mawaid", path: "/owner/reports/mawaid" },
          { key: "rep-accom", title: "Accommodation", path: "/owner/reports/accommodation" },
          { key: "rep-fakkul", title: "Fakkul Ehraam", path: "/owner/reports/fakkul-ehraam" },
          { key: "rep-legal", title: "Legal", path: "/owner/reports/legal" },
          { key: "rep-hr", title: "Human Resources", path: "/owner/reports/human-resources" }
        ]
      },

      {
        key: "system",
        title: "System",
        icon: assets.settingsIcon,
        children: [
          { key: "sys-users", title: "Users & Roles", path: "/owner/system/users-roles" },
          { key: "sys-settings", title: "Settings", path: "/owner/system/settings" }
        ]
      }
    ],
    []
  );

  // Helper function to map nav keys to module keys
  const getModuleKeyFromNavKey = (navKey) => {
    const mapping = {
      'dashboard': MODULE_KEYS.DASHBOARD,
      'reservations': MODULE_KEYS.RESERVATIONS,
      'accounts': MODULE_KEYS.ACCOUNTS,
      'mawaid': MODULE_KEYS.MAWAID,
      'transport': MODULE_KEYS.TRANSPORT,
      'accommodation': MODULE_KEYS.ACCOMMODATION,
      'hr': MODULE_KEYS.HR,
      'reports': MODULE_KEYS.REPORTS,
      'system': MODULE_KEYS.SYSTEM
    };
    return mapping[navKey];
  };

  // Filter nav items based on permissions
  const filteredNav = useMemo(() => {
    if (!isLoaded) return [];

    return nav.filter(item => {
      const moduleKey = getModuleKeyFromNavKey(item.key);
      if (!moduleKey) return true;
      return canAccessModule(moduleKey, 'read');
    });
  }, [nav, canAccessModule, isLoaded]);

  // Determine active section based on current path
  const getActiveSection = () => {
    const path = location.pathname;
    for (const item of filteredNav) {
      if (item.path && path.startsWith(item.path)) return item;
      if (item.children) {
        const hasActivePath = checkPathInChildren(item.children, path);
        if (hasActivePath) return item;
      }
    }
    return null;
  };

  const checkPathInChildren = (children, path) => {
    for (const child of children) {
      if (child.path && path.startsWith(child.path)) return true;
      if (child.children && checkPathInChildren(child.children, path)) return true;
    }
    return false;
  };

  const activeSection = getActiveSection();
  const secondLevelItems = activeSection?.children || [];

  const toggleDropdown = (key) => {
    setOpenDropdown(prev => prev === key ? null : key);
  };

  return (
    <div className='border-b border-gray-300 bg-white'>
      {/* Top row: Logo and User */}
      <div className='flex items-center justify-between px-4 md:px-8 py-3'>
        <Link to='/'>
          <img src={assets.logo} alt="logo" className='h-9 invert opacity-80'/>
        </Link>
        <UserButton/>
      </div>

      {/* Second row: Second-level tabs (only show if there's an active section with children) */}
      {secondLevelItems.length > 0 && (
        <div className='hidden md:flex items-center gap-1 px-4 md:px-8 pb-2 overflow-x-auto'>
          {secondLevelItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isActive = item.path && location.pathname.startsWith(item.path);
            const isDropdownOpen = openDropdown === item.key;

            if (!hasChildren) {
              // Direct link (second-level with no children)
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`
                  }
                >
                  {item.title}
                </NavLink>
              );
            }

            // Second-level item with third-level children (dropdown)
            return (
              <div key={item.key} className='relative'>
                <button
                  onClick={() => toggleDropdown(item.key)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-2 ${
                    isActive || isDropdownOpen ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.title}
                  <span className='text-xs'>{isDropdownOpen ? '▾' : '▸'}</span>
                </button>

                {/* Third-level dropdown */}
                {isDropdownOpen && (
                  <div className='absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg min-w-[200px] z-50'>
                    {item.children.map((child) => (
                      <NavLink
                        key={child.key}
                        to={child.path}
                        onClick={() => setOpenDropdown(null)}
                        className={({ isActive }) =>
                          `block px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                            isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                          }`
                        }
                      >
                        {child.title}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}

export default Navbar
