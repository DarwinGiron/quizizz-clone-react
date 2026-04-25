import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../../firebase/config';
import { useNavigate, Link } from 'react-router-dom';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { onAuthStateChanged } from 'firebase/auth';
import { Sidebar } from '../../../shared';
import { GestionarHorariosModal } from '../components';

const CapacitacionesDashboard = () => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [bloques, setBloques] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [selectedCapacitacionId, setSelectedCapacitacionId] = useState(null);
  const [showGestionarModal, setShowGestionarModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar capacitaciones
        const capSnapshot = await getDocs(collection(db, 'capacitaciones'));
        const listaCapacitaciones = capSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));

        // Si no hay datos reales, usar datos de ejemplo
        if (listaCapacitaciones.length === 0) {
          const datosEjemplo = [
            {
              id: 'ejemplo1',
              titulo: 'Seguridad Industrial y Prevención de Riesgos',
              descripcion: 'Capacitación integral sobre normas de seguridad, identificación de riesgos y uso correcto de equipos de protección personal.',
              categoria: 'Seguridad',
              fechaInicio: '2025-01-15',
              fechaFin: '2025-01-30',
              duracionBloque: 60,
              cupoBloque: 25,
              horaInicioDia: '08:00',
              horaFinDia: '17:00',
              instructor: 'Ing. María García'
            },
            {
              id: 'ejemplo2',
              titulo: 'Manejo de Equipos Pesados',
              descripcion: 'Curso práctico para la operación segura y eficiente de maquinaria pesada.',
              categoria: 'Técnica',
              fechaInicio: '2025-01-20',
              fechaFin: '2025-02-05',
              duracionBloque: 90,
              cupoBloque: 15,
              horaInicioDia: '07:00',
              horaFinDia: '16:00',
              instructor: 'Tec. Carlos López'
            },
            {
              id: 'ejemplo3',
              titulo: 'Liderazgo y Gestión de Equipos',
              descripcion: 'Desarrollo de habilidades directivas y comunicación efectiva.',
              categoria: 'Liderazgo',
              fechaInicio: '2025-01-10',
              fechaFin: '2025-01-12',
              duracionBloque: 120,
              cupoBloque: 12,
              horaInicioDia: '08:30',
              horaFinDia: '17:30',
              instructor: 'Lic. Ana Ruiz'
            },
            {
              id: 'ejemplo4',
              titulo: 'Primeros Auxilios en el Trabajo',
              descripcion: 'Formación esencial en técnicas de primeros auxilios y RCP.',
              categoria: 'Seguridad',
              fechaInicio: '2025-02-01',
              fechaFin: '2025-02-10',
              duracionBloque: 45,
              cupoBloque: 20,
              horaInicioDia: '09:00',
              horaFinDia: '18:00',
              instructor: 'Dr. Pedro Morales'
            }
          ];
          setCapacitaciones(datosEjemplo);
        } else {
          setCapacitaciones(listaCapacitaciones);
        }

        // Cargar todos los bloques para estadísticas
        const bloquesSnapshot = await getDocs(collection(db, 'capacitacion_bloques'));
        const listaBloques = bloquesSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        setBloques(listaBloques);

      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Verificar autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Función para abrir modal de gestionar horarios
  const handleGestionarHorarios = (capacitacionId) => {
    setSelectedCapacitacionId(capacitacionId);
    setShowGestionarModal(true);
  };

  // Función para cerrar modal
  const handleCloseModal = () => {
    setShowGestionarModal(false);
    setSelectedCapacitacionId(null);
  };

  // Función para obtener el estado de una capacitación
  const getEstadoCapacitacion = (fechaInicio, fechaFin) => {
    // Validar que las fechas existan
    if (!fechaInicio || !fechaFin) {
      return 'proxima'; // Estado por defecto si no hay fechas
    }
    
    try {
      const now = new Date();
      const inicio = parseISO(fechaInicio);
      const fin = parseISO(fechaFin);
      
      if (isBefore(now, inicio)) return 'proxima';
      if (isAfter(now, fin)) return 'finalizada';
      return 'activa';
    } catch (error) {
      console.warn('Error parsing dates:', error);
      return 'proxima';
    }
  };

  // Función para obtener estadísticas de una capacitación
  const getEstadisticasCapacitacion = (capacitacionId) => {
    const bloquesCapacitacion = bloques.filter(b => b.capacitacion_id === capacitacionId);
    const totalCupos = bloquesCapacitacion.reduce((total, bloque) => total + (bloque.cupo_disponible || 0), 0);
    const totalAsignados = bloquesCapacitacion.reduce((total, bloque) => total + (bloque.participantes?.length || 0), 0);
    const porcentajeOcupacion = totalCupos > 0 ? (totalAsignados / totalCupos) * 100 : 0;
    
    return {
      totalCupos,
      totalAsignados,
      porcentajeOcupacion: Math.round(porcentajeOcupacion),
      totalBloques: bloquesCapacitacion.length
    };
  };

  // Filtrar capacitaciones
  const capacitacionesFiltradas = capacitaciones.filter(cap => {
    // Filtro por búsqueda
    if (busqueda && cap.titulo && cap.descripcion &&
        !cap.titulo.toLowerCase().includes(busqueda.toLowerCase()) && 
        !cap.descripcion.toLowerCase().includes(busqueda.toLowerCase())) {
      return false;
    }

    // Filtro por estado
    if (filtroEstado !== 'todas') {
      const estado = getEstadoCapacitacion(cap.fechaInicio, cap.fechaFin);
      if (estado !== filtroEstado) return false;
    }

    // Filtro por categoría
    if (filtroCategoria !== 'todas' && cap.categoria !== filtroCategoria) {
      return false;
    }

    return true;
  });

  // Estadísticas generales
  const estadisticasGenerales = {
    total: capacitaciones.length,
    activas: capacitaciones.filter(c => c.fechaInicio && c.fechaFin && getEstadoCapacitacion(c.fechaInicio, c.fechaFin) === 'activa').length,
    proximas: capacitaciones.filter(c => c.fechaInicio && c.fechaFin && getEstadoCapacitacion(c.fechaInicio, c.fechaFin) === 'proxima').length,
    finalizadas: capacitaciones.filter(c => c.fechaInicio && c.fechaFin && getEstadoCapacitacion(c.fechaInicio, c.fechaFin) === 'finalizada').length,
    totalParticipantes: bloques.reduce((total, bloque) => total + (bloque.participantes?.length || 0), 0),
    ocupacionPromedio: Math.round(
      bloques.length > 0 
        ? (bloques.reduce((total, bloque) => {
            const ocupacion = bloque.cupo_disponible > 0 ? (bloque.participantes?.length || 0) / bloque.cupo_disponible : 0;
            return total + ocupacion;
          }, 0) / bloques.length) * 100
        : 0
    )
  };

  // Obtener categorías únicas
  const categorias = [...new Set(capacitaciones.map(c => c.categoria).filter(Boolean))];

  // Función para obtener color según estado
  const getColorEstado = (fechaInicio, fechaFin) => {
    const estado = getEstadoCapacitacion(fechaInicio, fechaFin);
    switch (estado) {
      case 'activa': return 'bg-green-100 border-green-400 text-green-800';
      case 'proxima': return 'bg-blue-100 border-blue-400 text-blue-800';
      case 'finalizada': return 'bg-gray-100 border-gray-400 text-gray-800';
      default: return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  // Función para obtener icono según categoría
  const getIconoCategoria = (categoria) => {
    switch (categoria) {
      case 'Seguridad': return '';
      case 'Técnica': return '';
      case 'Liderazgo': return '';
      case 'Calidad': return '';
      case 'Operación': return '';
      default: return '';
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Capacitaciones</h1>
              <p className="text-gray-600">Gestiona y supervisa todas las capacitaciones del sistema</p>
            </div>
            <Link to="/capacitaciones/nueva">
              <button className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-sm font-medium">
                <span className="mr-2">➕</span>
                Nueva Capacitación
              </button>
            </Link>
          </div>

          {/* Estadísticas generales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticasGenerales.total}</p>
                </div>
                <div className="text-2xl"></div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">En Curso</p>
                  <p className="text-2xl font-bold text-green-700">{estadisticasGenerales.activas}</p>
                </div>
                <div className="text-2xl"></div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Próximas</p>
                  <p className="text-2xl font-bold text-blue-700">{estadisticasGenerales.proximas}</p>
                </div>
                <div className="text-2xl"></div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Finalizadas</p>
                  <p className="text-2xl font-bold text-gray-700">{estadisticasGenerales.finalizadas}</p>
                </div>
                <div className="text-2xl"></div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Participantes</p>
                  <p className="text-2xl font-bold text-purple-700">{estadisticasGenerales.totalParticipantes}</p>
                </div>
                <div className="text-2xl"></div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Ocupación</p>
                  <p className="text-2xl font-bold text-orange-700">{estadisticasGenerales.ocupacionPromedio}%</p>
                </div>
                <div className="text-2xl"></div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Búsqueda</label>
                <input
                  type="text"
                  placeholder="Buscar capacitaciones..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Filtro por estado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="todas">Todas</option>
                  <option value="activa">En Curso</option>
                  <option value="proxima">Próximas</option>
                  <option value="finalizada">Finalizadas</option>
                </select>
              </div>

              {/* Filtro por categoría */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                >
                  <option value="todas">Todas</option>
                  {categorias.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </div>

              {/* Resultados */}
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Mostrando <span className="font-semibold text-purple-600">{capacitacionesFiltradas.length}</span> de <span className="font-semibold">{capacitaciones.length}</span> capacitaciones
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de capacitaciones */}
        {capacitacionesFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg shadow-sm p-8 max-w-md mx-auto">
              <div className="text-6xl mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {busqueda || filtroEstado !== 'todas' || filtroCategoria !== 'todas' 
                  ? 'No se encontraron capacitaciones' 
                  : 'No hay capacitaciones registradas'
                }
              </h3>
              <p className="text-gray-500 mb-4">
                {busqueda || filtroEstado !== 'todas' || filtroCategoria !== 'todas'
                  ? 'Prueba ajustando los filtros de búsqueda'
                  : 'Crea una nueva capacitación para comenzar'
                }
              </p>
              {!(busqueda || filtroEstado !== 'todas' || filtroCategoria !== 'todas') && (
                <Link to="/capacitaciones/nueva">
                  <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition">
                    Crear Primera Capacitación
                  </button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {capacitacionesFiltradas.map((cap) => {
              const estadisticas = getEstadisticasCapacitacion(cap.id);
              const estado = getEstadoCapacitacion(cap.fechaInicio, cap.fechaFin);
              
              return (
                <div
                  key={cap.id}
                  onClick={() => navigate(`/capacitaciones/${cap.id}/detalle`)}
                  className={`bg-white rounded-xl shadow-sm border-2 hover:shadow-xl transition-all cursor-pointer group relative overflow-hidden ${getColorEstado(cap.fechaInicio, cap.fechaFin)}`}
                >
                  {/* Header de la card */}
                  <div className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getIconoCategoria(cap.categoria)}</span>
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {cap.categoria || 'General'}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        estado === 'activa' ? 'bg-green-100 text-green-800' :
                        estado === 'proxima' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {estado === 'activa' ? 'En Curso' :
                         estado === 'proxima' ? 'Próxima' : 'Finalizada'}
                      </span>
                    </div>
                    
                    <h2 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2 mb-3 group-hover:text-purple-700 transition-colors">
                      {cap.titulo}
                    </h2>
                    
                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2 mb-4">
                      {cap.descripcion || 'Sin descripción disponible.'}
                    </p>
                  </div>

                  {/* Estadísticas de la capacitación */}
                  <div className="px-6 pb-4">
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Progreso de asignación</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {estadisticas.totalAsignados}/{estadisticas.totalCupos}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            estadisticas.porcentajeOcupacion === 0 ? 'bg-gray-300' :
                            estadisticas.porcentajeOcupacion < 50 ? 'bg-red-500' :
                            estadisticas.porcentajeOcupacion < 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.max(estadisticas.porcentajeOcupacion, 3)}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {estadisticas.porcentajeOcupacion}% ocupado • {estadisticas.totalBloques} bloques
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      {cap.fechaInicio && cap.fechaFin && (
                        <div className="flex items-center text-gray-500">
                          <span className="mr-2">📅</span>
                          <span>
                            {format(parseISO(cap.fechaInicio), 'dd MMM', { locale: es })} - {format(parseISO(cap.fechaFin), 'dd MMM yyyy', { locale: es })}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center text-gray-500">
                        <span className="mr-2">⏱️</span>
                        <span>Bloques de {cap.duracionBloque || 60} min</span>
                      </div>
                      
                      {cap.instructor && (
                        <div className="flex items-center text-gray-500">
                          <span className="mr-2">👨‍🏫</span>
                          <span>{cap.instructor}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer con acciones */}
                  <div className="px-6 pb-6">
                    <div className="flex gap-2">
                      <Link
                        to={`/asignaciones/intuitiva/${cap.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 bg-purple-600 text-white text-center py-2 px-3 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
                      >
                        📋 Asignar
                      </Link>
                      {user && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGestionarHorarios(cap.id);
                          }}
                          className="bg-blue-100 text-blue-700 py-2 px-3 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                          title="Gestionar Horarios"
                        >
                          🕒
                        </button>
                      )}
                      <Link
                        to={`/capacitaciones/${cap.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-gray-100 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                      >
                        ✏️
                      </Link>
                    </div>
                  </div>

                  {/* Indicador de estado en el borde */}
                  <div className={`absolute top-0 left-0 w-full h-1 ${
                    estado === 'activa' ? 'bg-green-500' :
                    estado === 'proxima' ? 'bg-blue-500' : 'bg-gray-400'
                  }`}></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para gestionar horarios */}
      {showGestionarModal && selectedCapacitacionId && (
        <GestionarHorariosModal
          capacitacionId={selectedCapacitacionId}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default CapacitacionesDashboard;
