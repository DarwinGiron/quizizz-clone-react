import React from 'react';
import Sidebar from '../components/Sidebar';



const MainLayout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 ml-60 p-6"> 
        {children}
      </div>
    </div>
  );
};

export default MainLayout;