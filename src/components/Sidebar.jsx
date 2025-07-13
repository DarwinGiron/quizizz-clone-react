import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiLogOut, 
  FiUsers, 
  FiBookOpen, 
  FiCalendar, 
  FiChevronLeft, 
  FiChevronRight,
  FiTarget,
  FiAward,
  FiLayers
} from 'react-icons/fi';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const Sidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(() => {
    // Estado inicial basado en el tamaño de pantalla
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // Solo abierto por defecto en desktop (lg)
    }
    return false;
  });
  const sidebarRef = useRef(null);
  const toggleButtonRef = useRef(null);
  
  const isActive = (path) => {
    if (path === '/myquizzes') {
      return location.pathname === '/myquizzes' || location.pathname === '/my-quizzes';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Efecto para detectar clics fuera del sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Solo cerrar si el sidebar está abierto
      if (!open) return;
      
      // No cerrar si el clic fue en el sidebar o en el botón de toggle
      if (
        sidebarRef.current?.contains(event.target) ||
        toggleButtonRef.current?.contains(event.target)
      ) {
        return;
      }
      
      // Cerrar el sidebar
      setOpen(false);
    };

    // Agregar el event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Efecto para cerrar sidebar en pantallas pequeñas cuando cambia la ruta
  useEffect(() => {
    const handleRouteChange = () => {
      // En pantallas pequeñas (móvil), cerrar sidebar al navegar
      if (window.innerWidth < 1024) {
        setOpen(false);
      }
    };

    handleRouteChange();
  }, [location.pathname]);

  // Efecto para manejar el redimensionamiento de la ventana
  useEffect(() => {
    const handleResize = () => {
      // En pantallas grandes, abrir automáticamente
      if (window.innerWidth >= 1024) {
        setOpen(true);
      } else {
        // En pantallas pequeñas, cerrar automáticamente
        setOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const navItems = [
    {
      path: '/dashboard',
      icon: FiHome,
      label: 'Dashboard',
      description: 'Panel principal'
    },
    {
      path: '/usuarios',
      icon: FiUsers,
      label: 'Usuarios',
      description: 'Gestión de usuarios'
    },
    {
      path: '/capacitaciones',
      icon: FiBookOpen,
      label: 'Capacitaciones',
      description: 'Cursos y formación'
    },
    {
      path: '/asignaciones',
      icon: FiTarget,
      label: 'Asignaciones',
      description: 'Tareas asignadas'
    },
    {
      path: '/myquizzes',
      icon: FiLayers,
      label: 'Mis Quizzes',
      description: 'Evaluaciones creadas'
    }
  ];

  return (
    <>
      {/* Overlay para pantallas pequeñas */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Botón de toggle mejorado */}
      <button
        ref={toggleButtonRef}
        onClick={() => setOpen((v) => !v)}
        className={`fixed z-[100] transition-all duration-300 bg-white shadow-xl border border-gray-200 rounded-full p-3 hover:bg-purple-50 hover:border-purple-200 flex items-center justify-center group ${
          open ? 'left-[248px] lg:left-[248px]' : 'left-4'
        } lg:block`}
        style={{ top: 20 }}
        aria-label={open ? 'Ocultar menú' : 'Mostrar menú'}
      >
        {open ? (
          <FiChevronLeft size={20} className="text-gray-600 group-hover:text-purple-600 transition-colors" />
        ) : (
          <FiChevronRight size={20} className="text-gray-600 group-hover:text-purple-600 transition-colors" />
        )}
      </button>

      {/* Sidebar moderno */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 flex flex-col ${
          open ? 'w-64 translate-x-0' : 'w-20 -translate-x-full lg:translate-x-0'
        } overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl`}
      >
        {/* Header */}
        <div className={`flex flex-col items-center ${open ? 'p-6 pt-8' : 'py-8 px-3'}`}>
          {/* Logo con efecto */}
          <div className={`relative mb-4 transition-all duration-300 ${open ? 'w-16 h-16' : 'w-12 h-12'}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-lg"></div>
            <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center shadow-inner">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ?
              </span>
            </div>
          </div>
          
          {/* Título con animación */}
          <div className={`transition-all duration-300 overflow-hidden ${
            open ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0'
          }`}>
            <h1 className="text-xl font-bold text-white text-center mb-2">Cuestionary</h1>
            <p className="text-xs text-gray-400 text-center">Sistema de evaluación</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex flex-col flex-1 ${open ? 'px-4' : 'px-2'}`}>
          <div className={`space-y-2 ${open ? '' : 'space-y-4'}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center transition-all duration-200 rounded-xl ${
                    open ? 'px-4 py-3' : 'px-3 py-4 justify-center'
                  } ${
                    active
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Icon 
                    size={open ? 20 : 24} 
                    className={`transition-colors ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'}`} 
                  />
                  
                  {open && (
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className={`text-xs transition-colors ${
                        active ? 'text-purple-100' : 'text-gray-400 group-hover:text-gray-300'
                      }`}>
                        {item.description}
                      </div>
                    </div>
                  )}

                  {/* Tooltip para modo colapsado */}
                  {!open && (
                    <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-300">{item.description}</div>
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45"></div>
                    </div>
                  )}

                  {/* Indicador activo */}
                  {active && (
                    <div className={`absolute ${
                      open ? 'right-2' : 'right-1'
                    } w-2 h-2 bg-white rounded-full shadow-lg`}></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className={`border-t border-gray-700 ${open ? 'p-4' : 'py-4 px-2'}`}>
          <button
            onClick={() => signOut(auth)}
            className={`group w-full flex items-center transition-all duration-200 rounded-xl text-gray-300 hover:bg-red-500/20 hover:text-red-300 ${
              open ? 'px-4 py-3' : 'px-3 py-4 justify-center'
            }`}
          >
            <FiLogOut size={open ? 20 : 24} className="transition-colors" />
            {open && (
              <div className="ml-3 flex-1 text-left">
                <div className="font-medium text-sm">Cerrar sesión</div>
                <div className="text-xs text-gray-400 group-hover:text-red-200">Salir del sistema</div>
              </div>
            )}

            {/* Tooltip para logout en modo colapsado */}
            {!open && (
              <div className="absolute left-full ml-3 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                <div className="font-medium">Cerrar sesión</div>
                <div className="text-xs text-gray-300">Salir del sistema</div>
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-800 rotate-45"></div>
              </div>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
