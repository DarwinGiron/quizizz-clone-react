import React, { useState } from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { EditarUsuarioModal } from '../../usuarios';
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useNavigate } from "react-router-dom";

export default function UsuarioCard({ usuario, cuadrilla }) {
  const [editando, setEditando] = useState(false);
  const navigate = useNavigate();

  const eliminarUsuario = async () => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      await deleteDoc(doc(db, "usuarios", usuario.id));
      window.location.reload(); // Forzar actualización
    }
  };

  const esSupervisor = usuario.rol === "supervisor";

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow p-6 text-white relative">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h2 className="text-xl font-bold">{usuario.nombre}</h2>
          <p className="text-sm text-purple-300">{usuario.usuario}</p>
        </div>
        <div className="flex space-x-2 text-gray-400">
          <button onClick={() => setEditando(true)}>
            <FiEdit className="hover:text-yellow-400" />
          </button>
          <button onClick={eliminarUsuario}>
            <FiTrash2 className="hover:text-red-500" />
          </button>
        </div>
      </div>

      <span className={`text-xs px-2 py-1 rounded-full ${esSupervisor ? "bg-purple-800 text-purple-300" : "bg-purple-500 text-white"}`}>
        {esSupervisor ? "Supervisor" : "Administrador"}
      </span>

      {esSupervisor && (
        <>
          <p className="text-sm mb-2 mt-3 text-gray-300">Cuadrilla: {cuadrilla.length} miembros</p>
          <div className="bg-gray-700 p-3 rounded max-h-32 overflow-y-auto text-sm space-y-2">
            {cuadrilla.slice(0, 3).map((miembro, idx) => (
              <div key={idx} className="border-b border-gray-600 pb-1">
                <p className="font-semibold">{miembro.nombre}</p>
                <p className="text-xs text-gray-300">{miembro.codigo} — {miembro.area}</p>
              </div>
            ))}
            {cuadrilla.length > 3 && (
              <p className="text-xs text-gray-400 mt-2">+ {cuadrilla.length - 3} más...</p>
            )}
          </div>
          <div className="mt-4">
            <button
              className="w-full bg-purple-700 hover:bg-purple-800 text-sm py-2 rounded"
              onClick={() => navigate(`/cuadrilla/${usuario.id}`)}
            >
              Gestionar
            </button>
          </div>
        </>
      )}

      {editando && (
        <EditarUsuarioModal
          usuario={usuario}
          onClose={() => setEditando(false)}
          onActualizado={() => window.location.reload()}
        />
      )}
    </div>
  );
}
