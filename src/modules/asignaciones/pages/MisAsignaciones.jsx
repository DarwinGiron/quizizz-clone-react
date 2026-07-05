import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, ClipboardList, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../shared';
import { tieneCuotas } from '../utils/cuotas';

export default function MisAsignaciones() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  const normalizar = (cap) => ({
    ...cap,
    titulo: cap.titulo ?? cap.nombre ?? '',
    descripcion: cap.descripcion ?? '',
    fechaInicio: cap.fecha_inicio ?? cap.fechaInicio ?? null,
    fechaFin: cap.fecha_fin ?? cap.fechaFin ?? null,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'capacitaciones'));
        const data = snapshot.docs
          .map((d) => normalizar({ id: d.id, ...d.data() }))
          .filter((cap) => cap.asignacion_cerrada !== true);
        setCapacitaciones(data);
      } catch (error) {
        console.error('Error al cargar capacitaciones:', error);
        setCapacitaciones([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
          <p className="text-gray-600">Cargando capacitaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
          Mis Asignaciones
        </h1>
        <p className="text-gray-600">
          Hola {user?.nombre || 'supervisor'}, asigna a tu cuadrilla en los
          horarios disponibles.
        </p>
      </div>

      {capacitaciones.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay capacitaciones activas
            </h3>
            <p className="text-gray-500">
              Cuando el administrador habilite una capacitación, aparecerá aquí.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {capacitaciones.map((cap) => (
            <button
              key={cap.id}
              onClick={() => navigate(`/mis-asignaciones/${cap.id}`)}
              className="text-left bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <div className="p-6 pb-4 flex-1">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                    {cap.titulo || 'Sin título'}
                  </h2>
                  {tieneCuotas(cap.asignacion_config) && (
                    <span className="flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Con cuotas
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-3">
                  {cap.descripcion || 'Sin descripción disponible.'}
                </p>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {formatDate(cap.fechaInicio)} - {formatDate(cap.fechaFin)}
                  </span>
                </div>
              </div>
              <div className="px-6 pb-6">
                <span className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
                  <Users className="w-4 h-4" />
                  Asignar mi cuadrilla
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
