import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';

const EditCapacitacion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCapacitacion = async () => {
      const ref = doc(db, 'capacitaciones', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setForm(snap.data());
      } else {
        alert('Capacitación no encontrada');
        navigate('/capacitaciones');
      }
    };
    fetchCapacitacion();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (loading || !form) return;
    setLoading(true);

    try {
      const ref = doc(db, 'capacitaciones', id);
      await updateDoc(ref, form);
      alert('✅ Capacitación actualizada correctamente');
      navigate('/capacitaciones');
    } catch (error) {
      console.error(error);
      alert('❌ Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta capacitación y todos sus bloques?')) return;

    setLoading(true);
    try {
      // Eliminar bloques asociados
      const bloquesRef = collection(db, 'capacitacion_bloques');
      const q = query(bloquesRef, where('capacitacion_id', '==', id));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map((docu) => deleteDoc(docu.ref));
      await Promise.all(deletePromises);

      // Eliminar capacitación
      await deleteDoc(doc(db, 'capacitaciones', id));

      alert('🗑️ Capacitación eliminada');
      navigate('/capacitaciones');
    } catch (error) {
      console.error(error);
      alert('❌ Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  if (!form) return <div className="p-6">Cargando datos...</div>;

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-4">Editar Capacitación</h2>
      <form onSubmit={handleUpdate} className="space-y-4">
        <input
          name="titulo"
          value={form.titulo}
          placeholder="Título"
          className="w-full p-2 border rounded"
          onChange={handleChange}
        />
        <textarea
          name="descripcion"
          value={form.descripcion}
          placeholder="Descripción"
          className="w-full p-2 border rounded"
          onChange={handleChange}
        />

        <div className="flex gap-4">
          <div className="flex-1">
            <label>Fecha Inicio</label>
            <input
              type="date"
              name="fecha_inicio"
              value={form.fecha_inicio}
              className="w-full p-2 border rounded"
              onChange={handleChange}
            />
          </div>
          <div className="flex-1">
            <label>Fecha Fin</label>
            <input
              type="date"
              name="fecha_fin"
              value={form.fecha_fin}
              className="w-full p-2 border rounded"
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label>Duración por bloque</label>
            <select
              name="duracion_bloque"
              value={form.duracion_bloque}
              className="w-full p-2 border rounded"
              onChange={handleChange}
            >
              <option value={30}>30 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>
          <div className="flex-1">
            <label>Cupo por bloque</label>
            <input
              name="cupo_bloque"
              type="number"
              value={form.cupo_bloque}
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
              name="hora_inicio_dia"
              value={form.hora_inicio_dia}
              className="w-full p-2 border rounded"
              onChange={handleChange}
            />
          </div>
          <div className="flex-1">
            <label>Hora fin del día</label>
            <input
              type="time"
              name="hora_fin_dia"
              value={form.hora_fin_dia}
              className="w-full p-2 border rounded"
              onChange={handleChange}
            />
          </div>
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            name="descanso_medio_dia"
            checked={form.descanso_medio_dia}
            onChange={handleChange}
          />
          Omitir horario de 12:00 a 14:00
        </label>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2 rounded text-white ${
              loading
                ? 'bg-purple-400 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            }`}
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
          >
            Eliminar Capacitación
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCapacitacion;
