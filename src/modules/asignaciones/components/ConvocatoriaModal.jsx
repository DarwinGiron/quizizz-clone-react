import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { X, Zap, AlertTriangle, CheckCircle2, Users } from 'lucide-react';
import { useToast } from '../../../shared';
import {
  normalizarConfig,
  contarPorClave,
  getClavePersona,
} from '../utils/cuotas';
import {
  turnoDeBloque,
  turnoDeSupervisorEnFecha,
  labelTurno,
} from '../utils/turnos';

// Parser de fecha local 'yyyy-MM-dd'.
const createLocalDate = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Convocatoria automática (solo admin).
 * Auto-asigna personal real de las cuadrillas a cada horario, respetando:
 *  - el TURNO rotativo del supervisor vs. la franja del bloque,
 *  - las cuotas por área (si están definidas),
 *  - el cupo del bloque,
 *  - una sola asignación por persona en la capacitación.
 * Muestra una previsualización antes de escribir.
 *
 * Props: capacitacion, bloques, onClose, onAplicado(updatesMap)
 */
export default function ConvocatoriaModal({
  capacitacion,
  bloques,
  onClose,
  onAplicado,
}) {
  const [loading, setLoading] = useState(true);
  const [supervisores, setSupervisores] = useState([]);
  const [cuadrillas, setCuadrillas] = useState({});
  const [aplicando, setAplicando] = useState(false);
  const toast = useToast();

  const config = useMemo(
    () => normalizarConfig(capacitacion?.asignacion_config),
    [capacitacion]
  );

  // Cargar supervisores y sus cuadrillas.
  useEffect(() => {
    const cargar = async () => {
      try {
        const usSnap = await getDocs(
          query(collection(db, 'usuarios'), where('rol', '==', 'supervisor'))
        );
        const sups = usSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setSupervisores(sups);

        const porSup = {};
        for (const sup of sups) {
          const cSnap = await getDocs(
            query(
              collection(db, 'cuadrilla'),
              where('supervisor_id', '==', sup.id)
            )
          );
          porSup[sup.id] = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        }
        setCuadrillas(porSup);
      } catch (e) {
        console.error('Error al cargar datos para convocatoria:', e);
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, []);

  // Construye el plan de asignación (sin escribir nada).
  const { plan, advertencias, totalAsignar } = useMemo(() => {
    if (loading) return { plan: {}, advertencias: [], totalAsignar: 0 };

    const { modo, cuotas } = config;
    const asignadosGlobal = new Set();
    bloques.forEach((b) =>
      (b.participantes || []).forEach((p) => asignadosGlobal.add(p.id))
    );

    const planLocal = {};
    const avisos = [];

    const ordenados = [...bloques].sort((a, b) =>
      `${a.fecha} ${a.hora_inicio}`.localeCompare(`${b.fecha} ${b.hora_inicio}`)
    );

    ordenados.forEach((bloque) => {
      let cupoRestante =
        (bloque.cupo_disponible ?? 0) - (bloque.participantes?.length || 0);
      if (cupoRestante <= 0) return;

      const fechaBloque = createLocalDate(bloque.fecha);
      const reqShift = turnoDeBloque(bloque);

      // Personas elegibles: cuadrillas cuyo supervisor está en el turno requerido.
      const elegibles = [];
      supervisores.forEach((sup) => {
        if (turnoDeSupervisorEnFecha(sup, fechaBloque) !== reqShift) return;
        (cuadrillas[sup.id] || []).forEach((persona) => {
          if (!asignadosGlobal.has(persona.id)) {
            elegibles.push({ persona, supervisorId: sup.id });
          }
        });
      });

      const nuevos = [];

      if (cuotas.length > 0) {
        const conteo = contarPorClave(bloque.participantes || [], modo);
        cuotas.forEach((c) => {
          let faltan = c.cantidad - (conteo[c.clave] || 0);
          for (const cand of elegibles) {
            if (faltan <= 0 || cupoRestante <= 0) break;
            if (asignadosGlobal.has(cand.persona.id)) continue;
            if (getClavePersona(cand.persona, modo) !== c.clave) continue;
            nuevos.push(cand);
            asignadosGlobal.add(cand.persona.id);
            faltan--;
            cupoRestante--;
          }
          if (faltan > 0) {
            avisos.push(
              `${bloque.fecha} ${bloque.hora_inicio}: faltan ${faltan} de "${c.clave}" (sin personal disponible del turno ${labelTurno(
                reqShift
              )}).`
            );
          }
        });
      } else {
        for (const cand of elegibles) {
          if (cupoRestante <= 0) break;
          if (asignadosGlobal.has(cand.persona.id)) continue;
          nuevos.push(cand);
          asignadosGlobal.add(cand.persona.id);
          cupoRestante--;
        }
      }

      if (nuevos.length > 0) planLocal[bloque.id] = nuevos;
    });

    const total = Object.values(planLocal).reduce(
      (acc, arr) => acc + arr.length,
      0
    );
    return { plan: planLocal, advertencias: avisos, totalAsignar: total };
  }, [loading, bloques, supervisores, cuadrillas, config]);

  const bloquesConPlan = useMemo(
    () =>
      bloques
        .filter((b) => plan[b.id]?.length)
        .sort((a, b) =>
          `${a.fecha} ${a.hora_inicio}`.localeCompare(
            `${b.fecha} ${b.hora_inicio}`
          )
        ),
    [bloques, plan]
  );

  const aplicar = async () => {
    setAplicando(true);
    try {
      const updates = {};
      for (const bloque of bloques) {
        const nuevos = plan[bloque.id];
        if (!nuevos?.length) continue;
        const participantes = [
          ...(bloque.participantes || []),
          ...nuevos.map((c) => ({
            ...c.persona,
            supervisor_id: c.supervisorId,
          })),
        ];
        await updateDoc(doc(db, 'capacitacion_bloques', bloque.id), {
          participantes,
        });
        updates[bloque.id] = participantes;
      }
      onAplicado?.(updates);
      onClose?.();
    } catch (e) {
      console.error('Error al aplicar convocatoria:', e);
      toast.error('No se pudo aplicar la convocatoria. Intenta de nuevo.');
    } finally {
      setAplicando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Convocatoria automática
              </h2>
              <p className="text-xs text-gray-500">
                Asigna personal según turno rotativo, cuotas y cupo.
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
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3" />
              <p className="text-gray-600 text-sm">Calculando convocatoria...</p>
            </div>
          ) : (
            <>
              {/* Resumen */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-indigo-700">
                    {totalAsignar}
                  </div>
                  <div className="text-xs text-indigo-600">
                    Personas a convocar
                  </div>
                </div>
                <div className="bg-amber-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-amber-700">
                    {advertencias.length}
                  </div>
                  <div className="text-xs text-amber-600">
                    Cuotas sin cubrir
                  </div>
                </div>
              </div>

              {totalAsignar === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">
                    No hay asignaciones que proponer. Revisa que el personal
                    tenga turno acorde a los horarios y que haya cuadrillas
                    cargadas.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 mb-5">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Vista previa por horario
                  </h3>
                  {bloquesConPlan.map((bloque) => (
                    <div
                      key={bloque.id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-800">
                          {bloque.fecha} · {bloque.hora_inicio}-{bloque.hora_fin}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          Turno {labelTurno(turnoDeBloque(bloque))} · +
                          {plan[bloque.id].length}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {plan[bloque.id].map((c) => (
                          <span
                            key={c.persona.id}
                            className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            {c.persona.codigo
                              ? `${c.persona.codigo} - ${c.persona.nombre}`
                              : c.persona.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Advertencias */}
              {advertencias.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-amber-800 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Cuotas que no se pudieron cubrir
                    </span>
                  </div>
                  <ul className="space-y-1 max-h-32 overflow-y-auto">
                    {advertencias.map((a, i) => (
                      <li key={i} className="text-xs text-amber-700">
                        • {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
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
            onClick={aplicar}
            disabled={loading || aplicando || totalAsignar === 0}
            className="px-4 py-2 rounded-lg text-white bg-amber-600 hover:bg-amber-700 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {aplicando
              ? 'Aplicando...'
              : `Convocar ${totalAsignar} persona${totalAsignar !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
