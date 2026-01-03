import { useState, useMemo } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { assets } from '../../assets/assets'
import { useAuth } from '../../contexts/AuthContext'
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
          { key: "res-approved", title: "Approved", path: "/owner/reservations/approved" }
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

  // Determine active section based on current path (same logic as Sidebar)
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

  const renderNavItem = (item) => {
    const hasChildren = item.children && item.children.length > 0;
    const isActive = item.path && location.pathname.startsWith(item.path);
    const isDropdownOpen = openDropdown === item.key;

    if (!hasChildren) {
      // Direct link (no children)
      return (
        <NavLink
          key={item.key}
          to={item.path}
          className={({ isActive }) =>
            `group flex flex-col gap-0.5 text-[#b69624] text-base ${
              isActive ? 'font-medium' : ''
            }`
          }
        >
          {item.title}
          <div className={`bg-[#b69624] h-0.5 w-0 group-hover:w-full transition-all duration-300 ${
            isActive ? 'w-full' : ''
          }`} />
        </NavLink>
      );
    }

    // Item with children (dropdown)
    return (
      <div
        key={item.key}
        className="relative group"
        onMouseEnter={() => setOpenDropdown(item.key)}
        onMouseLeave={() => setOpenDropdown(null)}
      >
        <button className="flex items-center gap-1 text-[#b69624] text-base">
          {item.title}
          <svg className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        <div className={`absolute top-full left-0 mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 ${isDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
          {item.children.map((child) => {
            const hasGrandChildren = child.children && child.children.length > 0;

            if (!hasGrandChildren) {
              return (
                <NavLink
                  key={child.key}
                  to={child.path}
                  className={({ isActive }) =>
                    `block px-4 py-3 text-[#b69624] hover:bg-gray-100 transition-colors text-base border-b border-gray-100 last:border-b-0 ${
                      isActive ? 'bg-gray-100 font-medium' : ''
                    }`
                  }
                >
                  {child.title}
                </NavLink>
              );
            }

            // Third-level dropdown (nested)
            const isChildDropdownOpen = openDropdown === child.key;
            return (
              <div
                key={child.key}
                className="relative group/nested"
                onMouseEnter={() => setOpenDropdown(child.key)}
              >
                <button className="w-full flex items-center justify-between px-4 py-3 text-[#b69624] hover:bg-gray-100 transition-colors text-base border-b border-gray-100 last:border-b-0">
                  {child.title}
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Nested Dropdown */}
                <div className={`absolute left-full top-0 ml-1 w-48 bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 ${isChildDropdownOpen ? 'opacity-100 visible translate-x-0' : 'opacity-0 invisible -translate-x-2'}`}>
                  {child.children.map((grandChild) => (
                    <NavLink
                      key={grandChild.key}
                      to={grandChild.path}
                      className={({ isActive }) =>
                        `block px-4 py-3 text-[#b69624] hover:bg-gray-100 transition-colors text-base border-b border-gray-100 last:border-b-0 ${
                          isActive ? 'bg-gray-100 font-medium' : ''
                        }`
                      }
                    >
                      {grandChild.title}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <nav className="fixed top-0 left-0 w-full flex items-center justify-between px-4 md:px-16 lg:px-24 xl:px-32 bg-white/60 shadow-md text-[#b69624] backdrop-blur-lg py-3 md:py-4 transition-all duration-500 z-50">
      {/* Logo */}
      <Link to='/'>
        <img src={assets.logo} alt="logo" className="h-9 invert opacity-80" />
      </Link>

      {/* Desktop Nav - Only show second-level items from active section */}
      <div className="hidden md:flex items-center gap-4 lg:gap-8">
        {secondLevelItems.map(renderNavItem)}
      </div>

      {/* Desktop Right */}
      <div className="hidden md:flex items-center gap-4">
        <UserMenu />
      </div>

      {/* Mobile Menu Button */}
      <div className="flex items-center gap-3 md:hidden">
        <UserMenu />
      </div>
    </nav>
  )
}

const UserMenu = () => {
  const { user, profile, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null

  return (
    <div className="relative group" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
      <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 transition-all">
        <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
          {profile?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="text-[#b69624]">
          {profile?.full_name || user?.email?.split('@')[0] || 'User'}
        </span>
      </button>

      <div className={`absolute right-0 top-full mt-2 w-48 bg-white shadow-lg rounded-lg overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-sm text-gray-600">Role</p>
          <p className="text-sm font-medium text-[#b69624] capitalize">{profile?.role || 'Guest'}</p>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors text-sm"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default Navbar
