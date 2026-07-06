import React from 'react';
import { Link } from 'react-router-dom';
import { SearchX } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Se muestra para cualquier ruta que no exista, en vez de redirigir
// silenciosamente a otra pantalla.
const NotFound = () => {
  const { user } = useAuth();
  const destino = user ? '/dashboard' : '/login';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center max-w-md">
        <div className="bg-indigo-100 p-4 rounded-full w-fit mx-auto mb-4">
          <SearchX className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Uy, esta página parece no estar disponible
        </h1>
        <p className="text-gray-600 mb-6">
          La dirección a la que intentaste entrar no existe o fue movida.
          Revisa el enlace o vuelve al inicio.
        </p>
        <Link
          to={destino}
          className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:shadow-lg transition-shadow"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
