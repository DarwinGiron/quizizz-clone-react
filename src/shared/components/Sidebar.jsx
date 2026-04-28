import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FiHome, 
  FiLogOut, 
  FiUsers, 
  FiBookOpen, 
  FiCalendar, 
  FiTarget,
  FiLayers,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { useSidebar } from '../contexts/SidebarContext';

const Sidebar = () => {
  const location = useLocation();
  const { sidebarOpen, toggleSidebar } = useSidebar();

  const isActive = (path) => {
    if (path === '/myquizzes') {
      return location.pathname === '/myquizzes' || location.pathname === '/my-quizzes';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };


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
      {/* Sidebar moderno con toggle */}
      <div
        className={`fixed top-0 left-0 h-screen z-50 overflow-hidden bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 shadow-2xl transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-0'
        }`}
      >
        {/* Header */}
        <div className="flex flex-col items-center p-6 pt-8 opacity-100">
          {/* Logo con efecto */}
          <div className="relative mb-4 w-16 h-16 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl shadow-lg"></div>
            <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center shadow-inner">
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                ?
              </span>
            </div>
          </div>
          
          <div>
            <h1 className="text-xl font-bold text-white text-center mb-2">Cuestionary</h1>
            <p className="text-xs text-gray-400 text-center">Sistema de evaluación</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col flex-1 px-4">
          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center px-4 py-3 transition-all duration-200 rounded-xl ${
                    active
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                  }`}
                >
                  <Icon 
                    size={20} 
                    className={`transition-colors ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'}`} 
                  />
                  
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className={`text-xs transition-colors ${
                      active ? 'text-purple-100' : 'text-gray-400 group-hover:text-gray-300'
                    }`}>
                      {item.description}
                    </div>
                  </div>

                  {/* Indicador activo */}
                  {active && (
                    <div className="absolute right-2 w-2 h-2 bg-white rounded-full shadow-lg"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          <button
            onClick={() => signOut(auth)}
            className="group w-full flex items-center transition-all duration-200 rounded-xl px-4 py-3 text-gray-300 hover:bg-red-500/20 hover:text-red-300"
          >
            <FiLogOut size={20} className="transition-colors flex-shrink-0" />
            <div className="ml-3 flex-1 text-left">
              <div className="font-medium text-sm">Cerrar sesión</div>
              <div className="text-xs text-gray-400 group-hover:text-red-200">Salir del sistema</div>
            </div>
          </button>
        </div>
      </div>

      {/* Botón toggle para colapsar/expandir sidebar */}
      <button
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-40 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-all shadow-lg"
        title={sidebarOpen ? 'Contraer sidebar' : 'Expandir sidebar'}
      >
        {sidebarOpen ? <FiChevronLeft size={20} /> : <FiChevronRight size={20} />}
      </button>
    </>
  );
};

export default Sidebar;
