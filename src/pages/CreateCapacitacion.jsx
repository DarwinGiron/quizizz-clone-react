import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { format, addMinutes, isBefore, parse } from 'date-fns';
import BackButton from '../components/BackButton';

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
  });

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

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
          horaIniStr >= '12:00' &&
          horaIniStr < '14:00';

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
      console.error('❌ Error al crear capacitación:', error);
      alert('Error al crear la capacitación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <BackButton to="/capacitaciones" label="Volver a Capacitaciones" className="mb-4" />
      <h2 className="text-2xl font-bold mb-4">Nueva Capacitación</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="titulo"
          placeholder="Título"
          className="w-full p-2 border rounded"
          onChange={handleChange}
        />
        <textarea
          name="descripcion"
          placeholder="Descripción"
          className="w-full p-2 border rounded"
          onChange={handleChange}
        />

        <div className="flex gap-4">
          <div className="flex-1">
            <label>Fecha Inicio</label>
            <input
              type="date"
              name="fechaInicio"
              className="w-full p-2 border rounded"
              onChange={handleChange}
            />
          </div>
          <div className="flex-1">
            <label>Fecha Fin</label>
            <input
              type="date"
              name="fechaFin"
              className="w-full p-2 border rounded"
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label>Duración por bloque</label>
            <select
              name="duracionBloque"
              className="w-full p-2 border rounded"
              onChange={handleChange}
              defaultValue={30}
            >
              <option value={30}>30 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>
          <div className="flex-1">
            <label>Cupo por bloque</label>
            <input
              name="cupoBloque"
              type="number"
              className="w-full p-2 border rounded"
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label>Hora inicio del día</label>
            <input
              type="time"
              name="horaInicioDia"
              defaultValue="08:00"
              className="w-full p-2 border rounded"
              onChange={handleChange}
            />
          </div>
          <div className="flex-1">
            <label>Hora fin del día</label>
            <input
              type="time"
              name="horaFinDia"
              defaultValue="17:00"
              className="w-full p-2 border rounded"
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
          Omitir horario de 12:00 a 14:00
        </label>

        <button
          type="submit"
          disabled={loading}
          className={`px-6 py-2 rounded text-white ${
            loading
              ? 'bg-purple-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading ? 'Creando...' : 'Crear Capacitación'}
        </button>
      </form>
    </div>
  );
};

export default CreateCapacitacion;
