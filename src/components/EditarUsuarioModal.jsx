import React, { useState, useEffect } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export default function EditarUsuarioModal({ usuario, onClose, onActualizado }) {
  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    contraseña: "",
    codigo: "",
  });

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre: usuario.nombre || "",
        usuario: usuario.usuario || "",
        contraseña: usuario.contraseña || "",
        codigo: usuario.codigo || "",
      });
    }
  }, [usuario]);

  const handleUpdate = async () => {
    const ref = doc(db, "usuarios", usuario.id);
    await updateDoc(ref, form);
    onActualizado();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-purple-700 mb-6">Editar Usuario</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Código personal</label>
            <input
              type="text"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded focus:outline-purple-500 text-gray-900"
              placeholder="Ej. 5599"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nombre completo</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded focus:outline-purple-500 text-gray-900"
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Correo o usuario</label>
            <input
              type="text"
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded focus:outline-purple-500 text-gray-900"
              placeholder="Ej. juanperez@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
            <input
              type="text"
              value={form.contraseña}
              onChange={(e) => setForm({ ...form, contraseña: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded focus:outline-purple-500 text-gray-900"
              placeholder="Nueva contraseña"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpdate}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
