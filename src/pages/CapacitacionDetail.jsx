import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { format } from 'date-fns';

const CapacitacionDetail = () => {
  const { id } = useParams();
  const [capacitacion, setCapacitacion] = useState(null);
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null); // controla el bloque desplegado

  useEffect(() => {
    const fetchCapacitacion = async () => {
      const ref = doc(db, 'capacitaciones', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setCapacitacion({ id: snap.id, ...snap.data() });
      }
    };

    const fetchHorarios = async () => {
      const q = query(
        collection(db, 'capacitacion_bloques'),
        where('capacitacion_id', '==', id)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBloques(data);
    };

    Promise.all([fetchCapacitacion(), fetchHorarios()]).finally(() =>
      setLoading(false)
    );
  }, [id]);

  const toggleExpand = (bloqueId) => {
    setExpandido((prev) => (prev === bloqueId ? null : bloqueId));
  };

  if (loading) return <div className="p-6">Cargando...</div>;
  if (!capacitacion) return <div className="p-6">No se encontró la capacitación</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{capacitacion.titulo}</h1>
      <p className="text-gray-600 mb-1">{capacitacion.descripcion}</p>
      <p className="text-sm mb-1">
        📅 {format(new Date(capacitacion.fecha_inicio), 'dd MMM yyyy')} a{' '}
        {format(new Date(capacitacion.fecha_fin), 'dd MMM yyyy')}
      </p>
      <p className="text-sm mb-1">
        ⏱️ {capacitacion.duracion_bloque} minutos | 👥 {capacitacion.cupo_bloque} cupos
      </p>
      <p className="text-sm text-gray-500 mb-6">
        {capacitacion.descanso_medio_dia
          ? '🕛 Con descanso de 12:00 a 14:00'
          : '🔁 Jornada completa'}
      </p>

      <h2 className="text-xl font-semibold mb-3">Bloques y participantes</h2>

      {bloques.length > 0 ? (
        <div className="space-y-2">
          {bloques.map((bloque) => (
            <div
              key={bloque.id}
              onClick={() => toggleExpand(bloque.id)}
              className={`border rounded-lg px-4 py-2 cursor-pointer transition-all duration-200 ${
                expandido === bloque.id ? 'bg-purple-50 shadow-sm' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">
                    {format(new Date(bloque.fecha), 'dd MMM yyyy')} — {bloque.hora_inicio} a {bloque.hora_fin}
                  </p>
                </div>
                <span className="text-sm text-gray-700">
                  👥 {bloque.participantes?.length || 0} inscritos / {bloque.cupo_disponible} cupos disponibles
                </span>
              </div>

              {expandido === bloque.id && (
                <div className="mt-2 ml-4 text-sm text-gray-700">
                  {bloque.participantes && bloque.participantes.length > 0 ? (
                    <ul className="list-disc pl-4">
                      {bloque.participantes.map((p, idx) => (
                        <li key={idx}>
                          {typeof p === 'string' ? p : p.nombre || p.uid}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="italic text-gray-500">Sin participantes registrados</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No hay bloques generados.</p>
      )}
    </div>
  );
};

export default CapacitacionDetail;
