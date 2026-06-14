import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const EstadisticasCapacitacionModal = ({ isOpen, onClose, quiz }) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && quiz?.capacitacionVinculada) {
      fetchEstadisticas();
    }
  }, [isOpen, quiz]);

  const fetchEstadisticas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener sesiones de esta evaluación
      const sessionsQuery = query(
        collection(db, 'sessionStats'),
        where('quizId', '==', quiz.id)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      // Obtener bloques de la capacitación
      const bloquesQuery = query(
        collection(db, 'capacitacion_bloques'),
        where('capacitacion_id', '==', quiz.capacitacionVinculada.id)
      );
      const bloquesSnapshot = await getDocs(bloquesQuery);
      
      const sesiones = sessionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const bloques = bloquesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Procesar estadísticas
      const stats = procesarEstadisticas(sesiones, bloques, quiz.capacitacionVinculada);
      setEstadisticas(stats);
      
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      setError('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const procesarEstadisticas = (sesiones, bloques, capacitacion) => {
    const totalParticipantes = sesiones.reduce((total, sesion) => {
      return total + (sesion.participants?.length || 0);
    }, 0);
    
    // Agrupar por horarios
    const participantesPorHorario = {};
    const participantesPorFecha = {};
    
    sesiones.forEach(sesion => {
      const fecha = format(sesion.createdAt.toDate(), 'yyyy-MM-dd');
      const hora = format(sesion.createdAt.toDate(), 'HH:mm');
      
      if (!participantesPorHorario[hora]) {
        participantesPorHorario[hora] = 0;
      }
      if (!participantesPorFecha[fecha]) {
        participantesPorFecha[fecha] = 0;
      }
      
      participantesPorHorario[hora] += sesion.participants?.length || 0;
      participantesPorFecha[fecha] += sesion.participants?.length || 0;
    });
    
    // Encontrar horarios más y menos concurridos
    const horariosMasConcurridos = Object.entries(participantesPorHorario)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    const horariosMenosConcurridos = Object.entries(participantesPorHorario)
      .sort(([,a], [,b]) => a - b)
      .slice(0, 3);
    
    // Simular análisis de participantes fuera de horario
    const totalBloques = bloques.length;
    const participantesAsignados = bloques.reduce((total, bloque) => {
      return total + (bloque.participantes?.length || 0);
    }, 0);
    
    const participantesFueraHorario = Math.max(0, totalParticipantes - participantesAsignados);
    
    return {
      totalParticipantes,
      participantesAsignados,
      participantesFueraHorario,
      porcentajeFueraHorario: totalParticipantes > 0 ? (participantesFueraHorario / totalParticipantes) * 100 : 0,
      totalSesiones: sesiones.length,
      totalBloques,
      horariosMasConcurridos,
      horariosMenosConcurridos,
      participantesPorFecha: Object.entries(participantesPorFecha).sort(([a], [b]) => a.localeCompare(b))
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Estadísticas de Capacitación
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Análisis de participación para: <strong>{quiz?.title}</strong>
          </p>
          {quiz?.capacitacionVinculada && (
            <p className="text-purple-600 text-sm mt-1">
              Vinculada a: {quiz.capacitacionVinculada.titulo}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Cargando estadísticas...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 text-4xl mb-4"></div>
              <p className="text-red-600">{error}</p>
            </div>
          ) : estadisticas ? (
            <div className="space-y-6">
              {/* Estadísticas Generales */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600"></span>
                    <span className="text-sm font-medium text-blue-800">Total Participantes</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{estadisticas.totalParticipantes}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600"></span>
                    <span className="text-sm font-medium text-green-800">Asignados</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{estadisticas.participantesAsignados}</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-600"></span>
                    <span className="text-sm font-medium text-orange-800">Fuera de Horario</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">{estadisticas.participantesFueraHorario}</p>
                  <p className="text-xs text-orange-700 mt-1">
                    {estadisticas.porcentajeFueraHorario.toFixed(1)}% del total
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-purple-600"></span>
                    <span className="text-sm font-medium text-purple-800">Sesiones</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{estadisticas.totalSesiones}</p>
                </div>
              </div>

              {/* Horarios Más Concurridos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span></span>
                    Horarios Más Concurridos
                  </h3>
                  <div className="space-y-2">
                    {estadisticas.horariosMasConcurridos.map(([hora, participantes], index) => (
                      <div key={hora} className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="text-sm font-medium">{hora}</span>
                        <span className="text-sm text-gray-600">{participantes} participantes</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    Horarios Menos Concurridos
                  </h3>
                  <div className="space-y-2">
                    {estadisticas.horariosMenosConcurridos.map(([hora, participantes], index) => (
                      <div key={hora} className="flex justify-between items-center p-2 bg-white rounded border">
                        <span className="text-sm font-medium">{hora}</span>
                        <span className="text-sm text-gray-600">{participantes} participantes</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Participación por Fecha */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  Participación por Fecha
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {estadisticas.participantesPorFecha.map(([fecha, participantes]) => (
                    <div key={fecha} className="flex justify-between items-center p-2 bg-white rounded border">
                      <span className="text-sm font-medium">{format(parseISO(fecha), 'dd MMM', { locale: es })}</span>
                      <span className="text-sm text-gray-600">{participantes} participantes</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Insights */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                  Insights
                </h3>
                <ul className="space-y-1 text-sm text-yellow-700">
                  <li>• {estadisticas.porcentajeFueraHorario > 20 ? 'Alto' : 'Bajo'} porcentaje de participantes fuera de horario asignado</li>
                  <li>• Horario pico: {estadisticas.horariosMasConcurridos[0]?.[0] || 'N/A'}</li>
                  <li>• Horario menos concurrido: {estadisticas.horariosMenosConcurridos[0]?.[0] || 'N/A'}</li>
                  <li>• Promedio de participantes por sesión: {estadisticas.totalSesiones > 0 ? Math.round(estadisticas.totalParticipantes / estadisticas.totalSesiones) : 0}</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-4xl mb-4"></div>
              <p className="text-gray-600">No hay datos suficientes para mostrar estadísticas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstadisticasCapacitacionModal;
