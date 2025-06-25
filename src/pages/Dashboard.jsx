
import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const Dashboard = () => {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-4">Panel Principal</h1>
      <p className="mb-4">Aquí irá la gestión de quizzes, juegos y estadísticas.</p>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded"
        onClick={() => signOut(auth)}
      >
        Cerrar sesión
      </button>
    </div>
  );
};

export default Dashboard;
