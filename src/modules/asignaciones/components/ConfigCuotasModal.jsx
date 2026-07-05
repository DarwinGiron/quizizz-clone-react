import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { X, Plus, Trash2, SlidersHorizontal } from 'lucide-react';
import {
  MODO_AREA,
  MODO_MAQUINA,
  normalizarConfig,
} from '../utils/cuotas';

/**
 * Modal exclusivo del admin para definir cuántas personas se requieren
 * por área/máquina en cada horario de la capacitación.
 *
 * Props:
 *  - capacitacionId
 *  - configInicial   (asignacion_config actual, opcional)
 *  - clavesSugeridas (array de áreas/máquinas detectadas en las cuadrillas)
 *  - onClose()
 *  - onSaved(nuevaConfig)
 */
export default function ConfigCuotasModal({
  capacitacionId,
  configInicial,
  clavesSugeridas = [],
  onClose,
  onSaved,
}) {
  const inicial = normalizarConfig(configInicial);
  const [modo, setModo] = useState(inicial.modo);
  const [cuotas, setCuotas] = useState(
    inicial.cuotas.length > 0 ? inicial.cuotas : [{ clave: '', cantidad: 1 }]
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const dimension = modo === MODO_MAQUINA ? 'máquina' : 'área';

  const actualizarFila = (index, campo, valor) => {
    setCuotas((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [campo]: valor } : c))
    );
  };

  const agregarFila = () =>
    setCuotas((prev) => [...prev, { clave: '', cantidad: 1 }]);

  const quitarFila = (index) =>
    setCuotas((prev) => prev.filter((_, i) => i !== index));

  const handleGuardar = async () => {
    setError(null);

    // Limpiar y validar.
    const limpias = cuotas
      .map((c) => ({
        clave: (c.clave || '').trim(),
        cantidad: Number(c.cantidad) || 0,
      }))
      .filter((c) => c.clave && c.cantidad > 0);

    const claves = limpias.map((c) => c.clave.toLowerCase());
    if (new Set(claves).size !== claves.length) {
      setError(`Hay ${dimension}s repetidas. Únelas en una sola fila.`);
      return;
    }

    const nuevaConfig = { modo, cuotas: limpias };

    setGuardando(true);
    try {
      await updateDoc(doc(db, 'capacitaciones', capacitacionId), {
        asignacion_config: nuevaConfig,
      });
      onSaved?.(nuevaConfig);
      onClose?.();
    } catch (e) {
      console.error('Error al guardar configuración de cuotas:', e);
      setError('No se pudo guardar la configuración. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Configurar cuotas por horario
              </h2>
              <p className="text-xs text-gray-500">
                Define cuántas personas se requieren por {dimension} en cada
                horario.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Selector de modo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Agrupar por
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setModo(MODO_AREA)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                  modo === MODO_AREA
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Área
              </button>
              <button
                type="button"
                onClick={() => setModo(MODO_MAQUINA)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium border transition ${
                  modo === MODO_MAQUINA
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Máquina / Equipo
              </button>
            </div>
          </div>

          {/* Filas de cuotas */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Requisitos por horario
            </label>
            <div className="space-y-2">
              {cuotas.map((c, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    list="claves-sugeridas"
                    value={c.clave}
                    onChange={(e) =>
                      actualizarFila(index, 'clave', e.target.value)
                    }
                    placeholder={`Nombre de ${dimension}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    min="1"
                    value={c.cantidad}
                    onChange={(e) =>
                      actualizarFila(index, 'cantidad', e.target.value)
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => quitarFila(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    aria-label="Quitar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <datalist id="claves-sugeridas">
              {clavesSugeridas.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>

            <button
              type="button"
              onClick={agregarFila}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              <Plus className="w-4 h-4" />
              Agregar {dimension}
            </button>
          </div>

          <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
            Si no defines ninguna cuota, los supervisores podrán asignar libremente
            hasta el cupo total de cada horario.
          </p>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 text-sm font-medium disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </div>
    </div>
  );
}
