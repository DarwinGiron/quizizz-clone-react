
import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { format, parseISO, isAfter, isBefore, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    totalCapacitaciones: 0,
    capacitacionesActivas: 0,
    totalParticipantes: 0,
    proximasCapacitaciones: [],
    actividadReciente: [],
    ocupacionPromedio: 0
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        // Cargar capacitaciones
        const capacitacionesSnapshot = await getDocs(collection(db, 'capacitaciones'));
        let capacitaciones = capacitacionesSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));

        // Si no hay datos reales, usar datos de ejemplo
        if (capacitaciones.length === 0) {
          capacitaciones = [
            {
              id: 'ejemplo1',
              titulo: 'Seguridad Industrial y Prevención de Riesgos',
              categoria: 'Seguridad',
              fechaInicio: '2025-01-15',
              fechaFin: '2025-01-30',
              instructor: 'Ing. María García'
            },
            {
              id: 'ejemplo2',
              titulo: 'Manejo de Equipos Pesados',
              categoria: 'Técnica',
              fechaInicio: '2025-01-20',
              fechaFin: '2025-02-05',
              instructor: 'Tec. Carlos López'
            },
            {
              id: 'ejemplo3',
              titulo: 'Liderazgo y Gestión de Equipos',
              categoria: 'Liderazgo',
              fechaInicio: '2025-01-10',
              fechaFin: '2025-01-12',
              instructor: 'Lic. Ana Ruiz'
            },
            {
              id: 'ejemplo4',
              titulo: 'Primeros Auxilios en el Trabajo',
              categoria: 'Seguridad',
              fechaInicio: '2025-02-01',
              fechaFin: '2025-02-10',
              instructor: 'Dr. Pedro Morales'
            }
          ];
        }

        // Cargar bloques
        const bloquesSnapshot = await getDocs(collection(db, 'capacitacion_bloques'));
        let bloques = bloquesSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));

        // Si no hay bloques reales, usar datos de ejemplo
        if (bloques.length === 0) {
          bloques = [
            {
              id: 'bloque1',
              capacitacion_id: 'ejemplo1',
              fecha: '2025-01-15',
              cupo_disponible: 25,
              participantes: ['Juan Pérez', 'María González', 'Carlos López']
            },
            {
              id: 'bloque2',
              capacitacion_id: 'ejemplo2',
              fecha: '2025-01-20',
              cupo_disponible: 15,
              participantes: ['Ana Martín', 'Pedro Rodríguez']
            }
          ];
        }

        // Función para obtener estado de capacitación
        const getEstadoCapacitacion = (fechaInicio, fechaFin) => {
          if (!fechaInicio || !fechaFin) return 'proxima';
          
          try {
            const now = new Date();
            const inicio = parseISO(fechaInicio);
            const fin = parseISO(fechaFin);
            
            if (isBefore(now, inicio)) return 'proxima';
            if (isAfter(now, fin)) return 'finalizada';
            return 'activa';
          } catch (error) {
            return 'proxima';
          }
        };

        // Calcular estadísticas
        const totalCapacitaciones = capacitaciones.length;
        const capacitacionesActivas = capacitaciones.filter(c => 
          c.fechaInicio && c.fechaFin && getEstadoCapacitacion(c.fechaInicio, c.fechaFin) === 'activa'
        ).length;

        const totalParticipantes = bloques.reduce((total, bloque) => 
          total + (bloque.participantes?.length || 0), 0
        );

        const totalCupos = bloques.reduce((total, bloque) => 
          total + (bloque.cupo_disponible || 0), 0
        );

        const ocupacionPromedio = totalCupos > 0 ? Math.round((totalParticipantes / totalCupos) * 100) : 0;

        // Próximas capacitaciones (próximos 7 días)
        const proximasCapacitaciones = capacitaciones
          .filter(c => c.fechaInicio && getEstadoCapacitacion(c.fechaInicio, c.fechaFin) === 'proxima')
          .sort((a, b) => parseISO(a.fechaInicio) - parseISO(b.fechaInicio))
          .slice(0, 5);

        // Actividad reciente (simulada)
        const actividadReciente = [
          {
            tipo: 'capacitacion_creada',
            titulo: 'Nueva capacitación creada',
            descripcion: 'Seguridad Industrial y Prevención de Riesgos',
            fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            icono: '📚'
          },
          {
            tipo: 'asignacion',
            titulo: 'Participantes asignados',
            descripcion: '5 participantes asignados a Manejo de Equipos',
            fecha: new Date(Date.now() - 4 * 60 * 60 * 1000),
            icono: '👥'
          },
          {
            tipo: 'bloque_completado',
            titulo: 'Bloque completado',
            descripcion: 'Liderazgo y Gestión - Bloque matutino',
            fecha: new Date(Date.now() - 6 * 60 * 60 * 1000),
            icono: '✅'
          }
        ];

        setEstadisticas({
          totalCapacitaciones,
          capacitacionesActivas,
          totalParticipantes,
          proximasCapacitaciones,
          actividadReciente,
          ocupacionPromedio
        });

      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEstadisticas();
  }, []);

  const handleSignOut = () => {
    signOut(auth);
  };

  // Función para obtener saludo según la hora
  const getSaludo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // Función para obtener icono según categoría
  const getIconoCategoria = (categoria) => {
    switch (categoria) {
      case 'Seguridad': return '🛡️';
      case 'Técnica': return '⚙️';
      case 'Liderazgo': return '👑';
      case 'Calidad': return '🎯';
      case 'Operación': return '🔧';
      default: return '📚';
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-6 ml-60 bg-gray-50 min-h-screen">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 p-6 ml-60 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {getSaludo()}{user?.displayName ? `, ${user.displayName}` : ''}! 👋
              </h1>
              <p className="text-gray-600">
                Aquí tienes un resumen de la actividad del sistema de capacitaciones
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Hoy es</p>
                <p className="font-semibold text-gray-900">
                  {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: es })}
                </p>
              </div>
              
              <button
                onClick={handleSignOut}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>🚪</span>
                Cerrar sesión
              </button>
            </div>
          </div>

          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Capacitaciones</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{estadisticas.totalCapacitaciones}</p>
                  <p className="text-sm text-gray-500 mt-1">En el sistema</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <span className="text-2xl">📚</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En Curso</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{estadisticas.capacitacionesActivas}</p>
                  <p className="text-sm text-gray-500 mt-1">Capacitaciones activas</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <span className="text-2xl">🟢</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Participantes</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">{estadisticas.totalParticipantes}</p>
                  <p className="text-sm text-gray-500 mt-1">Total registrados</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Ocupación</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">{estadisticas.ocupacionPromedio}%</p>
                  <p className="text-sm text-gray-500 mt-1">Promedio general</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Accesos rápidos */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span>🚀</span>
              Accesos Rápidos
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <Link 
                to="/capacitaciones/nueva"
                className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Nueva Capacitación</h3>
                    <p className="text-purple-100 text-sm">Crear una nueva capacitación</p>
                  </div>
                  <span className="text-3xl">➕</span>
                </div>
              </Link>

              <Link 
                to="/capacitaciones"
                className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Ver Capacitaciones</h3>
                    <p className="text-blue-100 text-sm">Gestionar todas las capacitaciones</p>
                  </div>
                  <span className="text-3xl">📚</span>
                </div>
              </Link>

              <Link 
                to="/asignaciones"
                className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Asignaciones</h3>
                    <p className="text-green-100 text-sm">Gestionar participantes</p>
                  </div>
                  <span className="text-3xl">📋</span>
                </div>
              </Link>

              <Link 
                to="/usuarios"
                className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Usuarios</h3>
                    <p className="text-orange-100 text-sm">Administrar usuarios</p>
                  </div>
                  <span className="text-3xl">👤</span>
                </div>
              </Link>
            </div>

            {/* Próximas capacitaciones */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>📅</span>
                Próximas Capacitaciones
              </h3>
              
              {estadisticas.proximasCapacitaciones.length > 0 ? (
                <div className="space-y-3">
                  {estadisticas.proximasCapacitaciones.map((capacitacion) => (
                    <Link
                      key={capacitacion.id}
                      to={`/capacitaciones/${capacitacion.id}/detalle`}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getIconoCategoria(capacitacion.categoria)}</span>
                        <div>
                          <h4 className="font-semibold text-gray-900 group-hover:text-purple-700">
                            {capacitacion.titulo}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {capacitacion.instructor} • {capacitacion.categoria}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {format(parseISO(capacitacion.fechaInicio), 'dd MMM', { locale: es })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {differenceInDays(parseISO(capacitacion.fechaInicio), new Date())} días
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📅</div>
                  <p className="text-gray-500">No hay capacitaciones próximas programadas</p>
                </div>
              )}
            </div>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6">
            {/* Actividad reciente */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🔔</span>
                Actividad Reciente
              </h3>
              
              <div className="space-y-4">
                {estadisticas.actividadReciente.map((actividad, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
                      <span className="text-lg">{actividad.icono}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {actividad.titulo}
                      </h4>
                      <p className="text-gray-600 text-xs mb-1">
                        {actividad.descripcion}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {format(actividad.fecha, 'dd MMM, HH:mm', { locale: es })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Estado del sistema */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>⚡</span>
                Estado del Sistema
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Base de datos</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-600">Conectado</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Autenticación</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-green-600">Activo</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Sincronización</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium text-yellow-600">En proceso</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enlaces útiles */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>🔗</span>
                Enlaces Útiles
              </h3>
              
              <div className="space-y-2">
                <a 
                  href="#" 
                  className="block text-sm text-purple-700 hover:text-purple-900 transition-colors"
                >
                  📖 Manual de usuario
                </a>
                <a 
                  href="#" 
                  className="block text-sm text-purple-700 hover:text-purple-900 transition-colors"
                >
                  🆘 Soporte técnico
                </a>
                <a 
                  href="#" 
                  className="block text-sm text-purple-700 hover:text-purple-900 transition-colors"
                >
                  📊 Reportes avanzados
                </a>
                <a 
                  href="#" 
                  className="block text-sm text-purple-700 hover:text-purple-900 transition-colors"
                >
                  ⚙️ Configuración
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
