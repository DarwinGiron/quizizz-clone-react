import { useEffect, useState } from 'react';
import { useSidebar } from '../contexts/SidebarContext';

export const useResponsiveLayout = () => {
  const { sidebarOpen, sidebarCollapsed } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getContentStyles = () => {
    // No sobrescribir marginLeft - dejar que Tailwind lo maneje
    return {
      transition: 'all 0.3s ease-in-out'
    };
  };

  const getContentClasses = () => {
    // ml-64 para dejar espacio al sidebar fijo (w-64)
    return `transition-all duration-300 ease-in-out ml-64 ${
      !isDesktop ? 'ml-0' : ''
    }`;
  };

  return {
    sidebarOpen,
    sidebarCollapsed,
    isDesktop,
    getContentStyles,
    getContentClasses
  };
};
