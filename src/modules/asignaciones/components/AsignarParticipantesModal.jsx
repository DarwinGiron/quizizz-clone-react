import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase/config";
import { ParticipanteItem } from '../../usuarios';

export default function AsignarParticipantesModal({ horario, capacitacionId, onClose }) {
  const [participantes, setParticipantes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState("");

  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [area, setArea] = useState("");

  // Traer usuarios fijos
  useEffect(() => {
    const fetchUsuarios = async () => {
      const ref = collection(db, "usuarios");
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(data);
    };

    const fetchParticipantes = async () => {
      const ref = collection(db, `capacitaciones/${capacitacionId}/horarios/${horario.id}/participantes`);
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setParticipantes(data);
    };

    fetchUsuarios();
    fetchParticipantes();
  }, [capacitacionId, horario.id]);

  const asignarExistente = async (usuario) => {
    const yaExiste = participantes.find(p => p.codigo === usuario.codigo);
    if (yaExiste) return alert("Este usuario ya está asignado.");
    const ref = collection(db, `capacitaciones/${capacitacionId}/horarios/${horario.id}/participantes`);
    await addDoc(ref, usuario);
    onClose();
  };

  const agregarNuevo = async () => {
    if (!nombre.trim()) return;
    const ref = collection(db, `capacitaciones/${capacitacionId}/horarios/${horario.id}/participantes`);
    await addDoc(ref, { nombre, codigo, area, tipo: "casual" });
    onClose();
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    u.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Asignar Participantes</h2>

        <h3 className="font-bold text-gray-700 mb-2">Buscar personal fijo</h3>
        <input
          type="text"
          className="w-full p-2 border rounded mb-2"
          placeholder="Buscar por nombre o código"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />

        <div className="max-h-40 overflow-y-auto mb-4">
          {usuariosFiltrados.map(u => (
            <div key={u.id} className="flex justify-between items-center p-2 border-b">
              <div>
                <p className="text-sm font-medium">{u.nombre} ({u.codigo})</p>
                <p className="text-xs text-gray-500">Área: {u.area} – Tipo: {u.tipo}</p>
              </div>
              <button
                onClick={() => asignarExistente(u)}
                className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
              >
                Asignar
              </button>
            </div>
          ))}
        </div>

        <h3 className="font-bold text-gray-700 mb-2 mt-4">Agregar manualmente</h3>
        <input className="w-full p-2 border rounded mb-2" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
        <input className="w-full p-2 border rounded mb-2" placeholder="Código" value={codigo} onChange={e => setCodigo(e.target.value)} />
        <input className="w-full p-2 border rounded mb-2" placeholder="Área" value={area} onChange={e => setArea(e.target.value)} />

        <div className="mt-3">
          <button
            onClick={agregarNuevo}
            className="bg-green-600 text-white px-4 py-2 rounded mr-2 hover:bg-green-700"
          >
            Guardar
          </button>
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
