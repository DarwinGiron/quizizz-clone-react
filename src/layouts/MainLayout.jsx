import React from 'react';
import Sidebar from '../components/Sidebar';

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      {/* 
        Ahora que el Sidebar es `fixed`, está fuera del flujo normal.
        El contenido principal necesita un margen a la izquierda (`ml-64`) 
        que sea igual al ancho del Sidebar para evitar que se solape.
      */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
