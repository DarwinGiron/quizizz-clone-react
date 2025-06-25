import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';

const CapacitacionesDashboard = () => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCapacitaciones = async () => {
      const snapshot = await getDocs(collection(db, 'capacitaciones'));
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCapacitaciones(lista);
    };

    fetchCapacitaciones();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Capacitaciones</h1>
        <Link to="/capacitaciones/nueva">
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            + Nueva Capacitación
          </button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {capacitaciones.length > 0 ? (
          capacitaciones.map((cap) => (
            <div
              key={cap.id}
              onClick={() => navigate(`/capacitaciones/${cap.id}/detalle`)}
              className="bg-white rounded-2xl shadow-md p-5 border hover:shadow-xl transition-all cursor-pointer group relative"
            >
              <h2 className="text-xl font-bold mb-2 group-hover:text-purple-700">{cap.titulo}</h2>
              <p className="text-sm text-gray-600 mb-1">{cap.descripcion}</p>
              <p className="text-sm">
                📅 <strong>{format(new Date(cap.fecha_inicio), 'dd MMM yyyy')}</strong> a{' '}
                <strong>{format(new Date(cap.fecha_fin), 'dd MMM yyyy')}</strong>
              </p>
              <p className="text-sm">
                ⏱️ Bloques de <strong>{cap.duracion_bloque} min</strong> | 👥{' '}
                <strong>{cap.cupo_bloque} cupos</strong>
              </p>
              <p className="text-sm text-gray-500">
                {cap.descanso_medio_dia
                  ? '🕛 Con descanso de 12:00 a 14:00'
                  : '🔁 Jornada completa'}
              </p>
              {/* Botón para editar que no propaga el click */}
              <div className="mt-4 flex justify-end">
                <Link
                  to={`/capacitaciones/${cap.id}/edit`}
                  onClick={(e) => e.stopPropagation()} // Previene navegación al detalle
                >
                  <button className="text-purple-600 font-semibold hover:underline">
                    Editar
                  </button>
                </Link>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No hay capacitaciones registradas.</p>
        )}
      </div>
    </div>
  );
};

export default CapacitacionesDashboard;
