import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 
import { LogOut, ChevronDown, Settings, BarChart2, Users, BookOpen, Clipboard, Award, PlusCircle, Zap } from 'lucide-react';

const Sidebar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [isSettingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const settingsMenuRef = useRef(null);

  // Cierra el menú de ajustes si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) {
        setSettingsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NavItem = ({ to, icon, children }) => {
    const isActive = location.pathname.startsWith(to);
    // CORREGIDO: Se usa hover:text-text-primary
    return (
      <NavLink to={to} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-accent-strong text-accent-text font-semibold' : 'text-text-secondary hover:bg-hover hover:text-text-primary'}`}>
        {icon}
        <span className="text-sm">{children}</span>
      </NavLink>
    );
  };

  return (
    <div className="w-64 h-screen flex flex-col justify-between p-4 bg-secondary border-r border-border">
      <div>
        <div className="mb-10 pl-2">
          {/* CORREGIDO: Se usa text-text-primary */}
          <h1 className="text-2xl font-bold text-text-primary">W.</h1>
        </div>
        <nav className="flex flex-col gap-2">
          <NavItem to="/dashboard" icon={<BarChart2 size={20} />}>Dashboard</NavItem>
          <NavItem to="/usuarios" icon={<Users size={20} />}>Usuarios</NavItem>
          <NavItem to="/capacitaciones" icon={<BookOpen size={20} />}>Capacitaciones</NavItem>
          <NavItem to="/asignaciones" icon={<Clipboard size={20} />}>Asignaciones</NavItem>

          <h2 className="text-xs font-bold uppercase text-text-muted mt-6 mb-2 ml-4">Gamificación</h2>
          <NavItem to="/my-quizzes" icon={<Award size={20} />}>Mis Quizzes</NavItem>
          <NavItem to="/create-quiz" icon={<PlusCircle size={20} />}>Crear Quiz</NavItem>
          <NavItem to="/sessions" icon={<Zap size={20} />}>Sesiones Activas</NavItem>
        </nav>
      </div>

      <div className="relative" ref={settingsMenuRef}>
        {isSettingsMenuOpen && (
          <div className="absolute bottom-full mb-2 w-full bg-tertiary rounded-lg shadow-xl border border-border overflow-hidden">
             {/* CORREGIDO: Se usa hover:text-text-primary */}
            <NavLink to="/settings" onClick={() => setSettingsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-text-secondary hover:bg-hover hover:text-text-primary">
              <Settings size={18} />
              <span>Ajustes</span>
            </NavLink>
            <button onClick={logout} className="flex items-center w-full gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-500/10">
              <LogOut size={18} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
         {/* CORREGIDO: Se usa hover:text-text-primary */}
        <button onClick={() => setSettingsMenuOpen(!isSettingsMenuOpen)} className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-text-secondary hover:bg-hover hover:text-text-primary">
          <span className="text-sm font-semibold">Ajustes</span>
          <ChevronDown size={20} className={`transition-transform duration-300 ${isSettingsMenuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
