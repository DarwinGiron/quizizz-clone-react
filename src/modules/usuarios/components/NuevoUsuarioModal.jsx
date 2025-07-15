import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../../firebase/config";

export default function NuevoUsuarioModal({ onClose, onUsuarioCreado }) {
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    area: "",
    tipo: "fijo",
    supervisor_id: "",
  });
  const [supervisores, setSupervisores] = useState([]);

  useEffect(() => {
    const fetchSupervisores = async () => {
      const snap = await getDocs(collection(db, "usuarios"));
      const sup = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.rol === "supervisor");
      setSupervisores(sup);
    };
    fetchSupervisores();
  }, []);

  const handleSubmit = async () => {
    if (!form.nombre || !form.codigo || !form.area || !form.supervisor_id) {
      alert("Completa todos los campos");
      return;
    }

    await addDoc(collection(db, "usuarios"), form);
    onUsuarioCreado(); // para recargar
    onClose(); // cerrar modal
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-xl p-6">
        <h2 className="text-xl font-bold mb-4 text-purple-700">Nuevo Usuario</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Código"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            className="border p-2 rounded"
          />
          <input
            placeholder="Área"
            value={form.area}
            onChange={(e) => setForm({ ...form, area: e.target.value })}
            className="border p-2 rounded"
          />
          <select
            value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="border p-2 rounded"
          >
            <option value="fijo">Fijo</option>
            <option value="casual">Casual</option>
          </select>
          <select
            value={form.supervisor_id}
            onChange={(e) => setForm({ ...form, supervisor_id: e.target.value })}
            className="border p-2 rounded col-span-2"
          >
            <option value="">-- Selecciona supervisor --</option>
            {supervisores.map((s) => (
              <option key={s.id} value={s.id}>{s.nombre}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
