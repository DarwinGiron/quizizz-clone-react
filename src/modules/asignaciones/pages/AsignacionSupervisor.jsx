import React, { useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { db } from '../../../firebase/config';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { BackButton, useAuth } from '../../../shared';
import {
  Users,
  UserCircle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react';
import {
  normalizarConfig,
  getProgresoBloque,
  getClavePersona,
  puedeAgregar,
  MODO_MAQUINA,
} from '../utils/cuotas';

export default function AsignacionSupervisor() {
  const { capacitacionId } = useParams();
  const { supervisorId, user } = useAuth();

  const [capacitacion, setCapacitacion] = useState(null);
  const [bloques, setBloques] = useState([]);
  const [cuadrilla, setCuadrilla] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [accionEnCurso, setAccionEnCurso] = useState(false);

  // Helpers de fecha locales (evitan desfase por zona horaria).
  const createLocalDate = (dateString) => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };
  const formatLocalDate = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!supervisorId) return;
      try {
        // Capacitación
        const capSnap = await getDoc(doc(db, 'capacitaciones', capacitacionId));
        const capData = capSnap.exists()
          ? { id: capSnap.id, ...capSnap.data() }
          : null;
        setCapacitacion(capData);

        // Fecha inicial = inicio de la capacitación (o hoy)
        const inicio =
          createLocalDate(capData?.fecha_inicio) || new Date();
        setFechaSeleccionada(inicio);

        // Bloques de la capacitación
        const bloquesSnap = await getDocs(
          query(
            collection(db, 'capacitacion_bloques'),
            where('capacitacion_id', '==', capacitacionId)
          )
        );
        setBloques(
          bloquesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );

        // Solo la cuadrilla del supervisor logueado
        const cuadSnap = await getDocs(
          query(
            collection(db, 'cuadrilla'),
            where('supervisor_id', '==', supervisorId)
          )
        );
        setCuadrilla(
          cuadSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
        );
      } catch (error) {
        console.error('Error al cargar datos del supervisor:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [capacitacionId, supervisorId]);

  const config = useMemo(
    () => normalizarConfig(capacitacion?.asignacion_config),
    [capacitacion]
  );

  const getBloquesDelDia = (fecha) => {
    const fechaStr = formatLocalDate(fecha);
    return bloques
      .filter((b) => b.fecha === fechaStr)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  };

  // ¿La persona ya está asignada en algún bloque de esta capacitación?
  const estaAsignado = (personaId) =>
    bloques.some((b) => b.participantes?.some((p) => p.id === personaId));

  // Participantes de un bloque que pertenecen a este supervisor.
  const misParticipantes = (bloque) =>
    (bloque.participantes || []).filter(
      (p) => p.supervisor_id === supervisorId
    );

  // Personas elegibles para un bloque (de mi cuadrilla, no asignadas y que
  // cumplen la cuota correspondiente).
  const getElegibles = (bloque) =>
    cuadrilla.filter(
      (p) => !estaAsignado(p.id) && puedeAgregar(p, bloque, config).ok
    );

  const asignar = async (bloque, personaId) => {
    const persona = cuadrilla.find((p) => p.id === personaId);
    if (!persona || accionEnCurso) return;

    const validacion = puedeAgregar(persona, bloque, config);
    if (!validacion.ok) {
      alert(validacion.motivo);
      return;
    }
    if (estaAsignado(persona.id)) {
      alert('Esta persona ya está asignada en esta capacitación.');
      return;
    }

    // Aseguramos que el participante lleve el supervisor_id.
    const participante = { ...persona, supervisor_id: supervisorId };
    const nuevos = [...(bloque.participantes || []), participante];

    setAccionEnCurso(true);
    try {
      await updateDoc(doc(db, 'capacitacion_bloques', bloque.id), {
        participantes: nuevos,
      });
      setBloques((prev) =>
        prev.map((b) =>
          b.id === bloque.id ? { ...b, participantes: nuevos } : b
        )
      );
    } catch (error) {
      console.error('Error al asignar:', error);
      alert('No se pudo asignar. Intenta de nuevo.');
    } finally {
      setAccionEnCurso(false);
    }
  };

  const desasignar = async (bloque, participante) => {
    if (accionEnCurso) return;
    // Solo puede quitar a quien él asignó.
    if (participante.supervisor_id !== supervisorId) {
      alert('Solo puedes quitar al personal que tú asignaste.');
      return;
    }
    const nombre = participante.codigo
      ? `${participante.codigo} - ${participante.nombre}`
      : participante.nombre;
    if (!window.confirm(`¿Quitar a ${nombre} del horario ${bloque.hora_inicio}?`))
      return;

    const nuevos = (bloque.participantes || []).filter(
      (p) => p.id !== participante.id
    );

    setAccionEnCurso(true);
    try {
      await updateDoc(doc(db, 'capacitacion_bloques', bloque.id), {
        participantes: nuevos,
      });
      setBloques((prev) =>
        prev.map((b) =>
          b.id === bloque.id ? { ...b, participantes: nuevos } : b
        )
      );
    } catch (error) {
      console.error('Error al desasignar:', error);
      alert('No se pudo quitar. Intenta de nuevo.');
    } finally {
      setAccionEnCurso(false);
    }
  };

  if (loading || !fechaSeleccionada) {
    return (
      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
          <p className="text-gray-600">Cargando asignaciones...</p>
        </div>
      </div>
    );
  }

  const dimensionLabel = config.modo === MODO_MAQUINA ? 'máquina' : 'área';
  const bloquesDelDia = getBloquesDelDia(fechaSeleccionada);
  const asignadosCuadrilla = cuadrilla.filter((p) => estaAsignado(p.id)).length;

  return (
    <div className="flex-1 bg-gray-50 p-6 min-h-screen">
      <BackButton
        to="/mis-asignaciones"
        label="Volver a Mis Asignaciones"
        className="mb-4"
      />

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
          {capacitacion?.titulo || 'Capacitación'}
        </h1>
        <p className="text-gray-600 text-sm">
          Asignando como{' '}
          <span className="font-semibold text-purple-700">
            {user?.nombre}
          </span>
          {config.cuotas.length > 0 && (
            <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
              Cuota por {dimensionLabel}
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de mi cuadrilla */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-1">
              Mi cuadrilla
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {cuadrilla.length}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              {asignadosCuadrilla} asignado{asignadosCuadrilla !== 1 ? 's' : ''} ·{' '}
              {cuadrilla.length - asignadosCuadrilla} disponible
              {cuadrilla.length - asignadosCuadrilla !== 1 ? 's' : ''}
            </p>

            <div className="space-y-2 max-h-[28rem] overflow-y-auto">
              {cuadrilla.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <div className="text-sm">No tienes personal en tu cuadrilla</div>
                </div>
              ) : (
                cuadrilla.map((persona) => {
                  const asignado = estaAsignado(persona.id);
                  const clave = getClavePersona(persona, config.modo);
                  return (
                    <div
                      key={persona.id}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        asignado
                          ? 'bg-green-50 border-green-300 text-green-900'
                          : 'bg-white border-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {persona.codigo
                              ? `${persona.codigo} - ${persona.nombre}`
                              : persona.nombre}
                          </div>
                          {clave && (
                            <div className="text-xs text-gray-500 truncate">
                              {clave}
                            </div>
                          )}
                        </div>
                        {asignado ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex-shrink-0">
                            Libre
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Panel de horarios del día */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-sm p-4">
            {/* Navegación de día */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 capitalize">
                {format(fechaSeleccionada, "EEEE, dd 'de' MMMM yyyy", {
                  locale: es,
                })}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setFechaSeleccionada(addDays(fechaSeleccionada, -1))
                  }
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  ← Día anterior
                </button>
                <button
                  onClick={() =>
                    setFechaSeleccionada(addDays(fechaSeleccionada, 1))
                  }
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                >
                  Día siguiente →
                </button>
              </div>
            </div>

            {bloquesDelDia.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium mb-1">
                  No hay horarios este día
                </h3>
                <p className="text-sm">Usa las flechas para cambiar de día.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {bloquesDelDia.map((bloque) => {
                  const ocupados = bloque.participantes?.length || 0;
                  const cupo = bloque.cupo_disponible ?? 0;
                  const lleno = ocupados >= cupo;
                  const progreso = getProgresoBloque(bloque, config);
                  const mios = misParticipantes(bloque);
                  const elegibles = getElegibles(bloque);

                  return (
                    <div
                      key={bloque.id}
                      className="border-2 border-gray-200 rounded-lg p-4 flex flex-col"
                    >
                      {/* Encabezado del bloque */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-bold text-gray-800">
                          {bloque.hora_inicio} - {bloque.hora_fin}
                        </div>
                        <div
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            lleno
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {ocupados}/{cupo}
                        </div>
                      </div>

                      {/* Progreso por cuota */}
                      {progreso.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {progreso.map((p) => (
                            <span
                              key={p.clave}
                              className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                                p.completo
                                  ? 'bg-green-50 text-green-700 border-green-300'
                                  : 'bg-amber-50 text-amber-700 border-amber-300'
                              }`}
                              title={`${p.clave}: ${p.asignado} de ${p.requerido}`}
                            >
                              {p.completo ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              {p.clave} {p.asignado}/{p.requerido}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Mis asignados en este bloque */}
                      <div className="space-y-1.5 mb-3 flex-1">
                        {mios.length === 0 ? (
                          <div className="text-xs text-gray-400 text-center py-3 border border-dashed border-gray-200 rounded-lg">
                            Aún no has asignado a nadie aquí
                          </div>
                        ) : (
                          mios.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between bg-green-50 border border-green-300 text-green-900 rounded-lg px-2 py-1.5 group"
                            >
                              <span className="text-xs font-medium truncate">
                                {p.codigo
                                  ? `${p.codigo} - ${p.nombre}`
                                  : p.nombre}
                              </span>
                              <button
                                onClick={() => desasignar(bloque, p)}
                                disabled={accionEnCurso}
                                className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-0.5 transition disabled:opacity-50"
                                title="Quitar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Agregar persona */}
                      {lleno ? (
                        <div className="text-center text-xs bg-red-50 text-red-700 rounded-lg py-2 font-medium">
                          Horario completo
                        </div>
                      ) : elegibles.length === 0 ? (
                        <div className="text-center text-xs text-gray-400 py-2">
                          Sin personal elegible para este horario
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Plus className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                          <select
                            value=""
                            disabled={accionEnCurso}
                            onChange={(e) =>
                              e.target.value &&
                              asignar(bloque, e.target.value)
                            }
                            className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          >
                            <option value="">
                              Agregar de mi cuadrilla...
                            </option>
                            {elegibles.map((p) => {
                              const clave = getClavePersona(p, config.modo);
                              return (
                                <option key={p.id} value={p.id}>
                                  {p.codigo
                                    ? `${p.codigo} - ${p.nombre}`
                                    : p.nombre}
                                  {clave ? ` (${clave})` : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
