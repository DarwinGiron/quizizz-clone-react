import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '../../../shared';

const TipoEvaluacionModal = ({ isOpen, onClose, onSelect }) => {
  const toast = useToast();
  const [tipoSeleccionado, setTipoSeleccionado] = useState('');
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [capacitacionSeleccionada, setCapacitacionSeleccionada] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCapacitaciones();
    }
  }, [isOpen]);

  const fetchCapacitaciones = async () => {
    try {
      setLoading(true);
      const capacitacionesSnapshot = await getDocs(collection(db, 'capacitaciones'));
      let capacitacionesData = capacitacionesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Solo en desarrollo: si no hay capacitaciones reales, usar datos de
      // ejemplo para poder trabajar la UI sin datos reales.
      if (capacitacionesData.length === 0 && import.meta.env.DEV) {
        capacitacionesData = [
          {
            id: 'ejemplo1',
            titulo: 'Seguridad Industrial y Prevención de Riesgos',
            descripcion: 'Capacitación integral sobre normas de seguridad, identificación de riesgos y uso correcto de equipos de protección personal.',
            categoria: 'Seguridad',
            fecha_inicio: '2025-08-15',
            fecha_fin: '2025-08-30',
            instructor: 'Ing. María García'
          },
          {
            id: 'ejemplo2',
            titulo: 'Manejo de Equipos y Herramientas',
            descripcion: 'Capacitación sobre el uso correcto y mantenimiento básico de equipos y herramientas de trabajo.',
            categoria: 'Técnica',
            fecha_inicio: '2025-09-01',
            fecha_fin: '2025-09-15',
            instructor: 'Ing. Carlos Rodríguez'
          },
          {
            id: 'ejemplo3',
            titulo: 'Liderazgo y Trabajo en Equipo',
            descripcion: 'Desarrollo de habilidades de liderazgo y comunicación efectiva en equipos de trabajo.',
            categoria: 'Liderazgo',
            fecha_inicio: '2025-09-20',
            fecha_fin: '2025-10-05',
            instructor: 'Lic. Ana Martínez'
          }
        ];
      }

      // Filtrar capacitaciones que no hayan pasado (solo futuras o en curso)
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const capacitacionesActivas = capacitacionesData.filter(cap => {
        if (!cap.fecha_fin) return true;
        const fechaFin = new Date(cap.fecha_fin);
        fechaFin.setHours(23, 59, 59, 999);
        return fechaFin >= hoy;
      });

      // Ordenar por fecha de inicio (más recientes primero)
      capacitacionesActivas.sort((a, b) => {
        if (!a.fecha_inicio) return 1;
        if (!b.fecha_inicio) return -1;
        return new Date(b.fecha_inicio) - new Date(a.fecha_inicio);
      });

      setCapacitaciones(capacitacionesActivas);
    } catch (error) {
      console.error('Error al cargar capacitaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!tipoSeleccionado) return;

    if (tipoSeleccionado === 'capacitacion' && !capacitacionSeleccionada) {
      toast.info('Por favor selecciona una capacitación');
      return;
    }

    const result = {
      tipo: tipoSeleccionado,
      capacitacion: tipoSeleccionado === 'capacitacion' ? capacitaciones.find(c => c.id === capacitacionSeleccionada) : null
    };

    onSelect(result);
    handleClose();
  };

  const handleClose = () => {
    setTipoSeleccionado('');
    setCapacitacionSeleccionada('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Tipo de Evaluación
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            Selecciona cómo quieres crear esta evaluación
          </p>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Opción 1: Vinculada a Capacitación */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                tipoSeleccionado === 'capacitacion' 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-purple-300'
              }`}
              onClick={() => setTipoSeleccionado('capacitacion')}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="tipo"
                  value="capacitacion"
                  checked={tipoSeleccionado === 'capacitacion'}
                  onChange={() => setTipoSeleccionado('capacitacion')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    Vincular a Capacitación Existente
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Asocia esta evaluación a una capacitación para poder analizar:
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 ml-4 space-y-1">
                    <li>• Asistencia fuera de horarios asignados</li>
                    <li>• Horarios más y menos concurridos</li>
                    <li>• Participantes por bloque de capacitación</li>
                    <li>• Estadísticas de cumplimiento</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Selector de Capacitación */}
            {tipoSeleccionado === 'capacitacion' && (
              <div className="ml-8 mt-4 p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecciona la capacitación:
                </label>
                
                {loading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span>Cargando capacitaciones...</span>
                  </div>
                ) : (
                  <select
                    value={capacitacionSeleccionada}
                    onChange={(e) => setCapacitacionSeleccionada(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona una capacitación...</option>
                    {capacitaciones.map(capacitacion => (
                      <option key={capacitacion.id} value={capacitacion.id}>
                        {capacitacion.titulo} - {capacitacion.fecha_inicio ? format(parseISO(capacitacion.fecha_inicio), 'dd MMM yyyy', { locale: es }) : 'Sin fecha'}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Opción 2: Evento Aislado */}
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                tipoSeleccionado === 'evento' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setTipoSeleccionado('evento')}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="tipo"
                  value="evento"
                  checked={tipoSeleccionado === 'evento'}
                  onChange={() => setTipoSeleccionado('evento')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    Evento Aislado
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Crea una evaluación independiente sin vincular a ninguna capacitación:
                  </p>
                  <ul className="text-sm text-gray-600 mt-2 ml-4 space-y-1">
                    <li>• Evaluación completamente independiente</li>
                    <li>• Sin restricciones de horarios</li>
                    <li>• Ideal para exámenes generales</li>
                    <li>• Estadísticas básicas de participación</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Información adicional */}
          {tipoSeleccionado === 'capacitacion' && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="text-yellow-600"></span>
                <div>
                  <h4 className="font-medium text-yellow-800">Ventajas de vincular a capacitación:</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Podrás obtener insights valiosos sobre el comportamiento de los participantes, 
                    identificar patrones de asistencia y optimizar los horarios de futuras capacitaciones.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!tipoSeleccionado || (tipoSeleccionado === 'capacitacion' && !capacitacionSeleccionada)}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              Continuar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TipoEvaluacionModal;
