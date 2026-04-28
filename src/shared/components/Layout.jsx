import React from 'react';
import Sidebar from './Sidebar';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { useSidebar } from '../contexts/SidebarContext';

const Layout = ({ children }) => {
  const { getContentStyles, getContentClasses } = useResponsiveLayout();
  const { sidebarOpen } = useSidebar();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      
      {/* Contenido principal con transición suave */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-0'
        } ${getContentClasses()}`}
        style={getContentStyles()}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
