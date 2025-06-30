import React from 'react';
import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 md:ml-60 transition-all duration-300">
        {children}
      </div>
    </div>
  );
};

export default MainLayout;