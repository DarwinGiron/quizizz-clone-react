// Modelo de turnos rotativos para la convocatoria automática.
//
// Hay 3 posiciones estructurales que rotan SEMANALMENTE en un orden fijo:
// dia → noche → tarde → dia → ... Ese orden nunca cambia. Lo que SÍ es
// editable por el admin (ver ConfigurarTurnosModal) es el nombre para
// mostrar y el horario (inicio/fin) de cada una de esas 3 posiciones.
// La configuración vigente se guarda en Firestore: config/turnos.
//
// Cada supervisor guarda en `usuarios`:
//   - turno:        'dia' | 'tarde' | 'noche'  (su posición en la semana de referencia)
//   - turno_semana: 'yyyy-MM-dd'               (lunes de esa semana de referencia)
//   - turno_modo:   'rotativo' | 'fijo'         (si es 'fijo', nunca rota)

import { differenceInCalendarWeeks } from 'date-fns';

export const TURNO_IDS = ['dia', 'tarde', 'noche'];

// Orden de rotación semanal, fijo por diseño: día → noche → tarde → (día).
const ORDEN_ROTACION = ['dia', 'noche', 'tarde'];

// Valores por defecto si el admin todavía no configuró nada en Firestore.
export const DEFAULT_TURNOS_CONFIG = {
  dia: { nombre: 'Día', inicio: '06:00', fin: '14:00' },
  tarde: { nombre: 'Tarde', inicio: '14:00', fin: '22:00' },
  noche: { nombre: 'Noche', inicio: '22:00', fin: '06:00' },
};

export const labelTurno = (config, id) =>
  config?.[id]?.nombre || DEFAULT_TURNOS_CONFIG[id]?.nombre || id;

// Parser de fecha local 'yyyy-MM-dd' sin desfase de zona horaria.
const createLocalDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Turno resultante tras avanzar `n` semanas desde `turnoBase`.
export const turnoTrasSemanas = (turnoBase, n) => {
  const i = ORDEN_ROTACION.indexOf(turnoBase);
  if (i === -1) return turnoBase;
  const m = (((i + n) % 3) + 3) % 3;
  return ORDEN_ROTACION[m];
};

// Turno del supervisor en una fecha dada. Si su modo es 'fijo', se queda
// siempre en el mismo turno sin importar la semana.
export const turnoDeSupervisorEnFecha = (supervisor, fecha) => {
  const base = supervisor?.turno || 'dia';
  if (supervisor?.turno_modo === 'fijo') return base;
  if (!fecha) return base;
  const semanaRef = supervisor?.turno_semana
    ? createLocalDate(supervisor.turno_semana)
    : fecha;
  const n = differenceInCalendarWeeks(fecha, semanaRef, { weekStartsOn: 1 });
  return turnoTrasSemanas(base, n);
};

// ¿La hora 'HH:mm' cae dentro de [inicio, fin)? Soporta rangos que cruzan
// medianoche (ej. 22:00 a 06:00).
const horaEnRango = (hora, inicio, fin) => {
  if (inicio <= fin) return hora >= inicio && hora < fin;
  return hora >= inicio || hora < fin; // cruza medianoche
};

// Turno requerido por un bloque según su hora de inicio ('HH:mm'), usando
// los horarios configurados (o los de por defecto si no hay config).
export const turnoDeBloque = (config, bloque) => {
  const t = bloque?.hora_inicio || '';
  const cfg = config || DEFAULT_TURNOS_CONFIG;
  for (const id of TURNO_IDS) {
    const { inicio, fin } = cfg[id] || DEFAULT_TURNOS_CONFIG[id];
    if (horaEnRango(t, inicio, fin)) return id;
  }
  return 'dia';
};
