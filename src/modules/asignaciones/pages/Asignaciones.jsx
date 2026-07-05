import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  Users,
  ClipboardList,
  MoreVertical,
  XCircle,
} from 'lucide-react';
import { useToast } from '../../../shared';

export default function Asignaciones() {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [cerrando, setCerrando] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const toast = useToast();

  // Normaliza los campos para soportar datos en snake_case (reales) y camelCase
  const normalizar = (cap) => ({
    ...cap,
    titulo: cap.titulo ?? cap.nombre ?? '',
    descripcion: cap.descripcion ?? '',
    fechaInicio: cap.fecha_inicio ?? cap.fechaInicio ?? null,
    fechaFin: cap.fecha_fin ?? cap.fechaFin ?? null,
    duracionBloque: cap.duracion_bloque ?? cap.duracionBloque ?? null,
    cupoBloque: cap.cupo_bloque ?? cap.cupoBloque ?? null,
  });

  useEffect(() => {
    const fetchCapacitaciones = async () => {
      try {
        const ref = collection(db, 'capacitaciones');
        const snapshot = await getDocs(ref);
        const data = snapshot.docs
          .map((d) => normalizar({ id: d.id, ...d.data() }))
          // Solo asignaciones activas (no cerradas manualmente)
          .filter((cap) => cap.asignacion_cerrada !== true);
        setCapacitaciones(data);
      } catch (error) {
        console.error('Error al cargar capacitaciones:', error);
        setCapacitaciones([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCapacitaciones();
  }, []);

  // Cerrar el menú al hacer click fuera
  useEffect(() => {
    const handleClickFuera = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAbierto(null);
      }
    };
    document.addEventListener('mousedown', handleClickFuera);
    return () => document.removeEventListener('mousedown', handleClickFuera);
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
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

  const abrirAsignacion = (capId) => {
    navigate(`/asignaciones/intuitiva/${capId}`);
  };

  const cerrarAsignacion = async (capId) => {
    setMenuAbierto(null);
    setCerrando(capId);
    try {
      await updateDoc(doc(db, 'capacitaciones', capId), {
        asignacion_cerrada: true,
        fecha_cierre: new Date().toISOString(),
      });
      // Quitar de la lista de activas en pantalla
      setCapacitaciones((prev) => prev.filter((cap) => cap.id !== capId));
    } catch (error) {
      console.error('Error al cerrar la asignación:', error);
      toast.error('No se pudo cerrar la asignación. Intenta de nuevo.');
    } finally {
      setCerrando(null);
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

        {capacitaciones.length > 0 && (
          <div className="text-sm text-gray-500">
            {capacitaciones.length} asignación
            {capacitaciones.length !== 1 ? 'es' : ''} activa
            {capacitaciones.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {capacitaciones.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-md mx-auto">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay asignaciones activas
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
              role="button"
              tabIndex={0}
              onClick={() => abrirAsignacion(cap.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  abrirAsignacion(cap.id);
                }
              }}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                cerrando === cap.id ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              {/* Header de la tarjeta */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <h2 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                    {cap.titulo || 'Sin título'}
                  </h2>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Activa
                    </span>
                    {/* Menú de 3 puntitos */}
                    <div
                      className="relative"
                      ref={menuAbierto === cap.id ? menuRef : null}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAbierto(
                            menuAbierto === cap.id ? null : cap.id
                          );
                        }}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                        aria-label="Opciones de la asignación"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {menuAbierto === cap.id && (
                        <div
                          className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              cerrarAsignacion(cap.id);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition text-left"
                          >
                            <XCircle className="w-4 h-4" />
                            Cerrar asignación
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {cap.descripcion || 'Sin descripción disponible.'}
                </p>
              </div>

              {/* Detalles */}
              <div className="px-6 pb-6 flex-1">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
