import React from 'react';
import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 lg:ml-20 transition-all duration-300">
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;