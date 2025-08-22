import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';

const CalendarioRango = ({ fechaInicio, fechaFin, onSeleccionarRango, capacitacionesExistentes = [] }) => {
  const [mesActual, setMesActual] = useState(new Date());
  const [rangoTemporal, setRangoTemporal] = useState({ inicio: null, fin: null });

  // Verificar si una fecha tiene capacitaciones programadas
  const obtenerCapacitacionEnFecha = (fecha) => {
    const fechaStr = format(fecha, 'yyyy-MM-dd');
    return capacitacionesExistentes.filter(cap => {
      const fechaInicioCap = cap.fecha_inicio;
      const fechaFinCap = cap.fecha_fin;
      return fechaStr >= fechaInicioCap && fechaStr <= fechaFinCap;
    });
  };

  const navegarMes = (direccion) => {
    if (direccion === 'anterior') {
      setMesActual(subMonths(mesActual, 1));
    } else {
      setMesActual(addMonths(mesActual, 1));
    }
  };

  const obtenerDiasMes = () => {
    const inicioMes = startOfMonth(mesActual);
    const finMes = endOfMonth(mesActual);
    const inicioCalendario = startOfWeek(inicioMes, { weekStartsOn: 1 });
    const finCalendario = endOfWeek(finMes, { weekStartsOn: 1 });

    const dias = [];
    let dia = inicioCalendario;

    while (dia <= finCalendario) {
      dias.push(new Date(dia));
      dia = addDays(dia, 1);
    }

    return dias;
  };

  const manejarClickDia = (fecha) => {
    if (!rangoTemporal.inicio) {
      // Primer clic - seleccionar fecha de inicio
      setRangoTemporal({ inicio: fecha, fin: null });
    } else if (!rangoTemporal.fin) {
      // Segundo clic - seleccionar fecha de fin
      const inicio = rangoTemporal.inicio;
      const fin = fecha;
      
      // Asegurar que la fecha de fin sea después de la de inicio
      if (isAfter(fin, inicio) || isSameDay(fin, inicio)) {
        setRangoTemporal({ inicio, fin });
        onSeleccionarRango({
          fechaInicio: format(inicio, 'yyyy-MM-dd'),
          fechaFin: format(fin, 'yyyy-MM-dd')
        });
      } else {
        // Si la fecha de fin es anterior, intercambiar
        setRangoTemporal({ inicio: fecha, fin: inicio });
        onSeleccionarRango({
          fechaInicio: format(fecha, 'yyyy-MM-dd'),
          fechaFin: format(inicio, 'yyyy-MM-dd')
        });
      }
    } else {
      // Tercer clic - resetear y empezar de nuevo
      setRangoTemporal({ inicio: fecha, fin: null });
    }
  };

  const obtenerClaseDia = (fecha) => {
    // Clase base para todos los días - diseño más limpio y espacioso
    let clases = 'w-full h-24 flex flex-col items-start justify-start p-2 text-sm cursor-pointer transition-all duration-200 relative border border-gray-300 bg-white';
    
    if (!isSameMonth(fecha, mesActual)) {
      clases += ' text-gray-400 bg-gray-50';
    } else {
      clases += ' text-gray-900 hover:bg-gray-50';
    }

    // Prioridad 1: Fecha de inicio seleccionada
    if (rangoTemporal.inicio && isSameDay(fecha, rangoTemporal.inicio)) {
      return clases + ' !bg-green-100 !text-green-800 font-bold hover:!bg-green-200 !border-green-300';
    }
    // Prioridad 2: Fecha de fin seleccionada
    else if (rangoTemporal.fin && isSameDay(fecha, rangoTemporal.fin)) {
      return clases + ' !bg-green-100 !text-green-800 font-bold hover:!bg-green-200 !border-green-300';
    }
    // Prioridad 3: Días en el rango seleccionado
    else if (rangoTemporal.inicio && rangoTemporal.fin && 
             isAfter(fecha, rangoTemporal.inicio) && 
             isBefore(fecha, rangoTemporal.fin)) {
      return clases + ' !bg-green-50 !text-green-700 font-medium hover:!bg-green-100 !border-green-200';
    }
    // Días normales
    else {
      return clases + ' hover:bg-gray-50';
    }
  };

  // Función para obtener eventos que atraviesan múltiples días
  const obtenerEventosExtendidos = () => {
    const eventos = [];
    const diasMes = obtenerDiasMes();
    
    capacitacionesExistentes.forEach(cap => {
      const fechaInicio = new Date(cap.fecha_inicio);
      const fechaFin = new Date(cap.fecha_fin);
      
      // Verificar si el evento está en el mes actual
      const inicioMes = startOfMonth(mesActual);
      const finMes = endOfMonth(mesActual);
      
      if ((fechaInicio >= inicioMes && fechaInicio <= finMes) ||
          (fechaFin >= inicioMes && fechaFin <= finMes) ||
          (fechaInicio <= inicioMes && fechaFin >= finMes)) {
        
        // Encontrar posición inicial y final en el grid
        const fechaInicioEnMes = fechaInicio < inicioMes ? inicioMes : fechaInicio;
        const fechaFinEnMes = fechaFin > finMes ? finMes : fechaFin;
        
        const inicioIndex = diasMes.findIndex(dia => isSameDay(dia, fechaInicioEnMes));
        const finIndex = diasMes.findIndex(dia => isSameDay(dia, fechaFinEnMes));
        
        if (inicioIndex !== -1 && finIndex !== -1) {
          // Calcular fila y columnas
          const filaInicio = Math.floor(inicioIndex / 7);
          const columnaInicio = inicioIndex % 7;
          const filaFin = Math.floor(finIndex / 7);
          const columnaFin = finIndex % 7;
          
          // Crear un mapa de eventos por fila para evitar superposición
          const eventosPorFila = new Map();
          
          // Si el evento está en la misma fila
          if (filaInicio === filaFin) {
            const nivel = eventosPorFila.get(filaInicio) || 0;
            eventos.push({
              id: cap.id,
              titulo: cap.titulo,
              fila: filaInicio,
              nivel: nivel,
              columnaInicio: columnaInicio,
              columnaFin: columnaFin,
              ancho: (columnaFin - columnaInicio + 1) * 100 / 7,
              left: (columnaInicio * 100 / 7) + 0.5,
              width: ((columnaFin - columnaInicio + 1) * 100 / 7) - 1
            });
            eventosPorFila.set(filaInicio, nivel + 1);
          } else {
            // Si el evento se extiende a múltiples filas, crear segmentos conectados
            for (let fila = filaInicio; fila <= filaFin; fila++) {
              const colInicio = fila === filaInicio ? columnaInicio : 0;
              const colFin = fila === filaFin ? columnaFin : 6;
              const nivel = eventosPorFila.get(fila) || 0;
              
              eventos.push({
                id: `${cap.id}-${fila}`,
                titulo: fila === filaInicio ? cap.titulo : '', // Solo mostrar título en primera fila
                fila: fila,
                nivel: nivel,
                columnaInicio: colInicio,
                columnaFin: colFin,
                ancho: (colFin - colInicio + 1) * 100 / 7,
                left: (colInicio * 100 / 7) + 0.5,
                width: ((colFin - colInicio + 1) * 100 / 7) - 1,
                isFirst: fila === filaInicio,
                isLast: fila === filaFin
              });
              eventosPorFila.set(fila, nivel + 1);
            }
          }
        }
      }
    });
    
    return eventos;
  };

  const diasSemana = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const diasMes = obtenerDiasMes();
  const eventosExtendidos = obtenerEventosExtendidos();

  return (
    <div className="bg-white border border-gray-300 shadow-lg">
      {/* Header del calendario */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white">
        <button
          type="button"
          onClick={() => navegarMes('anterior')}
          className="p-2 hover:bg-yellow-600 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h3 className="text-xl font-bold">
          {format(mesActual, 'MMMM yyyy', { locale: es })}
        </h3>
        
        <button
          type="button"
          onClick={() => navegarMes('siguiente')}
          className="p-2 hover:bg-yellow-600 rounded transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7">
        {diasSemana.map(dia => (
          <div key={dia} className="text-center text-sm font-medium text-gray-800 py-3 bg-yellow-200 border-b border-gray-300">
            {dia}
          </div>
        ))}
      </div>

      {/* Contenedor del calendario */}
      <div className="relative">
        {/* Días del mes */}
        <div className="grid grid-cols-7">
          {diasMes.map(fecha => {
            const capacitacionesEnFecha = obtenerCapacitacionEnFecha(fecha);
            return (
              <div
                key={fecha.toISOString()}
                onClick={() => manejarClickDia(fecha)}
                className={obtenerClaseDia(fecha)}
                title={capacitacionesEnFecha.length > 0 ? 
                  `Capacitaciones: ${capacitacionesEnFecha.map(cap => cap.titulo).join(', ')}` : 
                  `Seleccionar ${format(fecha, 'dd/MM/yyyy')}`
                }
              >
                <div className="font-medium text-gray-900">
                  {format(fecha, 'd')}
                </div>
                
                {/* No mostrar eventos individuales aquí - solo los flotantes */}
              </div>
            );
          })}
        </div>

        {/* Eventos flotantes que se extienden horizontalmente */}
        {eventosExtendidos.map(evento => {
          const isMultiRow = evento.isFirst !== undefined;
          
          return (
            <div
              key={evento.id}
              className="absolute bg-yellow-400 text-gray-800 text-sm px-3 py-2 font-medium border border-yellow-500 shadow-sm hover:bg-yellow-500 transition-colors flex items-center justify-center"
              style={{
                top: `${evento.fila * 96 + 40 + (evento.nivel * 32)}px`, // Posición ajustada para h-24 (96px) + más espacio desde el número
                left: `calc(${evento.left}% + 4px)`, // Pequeño margen desde el borde
                width: `calc(${evento.width}% - 8px)`, // Ancho responsivo con márgenes
                height: '28px', // Altura fija para mejor legibilidad
                zIndex: 15,
                fontSize: '12px',
                borderRadius: isMultiRow ? (
                  evento.isFirst && evento.isLast ? '4px' :
                  evento.isFirst ? '4px 0 0 4px' :
                  evento.isLast ? '0 4px 4px 0' : '0'
                ) : '4px',
                // Asegurar que no se salga del contenedor
                minWidth: '60px',
                maxWidth: `calc(${evento.width}% - 8px)`
              }}
            >
              <div className="truncate text-center w-full font-semibold" title={evento.titulo}>
                {evento.titulo}
              </div>
            </div>
          );
        })}
      </div>

      {/* Información del rango seleccionado */}
      {rangoTemporal.inicio && rangoTemporal.fin && (
        <div className="p-4 bg-green-50 border-t border-gray-300">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-green-800">Seleccionado:</span>
              <span className="bg-white px-3 py-1 rounded border border-green-300 font-mono">
                {format(rangoTemporal.inicio, 'dd/MM/yyyy', { locale: es })}
              </span>
              <span className="text-green-600">→</span>
              <span className="bg-white px-3 py-1 rounded border border-green-300 font-mono">
                {format(rangoTemporal.fin, 'dd/MM/yyyy', { locale: es })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Capacitaciones del mes */}
      {(() => {
        const capacitacionesDelMes = capacitacionesExistentes.filter(cap => {
          const fechaInicioCap = new Date(cap.fecha_inicio);
          const fechaFinCap = new Date(cap.fecha_fin);
          const inicioMes = startOfMonth(mesActual);
          const finMes = endOfMonth(mesActual);
          
          return (fechaInicioCap >= inicioMes && fechaInicioCap <= finMes) ||
                 (fechaFinCap >= inicioMes && fechaFinCap <= finMes) ||
                 (fechaInicioCap <= inicioMes && fechaFinCap >= finMes);
        });

        if (capacitacionesDelMes.length > 0) {
          return (
            <div className="p-4 bg-yellow-50 border-t border-gray-300">
              <div className="text-sm font-medium text-yellow-800 mb-2">
                📚 Capacitaciones programadas este mes:
              </div>
              <div className="space-y-1">
                {capacitacionesDelMes.map(cap => (
                  <div key={cap.id} className="flex items-center justify-between bg-white p-2 rounded border border-yellow-200">
                    <span className="font-medium text-yellow-900">{cap.titulo}</span>
                    <span className="text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded font-mono">
                      {format(new Date(cap.fecha_inicio), 'dd/MM', { locale: es })} - {format(new Date(cap.fecha_fin), 'dd/MM', { locale: es })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
};

export default CalendarioRango;
