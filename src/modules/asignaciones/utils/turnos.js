// Modelo de turnos rotativos para la convocatoria automática.
//
// Hay 3 turnos que rotan SEMANALMENTE en el ciclo: día → noche → tarde → día.
// El turno se define a nivel de supervisor/cuadrilla (todo su personal lo comparte).
// Cada supervisor guarda en `usuarios`:
//   - turno:        'dia' | 'tarde' | 'noche'  (su turno en la semana de referencia)
//   - turno_semana: 'yyyy-MM-dd'               (lunes de esa semana de referencia)
// A partir de ahí se calcula el turno en cualquier otra semana rotando el ciclo.

import { differenceInCalendarWeeks } from 'date-fns';

// Rangos horarios por defecto (editables aquí si la operación cambia).
export const TURNOS = {
  dia: { id: 'dia', label: 'Día', inicio: '06:00', fin: '14:00' },
  tarde: { id: 'tarde', label: 'Tarde', inicio: '14:00', fin: '22:00' },
  noche: { id: 'noche', label: 'Noche', inicio: '22:00', fin: '06:00' },
};

export const TURNO_IDS = ['dia', 'tarde', 'noche'];

// Orden de rotación semanal: día → noche → tarde → (día).
const ORDEN_ROTACION = ['dia', 'noche', 'tarde'];

export const labelTurno = (id) => TURNOS[id]?.label || id;

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

// Turno del supervisor en una fecha dada, considerando la rotación semanal.
export const turnoDeSupervisorEnFecha = (supervisor, fecha) => {
  const base = supervisor?.turno || 'dia';
  if (!fecha) return base;
  const semanaRef = supervisor?.turno_semana
    ? createLocalDate(supervisor.turno_semana)
    : fecha;
  const n = differenceInCalendarWeeks(fecha, semanaRef, { weekStartsOn: 1 });
  return turnoTrasSemanas(base, n);
};

// Turno requerido por un bloque según su hora de inicio ('HH:mm').
export const turnoDeBloque = (bloque) => {
  const t = bloque?.hora_inicio || '';
  if (t >= '06:00' && t < '14:00') return 'dia';
  if (t >= '14:00' && t < '22:00') return 'tarde';
  return 'noche';
};
