import React, { useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";

export default function AsignarParticipantesModal({ horario, capacitacionId, onClose }) {
  const [participantes, setParticipantes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [area, setArea] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersRef = collection(db, "usuarios");
        const usersSnap = await getDocs(usersRef);
        const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsuarios(usersData);

        const participantsRef = collection(db, `capacitaciones/${capacitacionId}/horarios/${horario.id}/participantes`);
        const participantsSnap = await getDocs(participantsRef);
        const participantsData = participantsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setParticipantes(participantsData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [capacitacionId, horario.id]);

  const asignarExistente = async (usuario) => {
    if (participantes.find(p => p.codigo === usuario.codigo)) {
      alert("Este usuario ya está asignado.");
      return;
    }
    setIsSubmitting(true);
    try {
      const ref = collection(db, `capacitaciones/${capacitacionId}/horarios/${horario.id}/participantes`);
      const docRef = await addDoc(ref, usuario);
      setParticipantes([...participantes, { id: docRef.id, ...usuario }]);
      alert("Usuario asignado correctamente.");
    } catch (error) {
      console.error("Error asignando usuario:", error);
      alert("Hubo un error al asignar el usuario.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const agregarNuevo = async () => {
    if (!nombre.trim() || !codigo.trim() || !area.trim()) {
      alert("Todos los campos son obligatorios.");
      return;
    }
    setIsSubmitting(true);
    const nuevoParticipante = { nombre, codigo, area, tipo: "casual" };
    try {
      const ref = collection(db, `capacitaciones/${capacitacionId}/horarios/${horario.id}/participantes`);
      const docRef = await addDoc(ref, nuevoParticipante);
      setParticipantes([...participantes, { id: docRef.id, ...nuevoParticipante }]);
      setNombre("");
      setCodigo("");
      setArea("");
      alert("Participante agregado correctamente.");
    } catch (error) {
      console.error("Error agregando participante:", error);
      alert("Hubo un error al agregar el participante.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    u.codigo.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Asignar Participantes</h2>
        
        {loading ? <p>Cargando...</p> : (
          <>
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
                    className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
                    disabled={isSubmitting || participantes.some(p => p.codigo === u.codigo)}
                  >
                    {participantes.some(p => p.codigo === u.codigo) ? "Asignado" : "Asignar"}
                  </button>
                </div>
              ))}
            </div>

            <h3 className="font-bold text-gray-700 mb-2 mt-4">Agregar manualmente</h3>
            <input className="w-full p-2 border rounded mb-2" placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
            <input className="w-full p-2 border rounded mb-2" placeholder="Código" value={codigo} onChange={e => setCodigo(e.target.value)} />
            <input className="w-full p-2 border rounded mb-2" placeholder="Área" value={area} onChange={e => setArea(e.target.value)} />
            <button
                onClick={agregarNuevo}
                className="bg-green-600 text-white px-4 py-2 rounded mr-2 hover:bg-green-700 disabled:opacity-50"
                disabled={isSubmitting}
            >
                {isSubmitting ? "Guardando..." : "Guardar"}
            </button>
          </>
        )}

        <div className="mt-3">
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
