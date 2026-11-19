import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import SidebarHeader from './SidebarHeader';
import SidebarMenu from './SidebarMenu';
import SidebarMenuWithVersion from './SidebarMenu';
import { fetchUserProfile } from '../../store/user/thunks';
import { Wallet, Settings, Bell } from 'lucide-react';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading: userLoading } = useSelector((state) => state.user);
  const credits = user?.credits_balance || 0;

  useEffect(() => {
    // Fetch user profile when component mounts
    dispatch(fetchUserProfile());
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };


  const [sidebarWidth, setSidebarWidth] = useState(280);

  useEffect(() => {
    // Listen for sidebar width changes
    const handleResize = () => {
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar) {
        const width = sidebar.offsetWidth;
        setSidebarWidth(width);
      }
    };

    // Initial width check
    handleResize();

    // Listen for transition end to get final width
    const sidebar = document.querySelector('[data-sidebar]');
    if (sidebar) {
      sidebar.addEventListener('transitionend', handleResize);
      // Also listen for window resize
      window.addEventListener('resize', handleResize);
      return () => {
        sidebar.removeEventListener('transitionend', handleResize);
        window.removeEventListener('resize', handleResize);
      };
      
    }
    
  }, []);


  const headerStyle = {
    left: window.innerWidth >= 1024 ? `${sidebarWidth}px` : "80px",
    width: window.innerWidth >= 1024 
      ? `calc(100% - ${sidebarWidth}px)` 
      : "calc(100% - 80px)",
  };
  return (
    <div
      data-sidebar
      className={`${
        isCollapsed ? "w-[80px]" : "w-[280px]"
      } bg-[#DBEAFE] text-blue-600 h-full flex flex-col transition-all duration-300 fixed left-0 top-0 z-40`}
    >
      {/* Collapse/Expand Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-5 top-[130px] bg-white rounded-full p-1 hover:bg-white transition-colors shadow-[0_0_6px_rgba(0,0,0,0.16)] duration-200 z-52"
      >
        {isCollapsed ? (
          <ChevronRight className="w-6 h-6 text-[#4884EE]" />
        ) : (
          <ChevronLeft className="w-6 h-6 text-[#4884EE]" />
        )}
      </button>

      {/* User Profile Section - Fixed */}
      <div className="flex-shrink-0 bg-[#DBEAFE] z-51">
        <SidebarHeader 
          user={user} 
          loading={userLoading} 
          isCollapsed={isCollapsed} 
        />
      </div>

      {/* Navigation Menu - Scrollable */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30 transition-colors">
          <SidebarMenuWithVersion 
            isCollapsed={isCollapsed} 
            currentPath={location.pathname}
            navigate={navigate}
          />
        </div>
      </div> 

      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white shadow-sm border-b border-gray-200 transition-all duration-300" style={headerStyle}>
        <div className="px-4 py-4 flex items-center justify-between">
          {location.pathname == "/dashboard" && (
            <div></div>
          )}
          {location.pathname !== "/dashboard" && (
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 px-2 py-2 bg-blue-600 hover:bg-blue-700 
                        text-white text-sm rounded-sm shadow cursor-pointer transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="block md:hidden">Dashboard</span>
              <span className="hidden md:block">Back to Dashboard</span>
            </button>
          )}

          {/* Action Icons Row */}
          <div className="flex items-center space-x-4">
            {/* Wallet with Credits */}
            {credits > 0 && (
              <div className="relative group">
                <button className="flex items-center justify-center w-10 h-10 border border-blue-600 rounded-sm hover:bg-blue-600 hover:text-white transition-colors">
                  <Wallet className="w-5 h-5" />
                </button>
                {/* Tooltip */}
                <span className="absolute top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
                  Wallet Credits
                  {/* Arrow */}
                  <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45"></span>
                </span>
                {/* Credits Badge */}
                <span className="absolute -top-3 -right-3 bg-[#DBEAFE] text-blue-600 text-xs rounded-full px-2 py-0.5 shadow">
                  {credits}
                </span>
              </div>
            )}

            {/* Notifications Icon with Badge */}
            <div className="relative group">
              <button className="flex items-center justify-center w-10 h-10 border border-blue-600 rounded-sm hover:bg-blue-600 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              {/* Tooltip */}
              <span className="absolute top-12 right-0 whitespace-nowrap bg-blue-600 text-white text-xs px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity">
                Notifications
                {/* Arrow */}
                <span className="absolute -top-1 right-4 w-2 h-2 bg-blue-600 rotate-45"></span>
              </span>
              {/* Notification Badge */}
              <span className="absolute -top-3 -right-3 bg-[#DBEAFE] text-blue-600 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </div>
          </div>

        </div>
      </header>    
    </div>
    
  );
};

export default Sidebar;
