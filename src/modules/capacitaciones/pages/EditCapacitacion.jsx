import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Pencil, Trash2 } from 'lucide-react';
import { BackButton } from '../../../shared';

const EditCapacitacion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCapacitacion = async () => {
      try {
        const ref = doc(db, 'capacitaciones', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setForm(data);
        } else {
          alert('Capacitación no encontrada');
          navigate('/capacitaciones');
        }
      } catch (error) {
        console.error('Error al cargar capacitación:', error);
        alert('Error al cargar la capacitación');
        navigate('/capacitaciones');
      }
    };
    fetchCapacitacion();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (!form) return; // Protección para evitar errores si form es null
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (loading || !form) return;
    setLoading(true);

    try {
      // Actualizar la capacitación principal
      const ref = doc(db, 'capacitaciones', id);
      await updateDoc(ref, form);

      // Actualizar todos los bloques existentes con el nuevo cupo
      const bloquesRef = collection(db, 'capacitacion_bloques');
      const q = query(bloquesRef, where('capacitacion_id', '==', id));
      const bloquesSnapshot = await getDocs(q);
      
      if (!bloquesSnapshot.empty) {
        const batch = writeBatch(db);
        const nuevoCupo = Number(form.cupo_bloque || form.cupoBloque || 0);

        bloquesSnapshot.docs.forEach((bloqueDoc) => {
          batch.update(bloqueDoc.ref, { cupo_disponible: nuevoCupo });
        });

        await batch.commit();
      }

      alert('Capacitación y bloques actualizados correctamente');
      navigate('/capacitaciones');
    } catch (error) {
      console.error('Error al actualizar:', error);
      alert('Error al actualizar');
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

      alert('Capacitación eliminada');
      navigate('/capacitaciones');
    } catch (error) {
      console.error(error);
      alert('Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  if (!form) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-gray-600">Cargando datos...</p>
      </div>
    );
  }

  const inputClass =
    'w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="max-w-3xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <BackButton to="/capacitaciones" label="Volver a Capacitaciones" className="mb-4" />
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-2.5 rounded-lg">
          <Pencil className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Editar Capacitación</h2>
          <p className="text-sm text-gray-500">
            Los cambios de cupo se aplican a todos los bloques existentes.
          </p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className={labelClass}>Título</label>
          <input
            name="titulo"
            value={form.titulo || ''}
            placeholder="Título"
            className={inputClass}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className={labelClass}>Descripción</label>
          <textarea
            name="descripcion"
            value={form.descripcion || ''}
            placeholder="Descripción"
            rows={3}
            className={inputClass}
            onChange={handleChange}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className={labelClass}>Fecha Inicio</label>
            <input
              type="date"
              name="fecha_inicio"
              value={form.fecha_inicio || ''}
              className={inputClass}
              onChange={handleChange}
            />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Fecha Fin</label>
            <input
              type="date"
              name="fecha_fin"
              value={form.fecha_fin || ''}
              className={inputClass}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className={labelClass}>Duración por bloque</label>
            <select
              name="duracion_bloque"
              value={form.duracion_bloque || ''}
              className={inputClass}
              onChange={handleChange}
            >
              <option value={30}>30 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClass}>Cupo por bloque</label>
            <input
              name="cupo_bloque"
              type="number"
              value={form.cupo_bloque || form.cupoBloque || ''}
              className={inputClass}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className={labelClass}>Hora inicio del día</label>
            <input
              type="time"
              name="hora_inicio_dia"
              value={form.hora_inicio_dia || ''}
              className={inputClass}
              onChange={handleChange}
            />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Hora fin del día</label>
            <input
              type="time"
              name="hora_fin_dia"
              value={form.hora_fin_dia || ''}
              className={inputClass}
              onChange={handleChange}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            name="descanso_medio_dia"
            checked={form.descanso_medio_dia || false}
            onChange={handleChange}
          />
          Omitir horario de 12:00 a 14:00
        </label>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-white font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading && (
              <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-white border border-red-300 text-red-600 px-6 py-3 rounded-lg hover:bg-red-50 transition-colors font-semibold disabled:opacity-60"
          >
            <Trash2 className="w-5 h-5" />
            Eliminar
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCapacitacion;
