// Utilidades del modelo de cuotas de asignación por área / máquina.
//
// La configuración se guarda en el documento de la capacitación:
//   asignacion_config: {
//     modo: 'cuota_por_area' | 'cuota_por_maquina',
//     cuotas: [{ clave: 'Soldadura', cantidad: 2 }, ...]
//   }
// La cuota aplica POR HORARIO (bloque) y es compartida entre supervisores.

export const MODO_AREA = 'cuota_por_area';
export const MODO_MAQUINA = 'cuota_por_maquina';

// Obtiene la "clave" (área o máquina) de una persona según el modo.
export const getClavePersona = (persona, modo) => {
  if (!persona) return null;
  if (modo === MODO_MAQUINA) {
    return persona.maquina || persona.equipo || persona.tipo || null;
  }
  return persona.area || null;
};

// Cuenta participantes de un bloque agrupados por clave.
export const contarPorClave = (participantes = [], modo) => {
  const conteo = {};
  participantes.forEach((p) => {
    const clave = getClavePersona(p, modo);
    if (clave) conteo[clave] = (conteo[clave] || 0) + 1;
  });
  return conteo;
};

// Normaliza la config (tolera ausencia o formato viejo).
export const normalizarConfig = (config) => {
  if (!config || typeof config !== 'object') {
    return { modo: MODO_AREA, cuotas: [] };
  }
  return {
    modo: config.modo === MODO_MAQUINA ? MODO_MAQUINA : MODO_AREA,
    cuotas: Array.isArray(config.cuotas)
      ? config.cuotas
          .filter((c) => c && c.clave)
          .map((c) => ({ clave: c.clave, cantidad: Number(c.cantidad) || 0 }))
      : [],
  };
};

export const tieneCuotas = (config) => {
  const n = normalizarConfig(config);
  return n.cuotas.length > 0;
};

// Dado un bloque y la config, devuelve el progreso por clave:
// [{ clave, requerido, asignado, completo }]
export const getProgresoBloque = (bloque, config) => {
  const { modo, cuotas } = normalizarConfig(config);
  const conteo = contarPorClave(bloque?.participantes || [], modo);
  return cuotas.map((c) => {
    const asignado = conteo[c.clave] || 0;
    return {
      clave: c.clave,
      requerido: c.cantidad,
      asignado,
      completo: asignado >= c.cantidad,
    };
  });
};

// ¿Se puede agregar a `persona` al `bloque` según la config?
// Devuelve { ok: boolean, motivo?: string }.
export const puedeAgregar = (persona, bloque, config) => {
  const cupo = bloque?.cupo_disponible ?? Infinity;
  const ocupados = bloque?.participantes?.length || 0;
  if (ocupados >= cupo) {
    return { ok: false, motivo: 'El horario ya está completo.' };
  }

  const { modo, cuotas } = normalizarConfig(config);
  // Sin cuotas definidas: solo aplica el cupo total del bloque.
  if (cuotas.length === 0) return { ok: true };

  const clave = getClavePersona(persona, modo);
  const cuota = cuotas.find((c) => c.clave === clave);
  if (!cuota) {
    const dimension = modo === MODO_MAQUINA ? 'máquina' : 'área';
    return {
      ok: false,
      motivo: `Su ${dimension} (${clave || 'sin definir'}) no es requerida en esta capacitación.`,
    };
  }

  const conteo = contarPorClave(bloque?.participantes || [], modo);
  const asignado = conteo[clave] || 0;
  if (asignado >= cuota.cantidad) {
    return {
      ok: false,
      motivo: `Ya se cubrió la cuota de "${clave}" (${cuota.cantidad}) en este horario.`,
    };
  }

  return { ok: true };
};
