import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  LogOut,
  Users,
  BookOpen,
  Target,
  Layers,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  ClipboardList,
} from 'lucide-react';
import { useSidebar } from '../contexts/SidebarContext';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const { user, rol, isSupervisor, isCapacitador, supervisorId, logout } = useAuth();

  const isActive = (path) => {
    if (path === '/myquizzes') {
      return location.pathname === '/myquizzes' || location.pathname === '/my-quizzes';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Navegación por rol.
  const supervisorNav = [
    {
      path: '/mis-asignaciones',
      icon: Target,
      label: 'Mis Asignaciones',
      description: 'Asignar mi cuadrilla'
    },
    {
      path: `/cuadrilla/${supervisorId}`,
      icon: Users,
      label: 'Mi Cuadrilla',
      description: 'Gestionar mi personal'
    },
    {
      path: '/capacitaciones',
      icon: BookOpen,
      label: 'Capacitaciones',
      description: 'Ver cursos y formación'
    },
    {
      path: '/myquizzes',
      icon: ClipboardList,
      label: 'Reportes',
      description: 'Resultados de evaluaciones'
    }
  ];

  const capacitadorNav = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Dashboard',
      description: 'Panel principal'
    },
    {
      path: '/capacitaciones',
      icon: BookOpen,
      label: 'Capacitaciones',
      description: 'Ver cursos y formación'
    },
    {
      path: '/myquizzes',
      icon: Layers,
      label: 'Mis Quizzes',
      description: 'Evaluaciones creadas'
    }
  ];

  const usuarioNav = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Dashboard',
      description: 'Panel principal'
    }
  ];

  // Navegación completa del admin.
  const adminNav = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Dashboard',
      description: 'Panel principal'
    },
    {
      path: '/usuarios',
      icon: Users,
      label: 'Usuarios',
      description: 'Gestión de usuarios'
    },
    {
      path: '/capacitaciones',
      icon: BookOpen,
      label: 'Capacitaciones',
      description: 'Cursos y formación'
    },
    {
      path: '/asignaciones',
      icon: Target,
      label: 'Asignaciones',
      description: 'Tareas asignadas'
    },
    {
      path: '/myquizzes',
      icon: Layers,
      label: 'Mis Quizzes',
      description: 'Evaluaciones creadas'
    }
  ];

  const navPorRol = {
    admin: adminNav,
    capacitador: capacitadorNav,
    supervisor: supervisorNav,
    usuario: usuarioNav,
  };
  const navItems = navPorRol[rol] || usuarioNav;

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

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
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg"></div>
            <div className="relative w-full h-full bg-white rounded-2xl flex items-center justify-center shadow-inner">
              <GraduationCap className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          
          <div>
            <h1 className="text-xl font-bold text-white text-center mb-2">Cuestionary</h1>
            <p className="text-xs text-gray-400 text-center">
              {isSupervisor && `Supervisor · ${user?.nombre || ''}`}
              {isCapacitador && `Capacitador · ${user?.nombre || ''}`}
              {!isSupervisor && !isCapacitador && 'Sistema de evaluación'}
            </p>
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
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
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
                      active ? 'text-indigo-100' : 'text-gray-400 group-hover:text-gray-300'
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
            onClick={handleLogout}
            className="group w-full flex items-center transition-all duration-200 rounded-xl px-4 py-3 text-gray-300 hover:bg-red-500/20 hover:text-red-300"
          >
            <LogOut size={20} className="transition-colors flex-shrink-0" />
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
        className="fixed left-4 top-4 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg text-white p-2 rounded-lg transition-shadow"
        title={sidebarOpen ? 'Contraer sidebar' : 'Expandir sidebar'}
      >
        {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>
    </>
  );
};

export default Sidebar;
