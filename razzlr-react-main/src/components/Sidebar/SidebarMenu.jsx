import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
  LayoutDashboard,
  FilePlus,
  CreditCard,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Users,
  BarChart3,
  Gift,
  Trophy,
  History,
  Wallet,
  User,
  Bell,
  Shield,
} from 'lucide-react';
import { logout } from '../../store/auth/slice';

// Version injected by Vite define
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';

const SidebarMenu = ({ isCollapsed, currentPath, navigate }) => {
  const dispatch = useDispatch();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [popupHover, setPopupHover] = useState(false);

  // Menu structure
  const menuItems = [
    {
      path: '/dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      section: 'menu',
    },
    {
      path: '/razzle/new',
      icon: FilePlus,
      label: 'Razzle',
      section: 'menu',
      submenu: [
        { path: '/razzle/new', icon: FilePlus, label: 'New Razzle' },
        { path: '/razzle/drafts', icon: History, label: 'Draft Razzles' },
      ],
    },
    {
      path: '/host-credits/buy',
      icon: CreditCard,
      label: 'Host Credits',
      section: 'menu',
      submenu: [
        { path: '/host-credits/buy', icon: Wallet, label: 'Buy Credits' },
        { path: '/host-credits/history', icon: History, label: 'Transaction History' },
      ],
    },
  ];

  // ✅ Auto-open menu if currentPath matches a submenu route
  const [expandedMenus, setExpandedMenus] = useState(() => {
    const initialState = {};
    menuItems.forEach((item) => {
      if (item.submenu && item.submenu.some((sub) => sub.path === currentPath)) {
        initialState[item.path] = true;
      }
    });
    return initialState;
  });

  // ✅ Keep submenu open if route changes later
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.submenu && item.submenu.some((sub) => sub.path === currentPath)) {
        setExpandedMenus((prev) => ({ ...prev, [item.path]: true }));
      }
    });
  }, [currentPath]);

  const toggleSubmenu = (menuKey) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menuKey]: !prev[menuKey],
    }));
  };

  // Handle hover for collapsed sidebar popup
  const handleMouseEnter = (item, event) => {
    if (isCollapsed) {
      const rect = event.currentTarget.getBoundingClientRect();
      setPopupPosition({
        top: rect.top,
        left: rect.right + 10,
      });
      setHoveredItem(item);
    }
  };

  const handleMouseLeave = () => {
    if (isCollapsed) {
      setTimeout(() => {
        if (!popupHover) setHoveredItem(null);
      }, 50);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  const linkClasses = `flex items-center ${
    isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'
  } py-2.5 text-sm text-blue-600 font-medium transition-all duration-200 cursor-pointer`;
  const activeClasses = 'bg-blue-600 text-white';
  const inactiveClasses = 'hover:text-white hover:bg-blue-600';

  const renderSubmenu = (submenu, parentKey) => {
    if (!submenu || isCollapsed) return null;

    const isExpanded = expandedMenus[parentKey];

    return (
      <div
        className={`ml-6 mt-1 space-y-1 overflow-hidden transition-all duration-300 ${
          isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        {submenu.map((subItem) => {
          const SubIcon = subItem.icon;
          const isActive = currentPath === subItem.path;

          return (
            <button
              key={subItem.path}
              onClick={() => handleNavigation(subItem.path)}
              className={`flex items-center space-x-2 px-3 py-2 text-xs font-medium w-full rounded-sm transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-600 hover:bg-[#165DFB] hover:text-white'
              }`}
            >
              <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{subItem.label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive =
      currentPath === item.path ||
      (item.submenu && item.submenu.some((sub) => sub.path === currentPath));
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isExpanded = expandedMenus[item.path];

    return (
      <div key={item.path} className="w-full relative">
        <button
          onMouseEnter={(e) => handleMouseEnter(item, e)}
          onMouseLeave={handleMouseLeave}
          onClick={() => {
            if (hasSubmenu && !isCollapsed) {
              toggleSubmenu(item.path);
            } else {
              handleNavigation(item.path);
            }
          }}
          className={`${linkClasses} ${isActive ? activeClasses : inactiveClasses} w-full`}
          title={isCollapsed ? item.label : ''}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              {hasSubmenu && (
                <span className="ml-auto">
                  {isExpanded ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </span>
              )}
            </>
          )}
        </button>
        {renderSubmenu(item.submenu, item.path)}
      </div>
    );
  };

  return (
    <>
      <div className="flex-1 py-4">
        <div className="mb-4">
          <nav className="space-y-1">{menuItems.map(renderNavItem)}</nav>
        </div>

        {/* Logout Button */}
        <div className="mt-4 pt-4 border-t border-blue-600">
          <button
            onClick={handleLogout}
            className={`flex items-center ${
              isCollapsed ? 'justify-center px-2' : 'space-x-3 px-4'
            } py-2.5 text-sm text-blue-600 w-full transition-all duration-200 cursor-pointer hover:bg-[#165DFB] hover:text-white`}
            title={isCollapsed ? 'Logout' : ''}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Hover Popup for Collapsed Sidebar */}
      {isCollapsed && hoveredItem && (
        <div
          className="fixed bg-[#DBEAFE] border border-white/20 shadow-lg z-50 min-w-[200px] p-3 rounded-sm"
          style={{
            top: `${popupPosition.top}px`,
            left: `${popupPosition.left}px`,
          }}
          onMouseEnter={() => setPopupHover(true)}
          onMouseLeave={() => {
            setPopupHover(false);
            setHoveredItem(null);
          }}
        >
          <div className="text-blue-600">
            <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-blue-600">
              <hoveredItem.icon className="w-4 h-4" />
              <span className="font-medium text-sm">{hoveredItem.label}</span>
            </div>
            {hoveredItem.submenu && hoveredItem.submenu.length > 0 ? (
              <div className="space-y-1">
                {hoveredItem.submenu.map((subItem) => {
                  const SubIcon = subItem.icon;
                  const isSubActive = currentPath === subItem.path;
                  return (
                    <button
                      key={subItem.path}
                      onClick={() => handleNavigation(subItem.path)}
                      className={`flex items-center space-x-2 px-2 py-1.5 text-xs w-full rounded-sm transition-colors cursor-pointer ${
                        isSubActive
                          ? 'bg-blue-600 text-white'
                          : 'text-blue-600 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      <SubIcon className="w-3.5 h-3.5" />
                      <span>{subItem.label}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <button
                onClick={() => handleNavigation(hoveredItem.path)}
                className={`flex items-center space-x-2 px-2 py-1.5 text-xs w-full rounded-sm transition-colors cursor-pointer ${
                  currentPath === hoveredItem.path
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-600 hover:bg-blue-600 hover:text-white'
                }`}
              >
                <hoveredItem.icon className="w-3.5 h-3.5" />
                <span>{hoveredItem.label}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Sidebar with version info
export default function SidebarMenuWithVersion(props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <SidebarMenu {...props} />
      </div>
      <div className="px-4 py-2 text-xs text-gray-400 text-center border-t border-white/30 select-none">
        Version {APP_VERSION}
      </div>
    </div>
  );
}
