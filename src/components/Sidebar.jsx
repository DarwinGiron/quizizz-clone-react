import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiLogOut, FiMap, FiBookOpen, FiCalendar } from 'react-icons/fi';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const Sidebar = () => {
  const location = useLocation();
  const active = (path) =>
    location.pathname === path
      ? 'bg-purple-100 text-purple-700'
      : 'text-gray-700';

  return (
    <div className="hidden md:flex h-screen w-60 bg-white border-r shadow-sm fixed left-0 top-0 flex-col justify-between z-50">
      <div className="p-6">
        <h1 className="text-xl font-bold text-purple-700 mb-8">Convocatorias</h1>
        <nav className="flex flex-col space-y-4">
          <Link
            to="/dashboard"
            className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-purple-50 ${active('/dashboard')}`}
          >
            <FiHome /> Dashboard
          </Link>
          <Link
            to="/usuarios"
            className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-purple-50 ${active('/usuarios')}`}
          >
            <FiBookOpen /> Usuarios
          </Link>

          <Link
            to="/capacitaciones"
            className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-purple-50 ${active('/capacitaciones')}`}
          >
            <FiCalendar /> Capacitaciones
          </Link>

          <Link
            to="/asignaciones"
            className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-purple-50 ${active('/asignaciones')}`}
          >
            <FiBookOpen /> Asignaciones
          </Link>

          <Link
            to="/myquizzes"
            className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-purple-50 ${active('/myquizzes')}`}
          >
            <FiMap /> Gamificación
          </Link>

        </nav>
      </div>
      <div className="p-6 border-t">
        <button
          onClick={() => signOut(auth)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-500"
        >
          <FiLogOut /> Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
