import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';

export default function Asignaciones() {
  const [capacitaciones, setCapacitaciones] = useState([]);

  useEffect(() => {
    const fetchCapacitaciones = async () => {
      const ref = collection(db, 'capacitaciones');
      const snapshot = await getDocs(ref);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCapacitaciones(data);
    };
    fetchCapacitaciones();
  }, []);

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 ml-60">
        <h1 className="text-3xl font-bold mb-6">Asignar horarios</h1>

        {capacitaciones.length === 0 ? (
          <p className="text-gray-500">No hay capacitaciones disponibles.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capacitaciones.map((cap) => (
              <div key={cap.id} className="bg-white rounded-lg shadow p-5 border hover:shadow-md transition">
                <h2 className="text-xl font-semibold text-purple-700 mb-2">{cap.titulo || 'Sin título'}</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {cap.descripcion ? cap.descripcion.slice(0, 100) + '...' : 'Sin descripción disponible.'}
                </p>
                <Link
                  to={`/asignaciones/avanzada/${cap.id}`}
                  className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
                >
                  Asignar personal
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
