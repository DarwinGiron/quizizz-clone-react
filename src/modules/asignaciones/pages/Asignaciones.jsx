import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Sidebar } from '../../../shared';

export default function Asignaciones() {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCapacitaciones = async () => {
      try {
        const ref = collection(db, 'capacitaciones');
        const snapshot = await getDocs(ref);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Si no hay datos en la base de datos, usar datos de ejemplo
        if (data.length === 0) {
          const datosEjemplo = [
            {
              id: 'ejemplo1',
              titulo: 'Seguridad Industrial y Prevención de Riesgos',
              descripcion: 'Capacitación integral sobre normas de seguridad, identificación de riesgos y uso correcto de equipos de protección personal en el ambiente laboral.',
              fechaInicio: '2025-01-15',
              fechaFin: '2025-01-30',
              duracionBloque: 60,
              cupoBloque: 25,
              horaInicioDia: '08:00',
              horaFinDia: '17:00'
            },
            {
              id: 'ejemplo2',
              titulo: 'Manejo de Equipos Pesados',
              descripcion: 'Curso práctico para la operación segura y eficiente de maquinaria pesada, incluyendo mantenimiento básico y procedimientos de emergencia.',
              fechaInicio: '2025-01-20',
              fechaFin: '2025-02-05',
              duracionBloque: 90,
              cupoBloque: 15,
              horaInicioDia: '07:00',
              horaFinDia: '16:00'
            },
            {
              id: 'ejemplo3',
              titulo: 'Primeros Auxilios en el Trabajo',
              descripcion: 'Formación esencial en técnicas de primeros auxilios, RCP y manejo de emergencias médicas en el entorno laboral.',
              fechaInicio: '2025-02-01',
              fechaFin: '2025-02-10',
              duracionBloque: 45,
              cupoBloque: 20,
              horaInicioDia: '09:00',
              horaFinDia: '18:00'
            },
            {
              id: 'ejemplo4',
              titulo: 'Liderazgo y Gestión de Equipos',
              descripcion: 'Desarrollo de habilidades directivas, comunicación efectiva y técnicas de motivación para supervisores y jefes de cuadrilla.',
              fechaInicio: '2025-01-10',
              fechaFin: '2025-01-12',
              duracionBloque: 120,
              cupoBloque: 12,
              horaInicioDia: '08:30',
              horaFinDia: '17:30'
            },
            {
              id: 'ejemplo5',
              titulo: 'Calidad y Mejora Continua',
              descripcion: 'Metodologías de control de calidad, implementación de mejoras y optimización de procesos productivos.',
              fechaInicio: '2025-03-01',
              fechaFin: '2025-03-15',
              duracionBloque: 75,
              cupoBloque: 30,
              horaInicioDia: '08:00',
              horaFinDia: '16:30'
            }
          ];
          setCapacitaciones(datosEjemplo);
        } else {
          setCapacitaciones(data);
        }
      } catch (error) {
        console.error('Error al cargar capacitaciones:', error);
        // En caso de error, mostrar datos de ejemplo
        const datosEjemplo = [
          {
            id: 'ejemplo1',
            titulo: 'Seguridad Industrial y Prevención de Riesgos',
            descripcion: 'Capacitación integral sobre normas de seguridad, identificación de riesgos y uso correcto de equipos de protección personal.',
            fechaInicio: '2025-01-15',
            fechaFin: '2025-01-30',
            duracionBloque: 60,
            cupoBloque: 25
          }
        ];
        setCapacitaciones(datosEjemplo);
      } finally {
        setLoading(false);
      }
    };
    fetchCapacitaciones();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: es });
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
      if (weeks === 1) return `1 semana y ${remainingDays} día${remainingDays > 1 ? 's' : ''}`;
      
      return `${weeks} semanas y ${remainingDays} día${remainingDays > 1 ? 's' : ''}`;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6 ml-60 bg-gray-50 min-h-screen">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Cargando capacitaciones...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 ml-60 bg-gray-50 min-h-screen">
        {/* Header mejorado */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Asignar Horarios</h1>
          <p className="text-gray-600 mb-4">Gestiona y asigna personal a las capacitaciones disponibles</p>
          
          {/* Características destacadas */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-4 border border-purple-200">
            <div className="flex items-center mb-2">
              <h3 className="text-sm font-semibold text-purple-900">Nueva experiencia de asignación</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-purple-800">
              <div className="flex items-center">
                <span>Arrastra y suelta personal</span>
              </div>
              <div className="flex items-center">
                <span>Vista semanal completa</span>
              </div>
              <div className="flex items-center">
                <span>Asignación en tiempo real</span>
              </div>
            </div>
          </div>
          
          {capacitaciones.length > 0 && (
            <div className="text-sm text-gray-500">
              {capacitaciones.length} capacitación{capacitaciones.length !== 1 ? 'es' : ''} disponible{capacitaciones.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {capacitaciones.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay capacitaciones disponibles</h3>
              <p className="text-gray-500 mb-4">Crea una nueva capacitación para comenzar a asignar horarios.</p>
              <Link 
                to="/capacitaciones/nueva"
                className="inline-block bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
              >
                Crear Capacitación
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {capacitaciones.map((cap) => (
              <div key={cap.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                {/* Header de la tarjeta */}
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2">
                      {cap.titulo || 'Sin título'}
                    </h2>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(cap.fechaInicio, cap.fechaFin)}`}>
                      {getStatusText(cap.fechaInicio, cap.fechaFin)}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 mb-4">
                    {cap.descripcion || 'Sin descripción disponible.'}
                  </p>
                </div>

                {/* Información de fechas y detalles */}
                <div className="px-6 pb-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-500">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{formatDate(cap.fechaInicio)} - {formatDate(cap.fechaFin)}</span>
                    </div>
                    
                    {calculateDuration(cap.fechaInicio, cap.fechaFin) && (
                      <div className="flex items-center text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Duración: {calculateDuration(cap.fechaInicio, cap.fechaFin)}</span>
                      </div>
                    )}
                    
                    {cap.duracionBloque && (
                      <div className="flex items-center text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Bloques de {cap.duracionBloque} minutos</span>
                      </div>
                    )}
                    
                    {cap.cupoBloque && (
                      <div className="flex items-center text-gray-500">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Hasta {cap.cupoBloque} participantes por bloque</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer con botones de acción */}
                <div className="px-6 pb-6">
                  <div className="space-y-2">
                    {/* Botón principal - Nueva interfaz intuitiva */}
                    <Link
                      to={`/asignaciones/intuitiva/${cap.id}`}
                      className="w-full inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm font-medium shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                      ✨ Asignación Intuitiva (Recomendado)
                    </Link>
                    
                    {/* Botón secundario - Interfaz clásica */}
                    <Link
                      to={`/asignaciones/avanzada/${cap.id}`}
                      className="w-full inline-flex items-center justify-center bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm font-medium border border-gray-300"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      Modo Avanzado
                    </Link>
                  </div>
                  
                  {/* Etiqueta "Nuevo" */}
                  <div className="flex justify-center mt-2">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      🎉 ¡Nueva interfaz más fácil!
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
