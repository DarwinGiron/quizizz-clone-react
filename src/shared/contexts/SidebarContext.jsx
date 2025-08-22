import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // Estado inicial basado en el tamaño de pantalla
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // Solo abierto por defecto en desktop (lg)
    }
    return false;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Efecto para manejar el redimensionamiento de la ventana
  useEffect(() => {
    const handleResize = () => {
      // En pantallas grandes, abrir automáticamente
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        // En pantallas pequeñas, cerrar automáticamente
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const toggleCollapsed = () => {
    setSidebarCollapsed(prev => !prev);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const openSidebar = () => {
    setSidebarOpen(true);
  };

  // Calcular el margen left para el contenido
  const getContentMargin = () => {
    if (!sidebarOpen) return '0px';
    return sidebarCollapsed ? '80px' : '256px'; // 80px para colapsado, 256px para expandido
  };

  const value = {
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebar,
    toggleCollapsed,
    closeSidebar,
    openSidebar,
    getContentMargin
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};
