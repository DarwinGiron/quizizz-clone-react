import { useEffect, useState } from 'react';
import { useSidebar } from '../contexts/SidebarContext';

export const useResponsiveLayout = () => {
  const { sidebarOpen, sidebarCollapsed, getContentMargin } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getContentStyles = () => {
    if (!isDesktop) {
      return {
        marginLeft: '0px',
        width: '100%',
        transition: 'all 0.3s ease-in-out'
      };
    }

    return {
      marginLeft: getContentMargin(),
      width: `calc(100% - ${getContentMargin()})`,
      transition: 'all 0.3s ease-in-out'
    };
  };

  const getContentClasses = () => {
    return `transition-all duration-300 ease-in-out ${
      !isDesktop ? 'w-full' : ''
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
