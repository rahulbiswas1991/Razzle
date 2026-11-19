import { useState, useEffect } from 'react';
import { Sidebar } from '../components/Sidebar';

const DashboardLayout = ({ children }) => {
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Sidebar */}
      <Sidebar />
      
      {/* Main Content - with left margin to avoid overlap */}
      <div
        className="transition-all duration-300"
        style={{
          marginLeft: window.innerWidth >=1024 ? `${sidebarWidth}px` : "80px",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
