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
import { useParams } from "react-router-dom";
import { Trash2, Pencil, Clock, Save } from "lucide-react";
import { startOfWeek, format } from "date-fns";
import ImportarCuadrillaModal from "../components/ImportarCuadrillaModal";
import { BackButton } from "../../../shared";
import { TURNO_IDS, labelTurno } from "../../asignaciones/utils/turnos";

export default function GestionarCuadrilla() {
  const { supervisorId } = useParams();
  const [supervisor, setSupervisor] = useState(null);
  const [cuadrilla, setCuadrilla] = useState([]);
  const [mostrarImportarModal, setMostrarImportarModal] = useState(false);
  const [mostrarAgregarModal, setMostrarAgregarModal] = useState(false);
  const [editarMiembro, setEditarMiembro] = useState(null);
  const [nuevo, setNuevo] = useState({ nombre: "", codigo: "", area: "", tipo: "fijo" });
  const [turno, setTurno] = useState("dia");
  const [guardandoTurno, setGuardandoTurno] = useState(false);
  const [turnoGuardado, setTurnoGuardado] = useState(false);

  const cargarCuadrilla = async () => {
    const q = query(collection(db, "cuadrilla"), where("supervisor_id", "==", supervisorId));
    const snap = await getDocs(q);
    setCuadrilla(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    const cargarDatos = async () => {
      const ref = doc(db, "usuarios", supervisorId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setSupervisor(data);
        setTurno(data.turno || "dia");
      }
      await cargarCuadrilla();
    };
    cargarDatos();
  }, [supervisorId]);

  const agregar = async () => {
    if (!nuevo.nombre || !nuevo.area) {
      alert("Nombre y área son obligatorios");
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
    if (!window.confirm("¿Eliminar este miembro de la cuadrilla?")) return;
    await deleteDoc(doc(db, "cuadrilla", id));
    setCuadrilla((prev) => prev.filter((u) => u.id !== id));
  };

  const guardarTurno = async () => {
    setGuardandoTurno(true);
    setTurnoGuardado(false);
    try {
      // El turno seleccionado corresponde a la semana actual (lunes de referencia).
      const semanaRef = format(
        startOfWeek(new Date(), { weekStartsOn: 1 }),
        "yyyy-MM-dd"
      );
      await updateDoc(doc(db, "usuarios", supervisorId), {
        turno,
        turno_semana: semanaRef,
      });
      setSupervisor((prev) =>
        prev ? { ...prev, turno, turno_semana: semanaRef } : prev
      );
      setTurnoGuardado(true);
      setTimeout(() => setTurnoGuardado(false), 2500);
    } catch (error) {
      console.error("Error al guardar turno:", error);
      alert("No se pudo guardar el turno.");
    } finally {
      setGuardandoTurno(false);
    }
  };

  return (
    <div className="p-6">
      <BackButton to="/usuarios" label="Volver a Usuarios" className="mb-6" />
      {supervisor && (
        <>
          <h1 className="text-2xl font-bold text-purple-600 mb-1">
            Cuadrilla de {supervisor.nombre}
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            Usuario: {supervisor.usuario} | Código: {supervisor.codigo}
          </p>

          {/* Turno rotativo de la cuadrilla */}
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 max-w-xl">
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-semibold">Turno (semana actual)</span>
            </div>
            <select
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {TURNO_IDS.map((id) => (
                <option key={id} value={id}>
                  {labelTurno(id)}
                </option>
              ))}
            </select>
            <button
              onClick={guardarTurno}
              disabled={guardandoTurno}
              className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-60"
            >
              <Save className="w-4 h-4" />
              {guardandoTurno ? "Guardando..." : "Guardar turno"}
            </button>
            {turnoGuardado && (
              <span className="text-sm text-green-600 font-medium">Guardado ✓</span>
            )}
          </div>
        </>
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
    </div>
  );
}
