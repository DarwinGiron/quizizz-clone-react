import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { format, addMinutes, isBefore, parse } from 'date-fns';
import { GraduationCap } from 'lucide-react';
import { BackButton } from '../../../shared';
import { CalendarioRango } from '../components';

const CreateCapacitacion = () => {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    duracionBloque: 30,
    cupoBloque: 30,
    horaInicioDia: '08:00',
    horaFinDia: '17:00',
    omitirMediodia: true,
    horaInicioDescanso: '12:00',
    horaFinDescanso: '14:00',
  });

  const [loading, setLoading] = useState(false);
  const [capacitacionesExistentes, setCapacitacionesExistentes] = useState([]);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const manejarSeleccionRango = (rango) => {
    setForm({
      ...form,
      fechaInicio: rango.fechaInicio,
      fechaFin: rango.fechaFin
    });
  };

  // Cargar capacitaciones existentes
  useEffect(() => {
    const cargarCapacitaciones = async () => {
      try {
        const capacitacionesRef = collection(db, 'capacitaciones');
        const snapshot = await getDocs(capacitacionesRef);
        const capacitaciones = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCapacitacionesExistentes(capacitaciones);
      } catch (error) {
        console.error('Error al cargar capacitaciones:', error);
      }
    };

    cargarCapacitaciones();
  }, []);

  const generarBloques = (fechaInicio, fechaFin) => {
    const bloques = [];
    const startDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const fecha = format(d, 'yyyy-MM-dd');
      let horaActual = parse(form.horaInicioDia, 'HH:mm', d);
      const horaFin = parse(form.horaFinDia, 'HH:mm', d);

      while (isBefore(horaActual, horaFin)) {
        const siguiente = addMinutes(horaActual, Number(form.duracionBloque));
        const horaIniStr = format(horaActual, 'HH:mm');
        const horaFinStr = format(siguiente, 'HH:mm');

        const estaEnDescanso =
          form.omitirMediodia &&
          horaIniStr >= form.horaInicioDescanso &&
          horaIniStr < form.horaFinDescanso;

        if (!estaEnDescanso && isBefore(siguiente, addMinutes(horaFin, 1))) {
          bloques.push({
            fecha,
            hora_inicio: horaIniStr,
            hora_fin: horaFinStr,
            participantes: [],
            cupo_disponible: Number(form.cupoBloque),
          });
        }
        horaActual = siguiente;
      }
    }

    return bloques;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const bloques = generarBloques(form.fechaInicio, form.fechaFin);

      const nuevaCapacitacion = {
        titulo: form.titulo,
        descripcion: form.descripcion,
        fecha_inicio: form.fechaInicio,
        fecha_fin: form.fechaFin,
        duracion_bloque: Number(form.duracionBloque),
        cupo_bloque: Number(form.cupoBloque),
        descanso_medio_dia: form.omitirMediodia,
        hora_inicio_dia: form.horaInicioDia,
        hora_fin_dia: form.horaFinDia,
        hora_inicio_descanso: form.horaInicioDescanso,
        hora_fin_descanso: form.horaFinDescanso,
        bloques_generados: true,
      };

      const capRef = await addDoc(collection(db, 'capacitaciones'), nuevaCapacitacion);

      const bloquesRef = collection(db, 'capacitacion_bloques');
      for (let bloque of bloques) {
        await addDoc(bloquesRef, {
          ...bloque,
          capacitacion_id: capRef.id,
        });
      }

      navigate('/capacitaciones');
    } catch (error) {
      console.error('Error al crear capacitación:', error);
      alert('Error al crear la capacitación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <BackButton to="/capacitaciones" label="Volver a Capacitaciones" className="mb-4" />
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-2.5 rounded-lg">
          <GraduationCap className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nueva Capacitación</h2>
          <p className="text-sm text-gray-500">
            Define las fechas, horarios y cupos de la capacitación.
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {/* Sección de fechas con calendario mejorado */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="mb-3">
              <h3 className="text-lg font-semibold text-gray-800">Seleccionar Fechas</h3>
              <p className="text-sm text-gray-600 mt-1">
                Haz clic en las fechas para seleccionar el rango de la capacitación. 
                Las fechas ocupadas se muestran con el nombre del evento.
              </p>
            </div>

            {/* Calendario interactivo - siempre visible */}
            <div className="mt-4">
              <CalendarioRango
                fechaInicio={form.fechaInicio}
                fechaFin={form.fechaFin}
                onSeleccionarRango={manejarSeleccionRango}
                capacitacionesExistentes={capacitacionesExistentes}
              />
            </div>

            {/* Información del rango seleccionado */}
            {form.fechaInicio && form.fechaFin && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-green-800 font-medium">
                    Rango seleccionado: {form.fechaInicio} a {form.fechaFin}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
          <input
            name="titulo"
            value={form.titulo}
            placeholder="Título de la capacitación"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            onChange={handleChange}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            name="descripcion"
            value={form.descripcion}
            placeholder="Descripción de la capacitación"
            rows={4}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Duración por bloque</label>
            <select
              name="duracionBloque"
              value={form.duracionBloque}
              className="w-full p-2 border rounded-lg"
              onChange={handleChange}
            >
              <option value={30}>30 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cupo por bloque</label>
            <input
              name="cupoBloque"
              type="number"
              value={form.cupoBloque}
              className="w-full p-2 border rounded-lg"
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio del día</label>
            <input
              type="time"
              name="horaInicioDia"
              value={form.horaInicioDia}
              className="w-full p-2 border rounded-lg"
              onChange={handleChange}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin del día</label>
            <input
              type="time"
              name="horaFinDia"
              value={form.horaFinDia}
              className="w-full p-2 border rounded-lg"
              onChange={handleChange}
            />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="omitirMediodia"
            checked={form.omitirMediodia}
            onChange={handleChange}
          />
          Omitir horario de descanso
        </label>

        {/* Campos para horario de descanso - solo se muestran si está marcado */}
        {form.omitirMediodia && (
          <div className="flex gap-4 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora inicio del descanso</label>
              <input
                type="time"
                name="horaInicioDescanso"
                value={form.horaInicioDescanso}
                className="w-full p-2 border rounded-lg"
                onChange={handleChange}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora fin del descanso</label>
              <input
                type="time"
                name="horaFinDescanso"
                value={form.horaFinDescanso}
                className="w-full p-2 border rounded-lg"
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading && (
            <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {loading ? 'Creando...' : 'Crear Capacitación'}
        </button>
      </form>
    </div>
  );
};

export default CreateCapacitacion;
