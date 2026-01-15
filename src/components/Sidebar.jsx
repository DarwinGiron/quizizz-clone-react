import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, BookCopy, CheckSquare, Star, Bolt, Settings } from 'lucide-react';

const NavItem = ({ to, icon, children }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-accent/10 text-accent' : 'text-text-muted hover:bg-hover'}`}>
    {icon}
    <span className="font-medium">{children}</span>
  </NavLink>
);

const Sidebar = () => {
  return (
    <div className="w-64 bg-primary border-r border-border-secondary p-4 flex flex-col">
        <div className="mb-8">
            <h1 className="text-2xl font-bold text-text-primary">W.</h1>
        </div>
        <nav className="flex-grow space-y-2">
            <NavItem to="/" icon={<LayoutDashboard size={20}/>}>Dashboard</NavItem>
            <NavItem to="/users" icon={<Users size={20}/>}>Usuarios</NavItem>
            <NavItem to="/capacitaciones" icon={<BookCopy size={20}/>}>Capacitaciones</NavItem>
            <NavItem to="/asignaciones" icon={<CheckSquare size={20}/>}>Mis Asignaciones</NavItem>
            
            <p className="text-xs font-semibold text-text-muted uppercase pt-4 pb-2 px-4">Gamificación</p>
            <NavItem to="/my-quizzes" icon={<Star size={20}/>}>Mis Quizzes</NavItem>
            <NavItem to="/create-quiz" icon={<Bolt size={20}/>}>Crear Quiz</NavItem>
            <NavItem to="/active-sessions" icon={<Bolt size={20}/>}>Sesiones Activas</NavItem>
        </nav>
        <div className="mt-auto">
            <NavItem to="/settings" icon={<Settings size={20}/>}>Ajustes</NavItem>
        </div>
    </div>
  );
};

export default Sidebar;
