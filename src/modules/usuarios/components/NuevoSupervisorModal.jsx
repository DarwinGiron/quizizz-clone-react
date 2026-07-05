import React, { useState } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useNavigate } from "react-router-dom";
import { startOfWeek, format } from "date-fns";
import { TURNO_IDS, labelTurno } from "../../asignaciones/utils/turnos";
import { useToast } from "../../../shared";

export default function NuevoSupervisorModal({ onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    contraseña: "",
    codigo: "",
    rol: "supervisor",
    turno: "dia",
  });

  const handleSubmit = async () => {
    const { nombre, usuario, contraseña, codigo } = form;
    if (!nombre || !usuario || !contraseña || !codigo) {
      toast.error("Completa todos los campos");
      return;
    }

    const q = query(collection(db, "usuarios"), where("usuario", "==", usuario));
    const snap = await getDocs(q);
    if (!snap.empty) {
      toast.error("Este usuario ya existe.");
      return;
    }

    const turno_semana = format(
      startOfWeek(new Date(), { weekStartsOn: 1 }),
      "yyyy-MM-dd"
    );
    await addDoc(collection(db, "usuarios"), { ...form, turno_semana });

    // Redirige a /usuarios y recarga la página
    navigate("/usuarios", { replace: true });
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-purple-700">Nuevo Supervisor</h2>

        <div className="space-y-4 mb-4">
          <input
            placeholder="Código personal"
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <input
            placeholder="Nombre completo"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <input
            placeholder="Correo o usuario"
            value={form.usuario}
            onChange={(e) => setForm({ ...form, usuario: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <input
            placeholder="Contraseña"
            type="password"
            value={form.contraseña}
            onChange={(e) => setForm({ ...form, contraseña: e.target.value })}
            className="border p-2 rounded w-full"
          />
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Turno (semana actual)
            </label>
            <select
              value={form.turno}
              onChange={(e) => setForm({ ...form, turno: e.target.value })}
              className="border p-2 rounded w-full bg-white"
            >
              {TURNO_IDS.map((id) => (
                <option key={id} value={id}>
                  {labelTurno(id)}
                </option>
              ))}
            </select>
          </div>
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
            Crear Supervisor
          </button>
        </div>
      </div>
    </div>
  );
}
