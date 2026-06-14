import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export default function GestionarHorariosModal({ capacitacion, onClose, onUpdate }) {
  const [bloques, setBloques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarBloques = async () => {
      try {
        const q = query(
          collection(db, 'capacitacion_bloques'),
          where('capacitacion_id', '==', capacitacion.id)
        );
        const snapshot = await getDocs(q);
        const bloquesData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        // Ordenar por fecha y hora
        bloquesData.sort((a, b) => {
          const fechaA = new Date(a.fecha + ' ' + a.hora_inicio);
          const fechaB = new Date(b.fecha + ' ' + b.hora_inicio);
          return fechaA - fechaB;
        });
        
        setBloques(bloquesData);
      } catch (error) {
        console.error('Error al cargar bloques:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarBloques();
  }, [capacitacion.id]);

  const toggleDisponibilidadBloque = async (bloqueId, disponible) => {
    setGuardando(true);
    try {
      const bloqueRef = doc(db, 'capacitacion_bloques', bloqueId);
      await updateDoc(bloqueRef, {
        disponible: disponible,
        fecha_modificacion: new Date().toISOString(),
        motivo_deshabilitacion: disponible ? null : 'Deshabilitado por administrador'
      });

      // Actualizar estado local
      setBloques(prevBloques => 
        prevBloques.map(bloque => 
          bloque.id === bloqueId 
            ? { ...bloque, disponible: disponible }
            : bloque
        )
      );

      if (onUpdate) onUpdate();
      
    } catch (error) {
      console.error('Error al actualizar disponibilidad:', error);
      alert('Error al actualizar la disponibilidad del horario');
    } finally {
      setGuardando(false);
    }
  };

  const getEstadoBloque = (bloque) => {
    if (bloque.disponible === false) return 'deshabilitado';
    
    const ocupados = bloque.participantes?.length || 0;
    const total = bloque.cupo_disponible || 0;
    const porcentaje = total > 0 ? (ocupados / total) * 100 : 0;
    
    if (ocupados >= total) return 'completo';
    if (porcentaje >= 80) return 'casi-lleno';
    if (porcentaje >= 50) return 'medio';
    if (porcentaje > 0) return 'con-asignados';
    return 'vacio';
  };

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'deshabilitado': return 'bg-red-100 border-red-400 text-red-800';
      case 'completo': return 'bg-gray-100 border-gray-400 text-gray-800';
      case 'casi-lleno': return 'bg-orange-100 border-orange-400 text-orange-800';
      case 'medio': return 'bg-yellow-100 border-yellow-400 text-yellow-800';
      case 'con-asignados': return 'bg-blue-100 border-blue-400 text-blue-800';
      case 'vacio': return 'bg-green-100 border-green-400 text-green-800';
      default: return 'bg-gray-100 border-gray-400 text-gray-800';
    }
  };

  const getTextoEstado = (estado) => {
    switch (estado) {
      case 'deshabilitado': return 'Deshabilitado';
      case 'completo': return 'Completo';
      case 'casi-lleno': return 'Casi lleno';
      case 'medio': return 'Medio lleno';
      case 'con-asignados': return 'Con asignados';
      case 'vacio': return 'Disponible';
      default: return 'Desconocido';
    }
  };

  const agruparPorFecha = (bloques) => {
    const agrupados = {};
    bloques.forEach(bloque => {
      if (!agrupados[bloque.fecha]) {
        agrupados[bloque.fecha] = [];
      }
      agrupados[bloque.fecha].push(bloque);
    });
    return agrupados;
  };

  const bloquesAgrupados = agruparPorFecha(bloques);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Gestionar Horarios - {capacitacion.titulo}
              </h2>
              <p className="text-gray-600">
                Habilita o deshabilita bloques de horarios para controlar la disponibilidad
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Leyenda */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-400 rounded"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-400 rounded"></div>
              <span>Con asignados</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-400 rounded"></div>
              <span>Medio lleno</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-100 border border-orange-400 rounded"></div>
              <span>Casi lleno</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-400 rounded"></div>
              <span>Completo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border border-red-400 rounded"></div>
              <span>Deshabilitado</span>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Cargando horarios...</span>
            </div>
          ) : Object.keys(bloquesAgrupados).length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No hay horarios configurados
              </h3>
              <p className="text-gray-500">
                Esta capacitación no tiene bloques de horarios creados aún.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(bloquesAgrupados).map(([fecha, bloquesDelDia]) => (
                <div key={fecha} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {format(parseISO(fecha), 'EEEE, dd MMMM yyyy', { locale: es })}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {bloquesDelDia.map(bloque => {
                      const estado = getEstadoBloque(bloque);
                      const ocupados = bloque.participantes?.length || 0;
                      const total = bloque.cupo_disponible || 0;
                      const disponible = bloque.disponible !== false;
                      
                      return (
                        <div
                          key={bloque.id}
                          className={`border-2 rounded-lg p-3 transition-all ${getColorEstado(estado)}`}
                        >
                          {/* Header del bloque */}
                          <div className="flex justify-between items-center mb-2">
                            <div className="font-semibold text-sm">
                              {bloque.hora_inicio} - {bloque.hora_fin}
                            </div>
                            <div className="text-xs font-medium">
                              {ocupados}/{total}
                            </div>
                          </div>
                          
                          {/* Estado */}
                          <div className="text-xs mb-3">
                            {getTextoEstado(estado)}
                          </div>
                          
                          {/* Participantes asignados */}
                          {ocupados > 0 && (
                            <div className="mb-3">
                              <div className="text-xs text-gray-600 mb-1">Asignados:</div>
                              <div className="space-y-1">
                                {bloque.participantes.slice(0, 2).map((p, idx) => (
                                  <div key={idx} className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                                    {p.nombre || p.id}
                                  </div>
                                ))}
                                {bloque.participantes.length > 2 && (
                                  <div className="text-xs text-gray-600 text-center">
                                    +{bloque.participantes.length - 2} más...
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Toggle de disponibilidad */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">
                              {disponible ? 'Habilitado' : 'Deshabilitado'}
                            </span>
                            <button
                              onClick={() => toggleDisponibilidadBloque(bloque.id, !disponible)}
                              disabled={guardando}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                disponible ? 'bg-green-600' : 'bg-red-600'
                              } ${guardando ? 'opacity-50' : ''}`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  disponible ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Los horarios deshabilitados no aparecerán en la interfaz de asignación
            </div>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
