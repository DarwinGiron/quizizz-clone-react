import React, { useState } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { useNavigate } from "react-router-dom";
import { startOfWeek, format } from "date-fns";
import { TURNO_IDS, labelTurno } from "../../asignaciones/utils/turnos";
import { useToast, usuarioToEmail, crearCuentaAuth } from "../../../shared";

export default function NuevoSupervisorModal({ onClose }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    usuario: "",
    contraseña: "",
    codigo: "",
    rol: "supervisor",
    turno: "dia",
  });

  const handleSubmit = async () => {
    const { nombre, usuario, contraseña, codigo, ...resto } = form;
    if (!nombre || !usuario || !contraseña || !codigo) {
      toast.error("Completa todos los campos");
      return;
    }
    if (contraseña.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    const q = query(collection(db, "usuarios"), where("usuario", "==", usuario));
    const snap = await getDocs(q);
    if (!snap.empty) {
      toast.error("Este usuario ya existe.");
      return;
    }

    setGuardando(true);
    try {
      // Cuenta real de Firebase Auth con email sintético (usuario@supervisores.app).
      // Se crea con una instancia secundaria para no cerrar la sesión del admin.
      const authUid = await crearCuentaAuth(usuarioToEmail(usuario), contraseña);

      const turno_semana = format(
        startOfWeek(new Date(), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
      // Sin campo de contraseña: la validación vive en Firebase Auth, no en Firestore.
      await addDoc(collection(db, "usuarios"), {
        nombre,
        usuario,
        codigo,
        authUid,
        ...resto,
        turno_semana,
      });

      navigate("/usuarios", { replace: true });
      window.location.reload();
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("Ese nombre de usuario ya tiene una cuenta de acceso.");
      } else if (error.code === "auth/weak-password") {
        toast.error("La contraseña es demasiado débil.");
      } else {
        console.error("Error al crear supervisor:", error);
        toast.error("No se pudo crear el supervisor. Intenta de nuevo.");
      }
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4 text-indigo-700">Nuevo Supervisor</h2>

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
            placeholder="Nombre de usuario (sin espacios, ej. jperez)"
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
            disabled={guardando}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={guardando}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-60"
          >
            {guardando && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {guardando ? "Creando..." : "Crear Supervisor"}
          </button>
        </div>
      </div>
    </div>
  );
}
