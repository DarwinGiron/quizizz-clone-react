import React, { useEffect, useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { useToast } from '../../../shared';
import useTurnosConfig from '../hooks/useTurnosConfig';
import { TURNO_IDS, DEFAULT_TURNOS_CONFIG } from '../utils/turnos';

// El orden de rotación (día -> noche -> tarde -> día) es fijo; lo único
// editable por posición es el nombre para mostrar y el horario.
const ORDEN_VISUAL = ['dia', 'noche', 'tarde'];

export default function ConfigurarTurnosModal({ onClose }) {
  const toast = useToast();
  const { turnos, loading, guardarTurnos } = useTurnosConfig();
  const [form, setForm] = useState(DEFAULT_TURNOS_CONFIG);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!loading) setForm(turnos);
  }, [loading, turnos]);

  const actualizarCampo = (id, campo, valor) => {
    setForm((prev) => ({ ...prev, [id]: { ...prev[id], [campo]: valor } }));
  };

  const handleGuardar = async () => {
    for (const id of TURNO_IDS) {
      if (!form[id]?.nombre?.trim()) {
        toast.error('Todos los turnos necesitan un nombre.');
        return;
      }
    }
    setGuardando(true);
    try {
      await guardarTurnos(form);
      toast.success('Turnos actualizados correctamente.');
      onClose();
    } catch (error) {
      console.error('Error al guardar turnos:', error);
      toast.error('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <Clock className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Configurar turnos</h2>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Define el nombre y horario de cada turno. El orden de rotación
          semanal siempre es el mismo (ver flujo abajo); solo el nombre y el
          horario son editables.
        </p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <div className="space-y-4 mb-5">
            {ORDEN_VISUAL.map((id, i) => (
              <div key={id} className="border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Posición {i + 1} de la rotación
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={form[id]?.nombre || ''}
                    onChange={(e) => actualizarCampo(id, 'nombre', e.target.value)}
                    placeholder="Ej. Turno A"
                    className="sm:col-span-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="time"
                    value={form[id]?.inicio || ''}
                    onChange={(e) => actualizarCampo(id, 'inicio', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="time"
                    value={form[id]?.fin || ''}
                    onChange={(e) => actualizarCampo(id, 'fin', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pt-1">
              {ORDEN_VISUAL.map((id, i) => (
                <React.Fragment key={id}>
                  <span className="font-medium text-gray-500">
                    {form[id]?.nombre || id}
                  </span>
                  {i < ORDEN_VISUAL.length - 1 && <ArrowRight className="w-3 h-3" />}
                </React.Fragment>
              ))}
              <ArrowRight className="w-3 h-3" />
              <span className="font-medium text-gray-500">{form.dia?.nombre || 'dia'}</span>
              <span>...</span>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={guardando}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando || loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-shadow disabled:opacity-60"
          >
            {guardando && (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
