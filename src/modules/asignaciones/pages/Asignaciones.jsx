import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Users,
  Sparkles,
  SlidersHorizontal,
  ClipboardList,
  ArrowRight,
  Hand,
  CalendarRange,
  Zap,
} from 'lucide-react';

const DATOS_EJEMPLO = [
  {
    id: 'ejemplo1',
    titulo: 'Seguridad Industrial y Prevención de Riesgos',
    descripcion:
      'Capacitación integral sobre normas de seguridad, identificación de riesgos y uso correcto de equipos de protección personal en el ambiente laboral.',
    fechaInicio: '2025-01-15',
    fechaFin: '2025-01-30',
    duracionBloque: 60,
    cupoBloque: 25,
  },
  {
    id: 'ejemplo2',
    titulo: 'Manejo de Equipos Pesados',
    descripcion:
      'Curso práctico para la operación segura y eficiente de maquinaria pesada, incluyendo mantenimiento básico y procedimientos de emergencia.',
    fechaInicio: '2025-01-20',
    fechaFin: '2025-02-05',
    duracionBloque: 90,
    cupoBloque: 15,
  },
  {
    id: 'ejemplo3',
    titulo: 'Primeros Auxilios en el Trabajo',
    descripcion:
      'Formación esencial en técnicas de primeros auxilios, RCP y manejo de emergencias médicas en el entorno laboral.',
    fechaInicio: '2025-02-01',
    fechaFin: '2025-02-10',
    duracionBloque: 45,
    cupoBloque: 20,
  },
  {
    id: 'ejemplo4',
    titulo: 'Liderazgo y Gestión de Equipos',
    descripcion:
      'Desarrollo de habilidades directivas, comunicación efectiva y técnicas de motivación para supervisores y jefes de cuadrilla.',
    fechaInicio: '2025-01-10',
    fechaFin: '2025-01-12',
    duracionBloque: 120,
    cupoBloque: 12,
  },
  {
    id: 'ejemplo5',
    titulo: 'Calidad y Mejora Continua',
    descripcion:
      'Metodologías de control de calidad, implementación de mejoras y optimización de procesos productivos.',
    fechaInicio: '2025-03-01',
    fechaFin: '2025-03-15',
    duracionBloque: 75,
    cupoBloque: 30,
  },
];

export default function Asignaciones() {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCapacitaciones = async () => {
      try {
        const ref = collection(db, 'capacitaciones');
        const snapshot = await getDocs(ref);
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCapacitaciones(data.length === 0 ? DATOS_EJEMPLO : data);
      } catch (error) {
        console.error('Error al cargar capacitaciones:', error);
        setCapacitaciones(DATOS_EJEMPLO);
      } finally {
        setLoading(false);
      }
    };
    fetchCapacitaciones();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getStatusColor = (fechaInicio, fechaFin) => {
    const now = new Date();
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (now < inicio) return 'bg-blue-100 text-blue-800';
    if (now > fin) return 'bg-gray-100 text-gray-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (fechaInicio, fechaFin) => {
    const now = new Date();
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    if (now < inicio) return 'Próximamente';
    if (now > fin) return 'Finalizada';
    return 'En progreso';
  };

  const calculateDuration = (fechaInicio, fechaFin) => {
    if (!fechaInicio || !fechaFin) return null;
    try {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const diffTime = Math.abs(fin - inicio);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays === 1) return '1 día';
      if (diffDays < 7) return `${diffDays} días`;
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      if (weeks === 1 && remainingDays === 0) return '1 semana';
      if (weeks >= 1 && remainingDays === 0) return `${weeks} semanas`;
      if (weeks === 1)
        return `1 semana y ${remainingDays} día${remainingDays > 1 ? 's' : ''}`;
      return `${weeks} semanas y ${remainingDays} día${
        remainingDays > 1 ? 's' : ''
      }`;
    } catch {
      return null;
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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
          Asignar Horarios
        </h1>
        <p className="text-gray-600 mb-4">
          Gestiona y asigna personal a las capacitaciones disponibles.
        </p>

        {/* Banner de características */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-4 border border-indigo-200">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-indigo-900">
              Nueva experiencia de asignación
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-indigo-800">
            <div className="flex items-center gap-2">
              <Hand className="w-4 h-4" />
              <span>Arrastra y suelta personal</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4" />
              <span>Vista semanal completa</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Asignación en tiempo real</span>
            </div>
          </div>
        </div>

        {capacitaciones.length > 0 && (
          <div className="text-sm text-gray-500">
            {capacitaciones.length} capacitación
            {capacitaciones.length !== 1 ? 'es' : ''} disponible
            {capacitaciones.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {capacitaciones.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay capacitaciones disponibles
            </h3>
            <p className="text-gray-500 mb-4">
              Crea una nueva capacitación para comenzar a asignar horarios.
            </p>
            <Link
              to="/capacitaciones/nueva"
              className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
            >
              Crear Capacitación
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {capacitaciones.map((cap) => (
            <div
              key={cap.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
            >
              {/* Header de la tarjeta */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                    {cap.titulo || 'Sin título'}
                  </h2>
                  <span
                    className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      cap.fechaInicio,
                      cap.fechaFin
                    )}`}
                  >
                    {getStatusText(cap.fechaInicio, cap.fechaFin)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {cap.descripcion || 'Sin descripción disponible.'}
                </p>
              </div>

              {/* Detalles */}
              <div className="px-6 pb-4 flex-1">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {formatDate(cap.fechaInicio)} - {formatDate(cap.fechaFin)}
                    </span>
                  </div>
                  {calculateDuration(cap.fechaInicio, cap.fechaFin) && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Duración:{' '}
                        {calculateDuration(cap.fechaInicio, cap.fechaFin)}
                      </span>
                    </div>
                  )}
                  {cap.duracionBloque && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>Bloques de {cap.duracionBloque} minutos</span>
                    </div>
                  )}
                  {cap.cupoBloque && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Users className="w-4 h-4 flex-shrink-0" />
                      <span>Hasta {cap.cupoBloque} participantes por bloque</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="px-6 pb-6">
                <div className="space-y-2">
                  <Link
                    to={`/asignaciones/intuitiva/${cap.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium shadow-sm"
                  >
                    <Sparkles className="w-4 h-4" />
                    Asignación Intuitiva
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/asignaciones/avanzada/${cap.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm font-medium border border-gray-300"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Modo Avanzado
                  </Link>
                </div>
                <div className="flex justify-center mt-2">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                    Recomendado: interfaz intuitiva
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
