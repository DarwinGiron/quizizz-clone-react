import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiLogOut, FiMap, FiBookOpen, FiCalendar, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const Sidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(true);
  const active = (path) =>
    location.pathname === path
      ? 'bg-purple-100 text-purple-700'
      : 'text-gray-700';

  return (
    <>
      {/* Botón flotante alineado al sidebar */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed z-[100] transition-all bg-white shadow-lg border rounded-full p-2 hover:bg-purple-100 flex items-center justify-center`
          + (open
            ? ' left-[232px]' // a la derecha del sidebar abierto
            : ' left-12') // pegado al borde cuando está cerrado
        }
        style={{ top: 24 }}
        aria-label={open ? 'Ocultar menú' : 'Mostrar menú'}
      >
        {open ? <FiChevronLeft size={22} /> : <FiChevronRight size={22} />}
      </button>

      {/* Sidebar flotante con fondo morado y logo */}
      <div
        className={`fixed top-0 left-0 h-screen z-50 transition-all duration-300 flex flex-col justify-between ${open ? 'w-60' : 'w-16'} overflow-hidden`}
        style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)', borderRadius: '24px', background: 'linear-gradient(160deg, #a78bfa 0%, #7c3aed 100%)', backdropFilter: 'blur(8px)' }}
      >
        <div className={`flex flex-col items-center ${open ? 'p-6' : 'py-8 px-2'}`}>
          {/* Logo */}
          <img src="/logo.png" alt="Logo" className={`transition-all duration-200 mb-6 ${open ? 'w-16 h-16' : 'w-10 h-10'}`} style={{ borderRadius: 12 }} />
          {/* Título solo si está abierto */}
          <h1 className={`text-xl font-bold text-white mb-8 transition-all duration-200 ${open ? 'opacity-100' : 'opacity-0 w-0 h-0 overflow-hidden'}`}>Convocatorias</h1>
          <nav className={`flex flex-col gap-6 w-full items-center justify-center`}>
            <Link
              to="/dashboard"
              className={`flex items-center justify-center rounded-lg hover:bg-purple-200/40 transition-all ${active('/dashboard')} ${open ? 'gap-2 px-3 py-2' : 'p-0'}`}
            >
              <FiHome size={28} className="text-white" />
              {open && <span className="text-white font-medium">Dashboard</span>}
            </Link>
            <Link
              to="/usuarios"
              className={`flex items-center justify-center rounded-lg hover:bg-purple-200/40 transition-all ${active('/usuarios')} ${open ? 'gap-2 px-3 py-2' : 'p-0'}`}
            >
              <FiBookOpen size={28} className="text-white" />
              {open && <span className="text-white font-medium">Usuarios</span>}
            </Link>
            <Link
              to="/capacitaciones"
              className={`flex items-center justify-center rounded-lg hover:bg-purple-200/40 transition-all ${active('/capacitaciones')} ${open ? 'gap-2 px-3 py-2' : 'p-0'}`}
            >
              <FiCalendar size={28} className="text-white" />
              {open && <span className="text-white font-medium">Capacitaciones</span>}
            </Link>
            <Link
              to="/asignaciones"
              className={`flex items-center justify-center rounded-lg hover:bg-purple-200/40 transition-all ${active('/asignaciones')} ${open ? 'gap-2 px-3 py-2' : 'p-0'}`}
            >
              <FiBookOpen size={28} className="text-white" />
              {open && <span className="text-white font-medium">Asignaciones</span>}
            </Link>
            <Link
              to="/myquizzes"
              className={`flex items-center justify-center rounded-lg hover:bg-purple-200/40 transition-all ${active('/myquizzes')} ${open ? 'gap-2 px-3 py-2' : 'p-0'}`}
            >
              <FiMap size={28} className="text-white" />
              {open && <span className="text-white font-medium">Gamificación</span>}
            </Link>
          </nav>
        </div>
        <div className={`border-t border-white/20 flex flex-col items-center ${open ? 'p-6' : 'py-4 px-2'}`}>
          <button
            onClick={() => signOut(auth)}
            className={`flex items-center justify-center text-sm text-white hover:text-red-200 w-full ${open ? 'gap-2 justify-center' : ''}`}
          >
            <FiLogOut size={28} />
            {open && <span className="font-medium">Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
