import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiLogOut, FiMap, FiBookOpen, FiCalendar, FiMenu, FiSearch } from 'react-icons/fi';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import './Sidebar.css'; // Import the CSS file

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(document.body.classList.contains('collapsed'));
  const location = useLocation();
  const active = (path) => (location.pathname === path ? 'active' : '');

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    document.body.classList.toggle('collapsed');
  };

  // Effect to handle initial collapsed state based on body class
  useEffect(() => {
    setIsCollapsed(document.body.classList.contains('collapsed'));
  }, []);

  return (

    <div className="sidebar">
      <div className="header">
 {/* Replace with your logo or site title */}
        <h2 className="text-xl font-bold text-white">Astra</h2>
        <button className="collapse-toggle-btn">
 <FiMenu />
        </button>
      </div>
      <div className="search-wrapper">
        <FiSearch className="search-icon" />
        <input type="text" placeholder="Search for anything..." className="search-input" />
      </div>
      <div className="sidebar-links">
        <ul>
          <li>
            <Link
              to="/dashboard"
              className={`link ${active('/dashboard')}`}
            >
              <FiHome />
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/usuarios"
              className={`link ${active('/usuarios')}`}
            >
              <FiBookOpen />
              <span>Usuarios</span>
            </Link>
          </li>

          <li>
            <Link
              to="/capacitaciones"
              className={`link ${active('/capacitaciones')}`}
            >
              <FiCalendar />
              <span>Capacitaciones</span>
            </Link>
          </li>

          <li>
            <Link
              to="/asignaciones"
              className={`link ${active('/asignaciones')}`}
            >
              <FiBookOpen />
              <span>Asignaciones</span>
            </Link>
          </li>

          <li>
            <Link
              to="/myquizzes"
              className={`link ${active('/myquizzes')}`}
            >
              <FiMap />
              <span>Gamificación</span>
            </Link>
          </li>

        </ul>
      </div>
      <div className="bottom-links">
        <div className="profile-part">
          <div className="avatar_wrapper">
            {/* Replace with user avatar */}
            <div className="avatar"></div>
          </div>
          <div className="user-info">
            <div className="user-name">User Name</div> {/* Replace with dynamic user name */}
            <div className="email">user@example.com</div> {/* Replace with dynamic user email */}
          </div>
        </div>
        <button
          onClick={toggleCollapse}
          className="logout"
        >
          <FiLogOut /> Cerrar sesión
        </button>
      </div>
    </div>
    <button className="expand-btn-outside" onClick={toggleCollapse}>
 <FiMenu style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)' }} />
 </button>
};

export default Sidebar;
