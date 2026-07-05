import React, { useState, useEffect } from "react";
import { doc, updateDoc, deleteField } from "firebase/firestore";
import { startOfWeek, format } from "date-fns";
import { Pencil, ShieldCheck, KeyRound } from "lucide-react";
import { db } from "../../../firebase/config";
import { useToast, usuarioToEmail, crearCuentaAuth } from "../../../shared";
import { TURNO_IDS, useTurnosConfig } from "../../asignaciones";

export default function EditarUsuarioModal({ usuario, onClose, onActualizado }) {
  const toast = useToast();
  const { turnos: turnosConfig } = useTurnosConfig();
  const [form, setForm] = useState({
    nombre: "",
    codigo: "",
    usuario: "",
    turno: "dia",
    turno_modo: "rotativo",
  });
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [guardando, setGuardando] = useState(false);

  const esSupervisor = usuario?.rol === "supervisor";
  const tieneAccesoSeguro = Boolean(usuario?.authUid);

  useEffect(() => {
    if (usuario) {
      setForm({
        nombre: usuario.nombre || "",
        codigo: usuario.codigo || "",
        usuario: usuario.usuario || "",
        turno: usuario.turno || "dia",
        turno_modo: usuario.turno_modo || "rotativo",
      });
    }
  }, [usuario]);

  const handleGuardar = async () => {
    if (!form.nombre || !form.usuario) {
      toast.error("Nombre y usuario/correo son obligatorios.");
      return;
    }
    if (!tieneAccesoSeguro && nuevaPassword && nuevaPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setGuardando(true);
    try {
      let authUid = usuario.authUid || null;
      // Si aún no tiene cuenta segura y el admin escribió una contraseña,
      // se activa el acceso seguro en el mismo paso.
      if (!tieneAccesoSeguro && nuevaPassword) {
        authUid = await crearCuentaAuth(usuarioToEmail(form.usuario), nuevaPassword);
      }

      const payload = {
        nombre: form.nombre,
        codigo: form.codigo,
        usuario: form.usuario,
      };
      if (esSupervisor) {
        payload.turno = form.turno;
        payload.turno_modo = form.turno_modo;
        // La semana de referencia solo importa para el modo rotativo;
        // se actualiza igual para que, si cambia a rotativo más tarde,
        // arranque la rotación desde la semana en que se guardó.
        payload.turno_semana = format(
          startOfWeek(new Date(), { weekStartsOn: 1 }),
          "yyyy-MM-dd"
        );
      }
      if (authUid) {
        payload.authUid = authUid;
        // Nunca debe quedar una contraseña en texto plano una vez hay acceso seguro.
        payload.contraseña = deleteField();
        payload.contrasena = deleteField();
        payload.password = deleteField();
      }

      await updateDoc(doc(db, "usuarios", usuario.id), payload);
      toast.success("Datos actualizados correctamente.");
      onActualizado();
      onClose();
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("Ese nombre de usuario ya tiene una cuenta de acceso.");
      } else if (error.code === "auth/weak-password") {
        toast.error("La contraseña es demasiado débil.");
      } else {
        console.error("Error al actualizar usuario:", error);
        toast.error("No se pudo guardar. Intenta de nuevo.");
      }
    } finally {
      setGuardando(false);
    }
  };

  if (!usuario) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Pencil className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Editar datos generales</h2>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Nombre completo</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Código personal</label>
            <input
              type="text"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              placeholder="Ej. 5599"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Usuario / correo</label>
            <input
              type="text"
              value={form.usuario}
              onChange={(e) => setForm({ ...form, usuario: e.target.value })}
              disabled={tieneAccesoSeguro}
              className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500"
            />
            {tieneAccesoSeguro && (
              <p className="text-xs text-gray-400 mt-1">
                No editable: ya tiene una cuenta de acceso vinculada a este usuario.
              </p>
            )}
          </div>
          {esSupervisor && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Turno</label>
                <select
                  value={form.turno}
                  onChange={(e) => setForm({ ...form, turno: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                >
                  {TURNO_IDS.map((id) => {
                    const t = turnosConfig[id];
                    return (
                      <option key={id} value={id}>
                        {t?.nombre || id} ({t?.inicio}-{t?.fin})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Modo</label>
                <select
                  value={form.turno_modo}
                  onChange={(e) => setForm({ ...form, turno_modo: e.target.value })}
                  className="w-full border border-gray-300 p-2.5 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="rotativo">Rotativo (cambia cada semana)</option>
                  <option value="fijo">Fijo (siempre el mismo)</option>
                </select>
              </div>
            </div>
          )}

          {/* Contraseña: bloqueada si ya tiene cuenta segura; si no, se puede activar aquí mismo */}
          {tieneAccesoSeguro ? (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
              <ShieldCheck className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
              <p className="text-xs text-green-800">
                Acceso seguro activo. Para restablecer la contraseña, hazlo desde la
                consola de Firebase (ver SEGURIDAD.md).
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-600 mb-1 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-600" /> Activar acceso seguro (opcional)
              </label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Nueva contraseña (mín. 6 caracteres)"
                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Si la escribes, se creará una cuenta de acceso real para este usuario.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={guardando}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-shadow disabled:opacity-60"
          >
            {guardando && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
