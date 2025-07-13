import React, { useEffect, useState } from "react";
import { db } from "../firebase/config";
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
import { Trash2, Pencil } from "lucide-react";
import ImportarCuadrillaModal from "../components/ImportarCuadrillaModal";
import BackButton from "../components/BackButton";

export default function GestionarCuadrilla() {
  const { supervisorId } = useParams();
  const [supervisor, setSupervisor] = useState(null);
  const [cuadrilla, setCuadrilla] = useState([]);
  const [mostrarImportarModal, setMostrarImportarModal] = useState(false);
  const [mostrarAgregarModal, setMostrarAgregarModal] = useState(false);
  const [editarMiembro, setEditarMiembro] = useState(null);
  const [nuevo, setNuevo] = useState({ nombre: "", codigo: "", area: "", tipo: "fijo" });

  const cargarCuadrilla = async () => {
    const q = query(collection(db, "cuadrilla"), where("supervisor_id", "==", supervisorId));
    const snap = await getDocs(q);
    setCuadrilla(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    const cargarDatos = async () => {
      const ref = doc(db, "usuarios", supervisorId);
      const snap = await getDoc(ref);
      if (snap.exists()) setSupervisor({ id: snap.id, ...snap.data() });
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

  return (
    <div className="p-6">
      <BackButton to="/usuarios" label="Volver a Usuarios" className="mb-6" />
      {supervisor && (
        <>
          <h1 className="text-2xl font-bold text-purple-600 mb-1">
            Cuadrilla de {supervisor.nombre}
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Usuario: {supervisor.usuario} | Código: {supervisor.codigo}
          </p>
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
          📁 Importar cuadrilla
        </button>
      </div>

      <div className="space-y-2">
        {cuadrilla.map((u) => (
          <div
            key={u.id}
            className="bg-gray-800 text-white p-4 rounded flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{u.nombre}</p>
              <p className="text-sm text-gray-300">
                {u.codigo || "Sin código"} — {u.area || "Sin área"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditarMiembro(u)}
                className="text-blue-300 hover:text-blue-200"
                title="Editar"
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => eliminar(u.id)}
                className="text-red-400 hover:text-red-300"
                title="Eliminar"
              >
                <Trash2 size={18} />
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
