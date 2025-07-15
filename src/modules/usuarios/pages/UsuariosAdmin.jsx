import React, { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import {
  collection,
  getDocs,
  query,
  where
} from "firebase/firestore";
import { UsuarioCard } from '../../usuarios';
import { NuevoUsuarioModal } from '../../usuarios';
import NuevoSupervisorModal from "../components/NuevoSupervisorModal";

export default function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [cuadrillas, setCuadrillas] = useState({});
  const [mostrarModal, setMostrarModal] = useState(false);

  const cargarDatos = async () => {
    const usuariosSnap = await getDocs(collection(db, "usuarios"));
    const usuariosData = usuariosSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setUsuarios(usuariosData);

    // Agrupar cuadrillas por supervisor desde la colección 'cuadrilla'
    const cuadrillasPorSupervisor = {};
    for (const supervisor of usuariosData.filter(u => u.rol === "supervisor")) {
      const q = query(collection(db, "cuadrilla"), where("supervisor_id", "==", supervisor.id));
      const snap = await getDocs(q);
      cuadrillasPorSupervisor[supervisor.id] = snap.docs.map(d => d.data());
    }
    setCuadrillas(cuadrillasPorSupervisor);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-purple-400">Gestión de Usuarios</h1>
        <button
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow"
          onClick={() => setMostrarModal(true)}
        >
          + Nuevo Usuario
        </button>
      </div>

      <p className="text-sm text-gray-400 mb-6">Administra usuarios y sus cuadrillas.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {usuarios.map((user) => (
          <UsuarioCard
            key={user.id}
            usuario={user}
            cuadrilla={cuadrillas[user.id] || []}
          />
        ))}
      </div>

      {mostrarModal && (
        <NuevoSupervisorModal
          onClose={() => setMostrarModal(false)}
          onUsuarioCreado={cargarDatos}
        />
      )}
    </div>
  );
}
