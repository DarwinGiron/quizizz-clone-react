import React from 'react';
import { Link } from 'react-router-dom';

const UsuarioCard = ({ usuario, cuadrilla }) => {
  const nombre = usuario?.nombre || usuario?.usuario || usuario?.email || 'Usuario';
  const rol = usuario?.rol || 'No definido';
  const email = usuario?.email || 'Sin email';
  const codigo = usuario?.codigo;

  const isSupervisor = rol === 'supervisor';
  const CardContent = () => (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Rol</p>
          <h2 className="mt-1 text-lg font-semibold text-gray-900">{nombre}</h2>
          <p className="text-sm text-gray-500">{rol}</p>
        </div>
        {codigo && (
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">{codigo}</span>
        )}
      </div>

      <div className="mt-4 space-y-3 text-sm text-gray-600">
        <div>
          <span className="font-medium text-gray-900">Email:</span> {email}
        </div>
        <div>
          <span className="font-medium text-gray-900">Miembros de cuadrilla:</span> {cuadrilla?.length || 0}
        </div>
      </div>
    </div>
  );

  if (isSupervisor) {
    return (
      <Link to={`/cuadrilla/${usuario.id}`}>
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
};

export default UsuarioCard;
