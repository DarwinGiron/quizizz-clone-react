import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from '../../../firebase/config';
import { format, parseISO, isSameDay, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { onAuthStateChanged } from 'firebase/auth';
import { BackButton, useToast, useConfirm } from '../../../shared';
import {
  Calendar,
  Clock,
  Users,
  GraduationCap,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  ChevronDown,
  Lock,
  Pencil,
  UserPlus,
} from 'lucide-react';

const CapacitacionDetail = () => {
  const { id } = useParams();
  const [capacitacion, setCapacitacion] = useState(null);
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(null);
  const [user, setUser] = useState(null);
  const [actualizando, setActualizando] = useState(null);
  const toast = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch capacitación
        const capacitacionRef = doc(db, 'capacitaciones', id);
        const capacitacionSnap = await getDoc(capacitacionRef);
        
        if (capacitacionSnap.exists()) {
          setCapacitacion({ id: capacitacionSnap.id, ...capacitacionSnap.data() });
        }

        // Fetch bloques
        const bloquesQuery = query(
          collection(db, 'capacitacion_bloques'),
          where('capacitacion_id', '==', id)
        );
        const bloquesSnapshot = await getDocs(bloquesQuery);
        const bloquesData = bloquesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setBloques(bloquesData);

      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Verificar autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // Función para cambiar disponibilidad de un bloque
  const toggleDisponibilidad = async (bloqueId, disponibleActual) => {
    if (!user) {
      toast.error('Debes estar autenticado para realizar esta acción');
      return;
    }

    setActualizando(bloqueId);
    
    try {
      const bloqueRef = doc(db, 'capacitacion_bloques', bloqueId);
      await updateDoc(bloqueRef, {
        disponible: !disponibleActual
      });

      setBloques(prev => prev.map(bloque =>
        bloque.id === bloqueId
          ? { ...bloque, disponible: !disponibleActual }
          : bloque
      ));
    } catch (error) {
      console.error('Error al actualizar disponibilidad:', error);
      toast.error('Error al actualizar la disponibilidad del bloque');
    } finally {
      setActualizando(null);
    }
  };

  // Función para eliminar un bloque
  const eliminarBloque = async (bloqueId) => {
    if (!user) {
      toast.error('Debes estar autenticado para realizar esta acción');
      return;
    }

    const ok = await confirm(
      '¿Estás seguro de que quieres eliminar este bloque? Esta acción no se puede deshacer.',
      { title: 'Eliminar bloque', confirmLabel: 'Eliminar', danger: true }
    );
    if (!ok) {
      return;
    }

    setActualizando(bloqueId);
    
    try {
      const bloqueRef = doc(db, 'capacitacion_bloques', bloqueId);
      await deleteDoc(bloqueRef);

      setBloques(prev => prev.filter(bloque => bloque.id !== bloqueId));
    } catch (error) {
      console.error('Error al eliminar bloque:', error);
      toast.error('Error al eliminar el bloque');
    } finally {
      setActualizando(null);
    }
  };

  // Función para habilitar todos los bloques de un día
  const habilitarTodosLosBloques = async (fecha) => {
    if (!user) {
      toast.error('Debes estar autenticado para realizar esta acción');
      return;
    }

    const bloquesDelDia = bloquesPorFecha[fecha];
    
    try {
      for (const bloque of bloquesDelDia) {
        if (bloque.disponible === false) {
          const bloqueRef = doc(db, 'capacitacion_bloques', bloque.id);
          await updateDoc(bloqueRef, { disponible: true });
        }
      }

      // Actualizar estado local
      setBloques(prev => prev.map(bloque => 
        bloquesDelDia.some(b => b.id === bloque.id) && bloque.disponible === false
          ? { ...bloque, disponible: true }
          : bloque
      ));
    } catch (error) {
      console.error('Error al habilitar bloques:', error);
      toast.error('Error al habilitar los bloques del día');
    }
  };

  // Función para deshabilitar todos los bloques de un día
  const deshabilitarTodosLosBloques = async (fecha) => {
    if (!user) {
      toast.error('Debes estar autenticado para realizar esta acción');
      return;
    }

    const ok = await confirm(
      '¿Estás seguro de que quieres deshabilitar todos los bloques de este día?',
      { title: 'Deshabilitar bloques', confirmLabel: 'Deshabilitar', danger: true }
    );
    if (!ok) {
      return;
    }

    const bloquesDelDia = bloquesPorFecha[fecha];
    
    try {
      for (const bloque of bloquesDelDia) {
        if (bloque.disponible !== false) {
          const bloqueRef = doc(db, 'capacitacion_bloques', bloque.id);
          await updateDoc(bloqueRef, { disponible: false });
        }
      }

      // Actualizar estado local
      setBloques(prev => prev.map(bloque => 
        bloquesDelDia.some(b => b.id === bloque.id) && bloque.disponible !== false
          ? { ...bloque, disponible: false }
          : bloque
      ));
    } catch (error) {
      console.error('Error al deshabilitar bloques:', error);
      toast.error('Error al deshabilitar los bloques del día');
    }
  };

  // Función para obtener color único por día
  const getDayColor = (fecha) => {
    const colors = [
      'bg-blue-50 border-blue-200',
      'bg-green-50 border-green-200', 
      'bg-purple-50 border-purple-200',
      'bg-orange-50 border-orange-200',
      'bg-pink-50 border-pink-200',
      'bg-indigo-50 border-indigo-200',
      'bg-teal-50 border-teal-200',
      'bg-yellow-50 border-yellow-200'
    ];
    
    if (!capacitacion?.fecha_inicio) return colors[0];
    
    const fechaInicio = parseISO(capacitacion.fecha_inicio);
    const fechaBloque = parseISO(fecha);
    const dayIndex = differenceInDays(fechaBloque, fechaInicio);
    
    return colors[dayIndex % colors.length];
  };

  // Función para obtener color de badge por día
  const getDayBadgeColor = (fecha) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800', 
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
      'bg-teal-100 text-teal-800',
      'bg-yellow-100 text-yellow-800'
    ];
    
    if (!capacitacion?.fecha_inicio) return colors[0];
    
    const fechaInicio = parseISO(capacitacion.fecha_inicio);
    const fechaBloque = parseISO(fecha);
    const dayIndex = differenceInDays(fechaBloque, fechaInicio);
    
    return colors[dayIndex % colors.length];
  };

  // Agrupar bloques por fecha
  const bloquesPorFecha = bloques.reduce((acc, bloque) => {
    const fecha = bloque.fecha;
    if (!acc[fecha]) {
      acc[fecha] = [];
    }
    acc[fecha].push(bloque);
    return acc;
  }, {});

  // Ordenar fechas
  const fechasOrdenadas = Object.keys(bloquesPorFecha).sort();

  const toggleExpand = (bloqueId) => {
    setExpandido((prev) => (prev === bloqueId ? null : bloqueId));
  };

  // Función para obtener estadísticas
  const getEstadisticas = () => {
    const totalBloques = bloques.length;
    const bloquesDisponibles = bloques.filter(b => b.disponible !== false).length;
    const totalParticipantes = bloques.reduce((total, bloque) => total + (bloque.participantes?.length || 0), 0);
    const totalCupos = bloques.reduce((total, bloque) => total + (bloque.cupo_disponible || 0), 0);
    const ocupacion = totalCupos > 0 ? (totalParticipantes / totalCupos) * 100 : 0;
    
    // Calcular cupo promedio por bloque desde los bloques reales
    // Protección contra capacitacion null/undefined
    const cupoPorBloque = totalBloques > 0 ? 
      Math.round(totalCupos / totalBloques) : 
      (capacitacion?.cupoBloque || capacitacion?.cupo_bloque || 25);
    
    return {
      totalBloques,
      bloquesDisponibles,
      totalParticipantes,
      totalCupos,
      cupoPorBloque,
      ocupacion: Math.round(ocupacion)
    };
  };

  if (loading) {
    return (
      <div className="flex">
        <div className="flex-1 p-6 bg-gray-50 min-h-screen">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">Cargando capacitación...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!capacitacion) {
    return (
      <div className="flex">
        <div className="flex-1 p-6 bg-gray-50 min-h-screen">
          <div className="text-center py-16">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Capacitación no encontrada</h2>
            <p className="text-gray-600 mb-4">La capacitación que buscas no existe o ha sido eliminada.</p>
            <Link to="/capacitaciones" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition">
              Volver a Capacitaciones
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const estadisticas = getEstadisticas();

  return (
    <div className="flex">
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <BackButton to="/capacitaciones" label="Volver a Capacitaciones" className="mb-6" />
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <GraduationCap className="w-7 h-7 text-indigo-600" />
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full mb-2">
                      {capacitacion?.categoria || 'General'}
                    </span>
                    <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                      {capacitacion?.titulo}
                    </h1>
                  </div>
                </div>
                
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {capacitacion?.descripcion}
                </p>

                {/* Información del instructor */}
                {capacitacion?.instructor && (
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-gray-700 font-medium">Instructor: {capacitacion.instructor}</span>
                  </div>
                )}

                {/* Fechas y duración */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {capacitacion?.fecha_inicio && capacitacion?.fecha_fin && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">Duración</span>
                      </div>
                      <p className="text-blue-900 font-semibold">
                        {format(parseISO(capacitacion.fecha_inicio), 'dd MMM', { locale: es })} - {format(parseISO(capacitacion.fecha_fin), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  )}
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Bloque</span>
                    </div>
                    <p className="text-green-900 font-semibold">{capacitacion?.duracionBloque || 60} minutos</p>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-800">Cupo por bloque</span>
                    </div>
                    <p className="text-orange-900 font-semibold">{estadisticas.cupoPorBloque} personas</p>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Horario</span>
                    </div>
                    <p className="text-purple-900 font-semibold">
                      {capacitacion?.horaInicioDia || '08:00'} - {capacitacion?.horaFinDia || '17:00'}
                    </p>
                  </div>
                </div>

                {/* Objetivos */}
                {capacitacion?.objetivos && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Target className="w-5 h-5 text-indigo-600" />
                      Objetivos de la capacitación
                    </h3>
                    <ul className="space-y-2">
                      {capacitacion.objetivos.map((objetivo, index) => (
                        <li key={index} className="flex items-start gap-2 text-gray-700">
                          <span className="text-purple-600 mt-1">•</span>
                          {objetivo}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bloques</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.totalBloques}</p>
                </div>
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Disponibles</p>
                  <p className="text-2xl font-bold text-green-700">{estadisticas.bloquesDisponibles}</p>
                </div>
                <div className="bg-green-100 p-2 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Participantes</p>
                  <p className="text-2xl font-bold text-blue-700">{estadisticas.totalParticipantes}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">Total Cupos</p>
                  <p className="text-2xl font-bold text-purple-700">{estadisticas.totalCupos}</p>
                </div>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <ClipboardList className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600">Ocupación</p>
                  <p className="text-2xl font-bold text-orange-700">{estadisticas.ocupacion}%</p>
                </div>
                <div className="bg-orange-100 p-2 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloques por fecha */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            Cronograma de Bloques
          </h2>

          {fechasOrdenadas.length > 0 ? (
            fechasOrdenadas.map((fecha, fechaIndex) => (
              <div key={fecha} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header del día */}
                <div className={`${getDayColor(fecha)} px-6 py-4 border-b`}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDayBadgeColor(fecha)}`}>
                        Día {fechaIndex + 1}
                      </span>
                      <h3 className="text-xl font-bold text-gray-900">
                        {format(parseISO(fecha), 'EEEE, dd MMMM yyyy', { locale: es })}
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600">
                        {bloquesPorFecha[fecha].length} bloque{bloquesPorFecha[fecha].length !== 1 ? 's' : ''}
                      </div>
                      
                      {/* Botones de acción masiva para usuarios autenticados */}
                      {user && bloquesPorFecha[fecha].length > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => habilitarTodosLosBloques(fecha)}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-all"
                            title="Habilitar todos los bloques del día"
                          >
                            Habilitar todos
                          </button>
                          
                          <button
                            onClick={() => deshabilitarTodosLosBloques(fecha)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-all"
                            title="Deshabilitar todos los bloques del día"
                          >
                            Deshabilitar todos
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bloques del día */}
                <div className="p-6">
                  <div className="grid gap-4">
                    {bloquesPorFecha[fecha]
                      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                      .map((bloque) => (
                        <div
                          key={bloque.id}
                          className={`relative border-2 rounded-lg transition-all duration-200 ${
                            expandido === bloque.id 
                              ? 'border-purple-300 bg-purple-50 shadow-md' 
                              : bloque.disponible === false
                                ? 'border-gray-200 bg-gray-50'
                                : 'border-gray-200 bg-white hover:border-purple-200 hover:shadow-sm'
                          }`}
                        >
                          {/* Overlay de carga */}
                          {actualizando === bloque.id && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                              <div className="flex items-center gap-2 text-indigo-600">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                <span className="text-sm font-medium">Actualizando...</span>
                              </div>
                            </div>
                          )}
                          
                          <div
                            onClick={() => !actualizando && toggleExpand(bloque.id)}
                            className={`px-4 py-3 ${actualizando === bloque.id ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  {bloque.disponible === false ? (
                                    <Lock className="w-4 h-4 text-red-500" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-indigo-600" />
                                  )}
                                  <span className="font-semibold text-gray-900">
                                    {bloque.hora_inicio} - {bloque.hora_fin}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    bloque.disponible === false 
                                      ? 'bg-red-100 text-red-800'
                                      : (bloque.participantes?.length || 0) >= (bloque.cupo_disponible || 0)
                                        ? 'bg-orange-100 text-orange-800'
                                        : 'bg-green-100 text-green-800'
                                  }`}>
                                    {bloque.disponible === false 
                                      ? 'No disponible'
                                      : (bloque.participantes?.length || 0) >= (bloque.cupo_disponible || 0)
                                        ? 'Completo'
                                        : 'Disponible'
                                    }
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    {bloque.participantes?.length || 0} / {bloque.cupo_disponible || 0} participantes
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {Math.round(((bloque.participantes?.length || 0) / (bloque.cupo_disponible || 1)) * 100)}% ocupado
                                  </div>
                                </div>

                                {/* Botones de acción para usuarios autenticados */}
                                {user && (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleDisponibilidad(bloque.id, bloque.disponible !== false);
                                      }}
                                      disabled={actualizando === bloque.id}
                                      className={`p-2 rounded-lg text-sm font-medium transition-all ${
                                        bloque.disponible === false
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                      } ${actualizando === bloque.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      title={bloque.disponible === false ? 'Hacer disponible' : 'Marcar como no disponible'}
                                    >
                                      {actualizando === bloque.id ? '...' : bloque.disponible === false ? 'OK' : 'No'}
                                    </button>
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        eliminarBloque(bloque.id);
                                      }}
                                      disabled={actualizando === bloque.id}
                                      className={`p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 text-sm font-medium transition-all ${
                                        actualizando === bloque.id ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      title="Eliminar bloque"
                                    >
                                      {actualizando === bloque.id ? '...' : 'Eliminar'}
                                    </button>
                                  </div>
                                )}
                                
                                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                  expandido === bloque.id ? 'rotate-180' : ''
                                }`} />
                              </div>
                            </div>
                          </div>

                          {/* Lista de participantes expandida */}
                          {expandido === bloque.id && (
                            <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
                              <div className="pt-4">
                                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                  <Users className="w-4 h-4 text-indigo-600" />
                                  Participantes registrados
                                </h4>
                                
                                {bloque.participantes && bloque.participantes.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {bloque.participantes.map((participante, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-white rounded-lg px-3 py-2 border border-gray-200 flex items-center gap-2"
                                      >
                                        <span className="w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-sm font-medium">
                                          {(typeof participante === 'string' ? participante : participante.nombre || participante.uid || 'U').charAt(0).toUpperCase()}
                                        </span>
                                        <span className="text-sm text-gray-900">
                                          {typeof participante === 'string' ? participante : participante.nombre || participante.uid || 'Usuario'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6">
                                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No hay participantes registrados en este bloque</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-indigo-100 p-4 rounded-full">
                  <Calendar className="w-10 h-10 text-indigo-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No hay bloques programados</h3>
              <p className="text-gray-600 mb-4">Esta capacitación aún no tiene bloques de horarios definidos.</p>
              <Link
                to={`/asignaciones/intuitiva/${id}`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition"
              >
                <UserPlus className="w-4 h-4" />
                Crear Asignaciones
              </Link>
            </div>
          )}
        </div>

        {/* Acciones flotantes */}
        <div className="fixed bottom-6 right-6 flex flex-col gap-3">
          <Link
            to={`/asignaciones/intuitiva/${id}`}
            className="bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
            title="Gestionar Asignaciones"
          >
            <UserPlus className="w-5 h-5" />
          </Link>

          <Link
            to={`/capacitaciones/${id}/edit`}
            className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
            title="Editar Capacitación"
          >
            <Pencil className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CapacitacionDetail;
