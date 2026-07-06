import React, { useEffect, useState } from "react";
import { db } from "../../../firebase/config";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { Trash2, Pencil } from "lucide-react";
import ImportarCuadrillaModal from "../components/ImportarCuadrillaModal";
import EditarUsuarioModal from "../components/EditarUsuarioModal";
import { BackButton, useToast, useConfirm, useAuth, rutaInicial } from "../../../shared";
import { useTurnosConfig } from "../../asignaciones";

export default function GestionarCuadrilla() {
  const { supervisorId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { isAdmin, supervisorId: miSupervisorId, rol } = useAuth();
  const { turnos: turnosConfig } = useTurnosConfig();

  // Un supervisor solo puede gestionar SU propia cuadrilla.
  useEffect(() => {
    if (!isAdmin && supervisorId !== miSupervisorId) {
      navigate(rutaInicial(rol), { replace: true });
    }
  }, [isAdmin, supervisorId, miSupervisorId, rol, navigate]);
  const [supervisor, setSupervisor] = useState(null);
  const [cuadrilla, setCuadrilla] = useState([]);
  const [mostrarImportarModal, setMostrarImportarModal] = useState(false);
  const [mostrarAgregarModal, setMostrarAgregarModal] = useState(false);
  const [editarMiembro, setEditarMiembro] = useState(null);
  const [editarSupervisor, setEditarSupervisor] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", codigo: "", area: "", tipo: "fijo" });

  const cargarCuadrilla = async () => {
    const q = query(collection(db, "cuadrilla"), where("supervisor_id", "==", supervisorId));
    const snap = await getDocs(q);
    setCuadrilla(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  const cargarSupervisor = async () => {
    const ref = doc(db, "usuarios", supervisorId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      setSupervisor({ id: snap.id, ...snap.data() });
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      await cargarSupervisor();
      await cargarCuadrilla();
    };
    cargarDatos();
  }, [supervisorId]);

  const agregar = async () => {
    if (!nuevo.nombre || !nuevo.area) {
      toast.error("Nombre y área son obligatorios");
      return;
    }
    await addDoc(collection(db, "cuadrilla"), {
      ...nuevo,
      supervisor_id: supervisorId,
    });
    setNuevo({ nombre: "", codigo: "", area: "", tipo: "fijo" });
    setMostrarAgregarModal(false);
    await cargarCuadrilla();
  };

  const eliminar = async (id) => {
    const ok = await confirm("¿Eliminar este miembro de la cuadrilla?", {
      title: "Eliminar miembro",
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!ok) return;
    await deleteDoc(doc(db, "cuadrilla", id));
    setCuadrilla((prev) => prev.filter((u) => u.id !== id));
  };

  return (
    <div className="p-6">
      {isAdmin ? (
        <BackButton to="/usuarios" label="Volver a Usuarios" className="mb-6" />
      ) : (
        <BackButton to="/mis-asignaciones" label="Volver a Mis Asignaciones" className="mb-6" />
      )}
      {supervisor && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600 mb-1">
              Cuadrilla de {supervisor.nombre}
            </h1>
            <p className="text-sm text-gray-500">
              Usuario: {supervisor.usuario} | Código: {supervisor.codigo} | Turno:{" "}
              {(() => {
                const t = turnosConfig[supervisor.turno || "dia"];
                const modo = supervisor.turno_modo === "fijo" ? "fijo" : "rotativo";
                return t ? `${t.nombre} (${t.inicio}-${t.fin}) · ${modo}` : "sin definir";
              })()}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setEditarSupervisor(true)}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors shrink-0"
            >
              <Pencil className="w-4 h-4" />
              Editar datos generales
            </button>
          )}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMostrarAgregarModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
        >
          + Añadir persona
        </button>
        <button
          onClick={() => setMostrarImportarModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          Importar cuadrilla
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cuadrilla.map((u) => (
          <div
            key={u.id}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex-1 mb-4">
              <p className="text-sm font-semibold text-gray-500">{u.codigo || 'Sin código'}</p>
              <h3 className="text-lg font-bold text-gray-900">{u.nombre}</h3>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => setEditarMiembro(u)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                title="Editar"
              >
                <Pencil size={16} />
                Editar
              </button>
              <button
                onClick={() => eliminar(u.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                title="Eliminar"
              >
                <Trash2 size={16} />
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {mostrarImportarModal && (
        <ImportarCuadrillaModal
          supervisorId={supervisorId}
          onClose={() => setMostrarImportarModal(false)}
          onImportado={cargarCuadrilla}
        />
      )}

      {mostrarAgregarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-purple-700 mb-4">Añadir Persona</h2>
            <div className="space-y-4">
              <input
                placeholder="Nombre"
                value={nuevo.nombre}
                onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                placeholder="Código"
                value={nuevo.codigo}
                onChange={(e) => setNuevo({ ...nuevo, codigo: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                placeholder="Área"
                value={nuevo.area}
                onChange={(e) => setNuevo({ ...nuevo, area: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <select
                value={nuevo.tipo}
                onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}
                className="w-full border p-2 rounded"
              >
                <option value="fijo">Fijo</option>
                <option value="casual">Casual</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setMostrarAgregarModal(false)} className="bg-gray-300 px-4 py-2 rounded">
                Cancelar
              </button>
              <button onClick={agregar} className="bg-purple-600 text-white px-4 py-2 rounded">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {editarMiembro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-purple-700 mb-4">Editar Persona</h2>
            <div className="space-y-4">
              <input
                placeholder="Nombre"
                value={editarMiembro.nombre}
                onChange={(e) => setEditarMiembro({ ...editarMiembro, nombre: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                placeholder="Código"
                value={editarMiembro.codigo}
                onChange={(e) => setEditarMiembro({ ...editarMiembro, codigo: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                placeholder="Área"
                value={editarMiembro.area}
                onChange={(e) => setEditarMiembro({ ...editarMiembro, area: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <select
                value={editarMiembro.tipo}
                onChange={(e) => setEditarMiembro({ ...editarMiembro, tipo: e.target.value })}
                className="w-full border p-2 rounded"
              >
                <option value="fijo">Fijo</option>
                <option value="casual">Casual</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setEditarMiembro(null)} className="bg-gray-300 px-4 py-2 rounded">
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await updateDoc(doc(db, "cuadrilla", editarMiembro.id), editarMiembro);
                  setEditarMiembro(null);
                  await cargarCuadrilla();
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {editarSupervisor && supervisor && (
        <EditarUsuarioModal
          usuario={supervisor}
          onClose={() => setEditarSupervisor(false)}
          onActualizado={cargarSupervisor}
        />
      )}
    </div>
  );
}
