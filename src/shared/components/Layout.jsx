import React from 'react';
import Sidebar from './Sidebar';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const Layout = ({ children }) => {
  const { getContentStyles, getContentClasses } = useResponsiveLayout();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      
      {/* Contenido principal con transición suave */}
      <div
        className={getContentClasses()}
        style={getContentStyles()}
      >
        {children}
      </div>
    </div>
  );
};

export default Layout;
