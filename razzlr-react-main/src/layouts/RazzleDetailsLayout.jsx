import { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';

const RazzleDetailsLayout = ({ children, isCompleted = false }) => {
  const [sidebarWidth, setSidebarWidth] = useState(260);

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
      window.addEventListener('resize', handleResize);
      return () => {
        sidebar.removeEventListener('transitionend', handleResize);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return (
    <div className={`min-h-screen ${
      isCompleted 
        ? 'bg-gradient-to-br from-yellow-50 via-white to-orange-50' 
        : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
    }`}>
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

export default RazzleDetailsLayout;
