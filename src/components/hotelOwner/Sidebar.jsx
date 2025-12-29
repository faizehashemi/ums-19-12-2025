import React, { useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Dialog } from "@headlessui/react";
import { assets } from "../../assets/assets";
import { usePermissions } from "../../hooks/usePermissions";
import { MODULE_KEYS } from "../../config/rolePermissions";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { canAccessModule, isLoaded } = usePermissions();

  // Full nav tree (same as before, but icons are OPTIONAL)
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

  // MOBILE: pick 5 top-level tabs (thumb-friendly). Everything else is in "More".
  const mobileTabs = useMemo(
    () => [
      { key: "tab-dashboard", title: "Home", path: "/owner/dashboard", icon: assets.dashboardIcon },
      { key: "tab-res", title: "Res", openKey: "reservations", icon: assets.calendarIcon },
      { key: "tab-acc", title: "Accounts", openKey: "accounts", icon: assets.accountsIcon },
      { key: "tab-mawaid", title: "Mawaid", openKey: "mawaid", icon: assets.utensilsIcon },
      { key: "tab-more", title: "More", openKey: "more", icon: assets.moreIcon || assets.listIcon }
    ],
    []
  );

  // Drawer state for mobile
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSectionKey, setDrawerSectionKey] = useState(null);

  const openDrawer = (sectionKey) => {
    setDrawerSectionKey(sectionKey);
    setDrawerOpen(true);
  };

  const closeDrawer = () => setDrawerOpen(false);

  const isActivePath = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  // Drawer content:
  const drawerSections = useMemo(() => {
    const map = new Map(filteredNav.map((n) => [n.key, n]));
    return map;
  }, [filteredNav]);

  const moreSections = useMemo(() => {
    const mainKeys = new Set(["reservations", "accounts", "mawaid"]);
    return filteredNav.filter((n) => !mainKeys.has(n.key) && n.key !== "dashboard");
  }, [filteredNav]);

  const drawerRoot =
    drawerSectionKey === "more"
      ? { title: "More", children: moreSections }
      : drawerSections.get(drawerSectionKey);

  // DESKTOP sidebar: only show first-level items
  // Determine active section based on current path
  const getActiveSection = () => {
    const path = location.pathname;
    for (const item of filteredNav) {
      if (item.path && path.startsWith(item.path)) return item.key;
      if (item.children) {
        const hasActivePath = checkPathInChildren(item.children, path);
        if (hasActivePath) return item.key;
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

  // Helper to get first navigable path from a node
  const getFirstPath = (node) => {
    if (node.path) return node.path;
    if (node.children && node.children.length > 0) {
      return getFirstPath(node.children[0]);
    }
    return null;
  };

  const FirstLevelItem = ({ node }) => {
    const isActive = activeSection === node.key;
    const targetPath = getFirstPath(node);

    if (!targetPath) {
      // No path available - shouldn't happen but handle gracefully
      return (
        <div className="flex items-center gap-3 py-3 px-4 md:px-6 border-l-4 border-transparent text-gray-400">
          {node.icon && <img src={node.icon} alt="" className="h-5 w-5 opacity-50" />}
          <span className="text-sm font-medium">{node.title}</span>
        </div>
      );
    }

    return (
      <NavLink
        to={targetPath}
        className={`flex items-center gap-3 py-3 px-4 md:px-6 border-l-4 transition-colors cursor-pointer ${
          isActive ? "bg-blue-600/10 border-blue-600 text-blue-600" : "border-transparent text-gray-700 hover:bg-gray-100/90"
        }`}
      >
        {node.icon && <img src={node.icon} alt="" className="h-5 w-5" />}
        <span className="text-sm font-medium">{node.title}</span>
      </NavLink>
    );
  };

  // Drawer list renderer (mobile)
  const DrawerNode = ({ node, depth = 0 }) => {
    const hasChildren = node.children?.length > 0;

    if (!hasChildren) {
      return (
        <button
          type="button"
          onClick={() => {
            navigate(node.path);
            closeDrawer();
          }}
          className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ marginLeft: depth * 12 }}
        >
          <div className="text-sm font-medium text-gray-900">{node.title}</div>
          <div className="text-xs text-gray-500">{node.path}</div>
        </button>
      );
    }

    return (
      <div className="mt-2" style={{ marginLeft: depth * 12 }}>
        <div className="px-4 py-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">{node.title}</div>
        <div className="space-y-1">
          {node.children.map((c) => (
            <DrawerNode key={c.key} node={c} depth={depth + 1} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex md:w-72 border-r h-full text-base border-gray-300 pt-4 flex-col">
        {filteredNav.map((item) => (
          <FirstLevelItem key={item.key} node={item} />
        ))}
      </aside>

      {/* MOBILE BOTTOM NAV */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5">
          {mobileTabs.map((t) => {
            const active = t.path ? isActivePath(t.path) : drawerOpen && drawerSectionKey === t.openKey;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => {
                  if (t.path) navigate(t.path);
                  else openDrawer(t.openKey);
                }}
                className={`flex flex-col items-center justify-center gap-1 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  active ? "text-blue-600" : "text-gray-600"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {t.icon ? <img src={t.icon} alt="" className="h-6 w-6" /> : <span className="h-6 w-6" aria-hidden="true" />}
                <span className="text-[11px] leading-none">{t.title}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MOBILE DRAWER */}
      <Dialog open={drawerOpen} onClose={closeDrawer} className="md:hidden relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex">
          <Dialog.Panel className="ml-auto h-full w-full max-w-md bg-white p-4 overflow-y-auto">
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-base font-semibold text-gray-900">
                {drawerRoot?.title || "Menu"}
              </Dialog.Title>
              <button
                type="button"
                onClick={closeDrawer}
                className="px-3 py-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Close
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {drawerRoot?.children?.map((c) => (
                <DrawerNode key={c.key} node={c} />
              ))}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Spacer so content doesn't hide behind bottom bar */}
      <div className="md:hidden h-16" />
    </>
  );
};

export default Sidebar;
