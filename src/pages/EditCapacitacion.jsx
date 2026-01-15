import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import CapacitacionForm from '../components/CapacitacionForm';

const EditCapacitacion = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [originalData, setOriginalData] = useState(null);
    const [form, setForm] = useState({
        titulo: '', descripcion: '', salon: '',
        fecha_inicio: '', fecha_fin: '', hora_inicio: '', hora_fin: '', cupoPorBloque: 10
    });

    const fetchCapacitacion = useCallback(async () => {
        setLoading(true);
        const docRef = doc(db, 'capacitaciones', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            setForm(data);
            setOriginalData(data);
        } else {
            alert("No se encontró la capacitación.");
            navigate('/capacitaciones');
        }
        setLoading(false);
    }, [id, navigate]);

    useEffect(() => {
        fetchCapacitacion();
    }, [fetchCapacitacion]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!originalData) return; // Evitar ejecución si los datos originales no se han cargado
        setLoading(true);

        const fechaFin = form.fecha_fin || form.fecha_inicio;

        try {
            const batch = writeBatch(db);

            // Verificar si la programación o el cupo han cambiado para regenerar bloques
            const programacionCambiada = 
                originalData.fecha_inicio !== form.fecha_inicio ||
                (originalData.fecha_fin || originalData.fecha_inicio) !== fechaFin ||
                originalData.hora_inicio !== form.hora_inicio ||
                originalData.hora_fin !== form.hora_fin ||
                originalData.salon !== form.salon ||
                Number(originalData.cupoPorBloque) !== Number(form.cupoPorBloque);

            if (programacionCambiada) {
                // 1. Borrar bloques antiguos asociados a esta capacitación
                const bloquesQuery = query(collection(db, 'capacitacion_bloques'), where('capacitacion_id', '==', id));
                const bloquesSnap = await getDocs(bloquesQuery);
                bloquesSnap.forEach(doc => batch.delete(doc.ref));

                // 2. Generar y validar nuevos bloques con la información actualizada
                const dias = eachDayOfInterval({ start: parseISO(form.fecha_inicio), end: parseISO(fechaFin) });
                dias.forEach(dia => {
                    const nuevoBloqueRef = doc(collection(db, 'capacitacion_bloques'));
                    batch.set(nuevoBloqueRef, { 
                        capacitacion_id: id, 
                        fecha: format(dia, 'yyyy-MM-dd'),
                        hora_inicio: form.hora_inicio,
                        hora_fin: form.hora_fin,
                        salon: form.salon,
                        cupo_disponible: Number(form.cupoPorBloque), 
                        participantes: [] 
                    });
                });
            }

            // 3. Actualizar el documento principal de la capacitación
            const capacitacionRef = doc(db, 'capacitaciones', id);
            batch.update(capacitacionRef, { ...form, fecha_fin: fechaFin });

            // 4. Ejecutar todas las operaciones en la base de datos
            await batch.commit();
            navigate(`/capacitacion/${id}`);

        } catch (error) {
            console.error("Error al actualizar la capacitación: ", error);
            alert("Hubo un error al actualizar. Revisa la consola.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm("¿Estás seguro? Se borrará la capacitación y todos sus horarios.")) return;
        setLoading(true);
        try {
            const batch = writeBatch(db);
            const bloquesQuery = query(collection(db, 'capacitacion_bloques'), where('capacitacion_id', '==', id));
            const bloquesSnap = await getDocs(bloquesQuery);
            bloquesSnap.forEach(doc => batch.delete(doc.ref));
            const capacitacionRef = doc(db, 'capacitaciones', id);
            batch.delete(capacitacionRef);
            await batch.commit();
            navigate('/capacitaciones');
        } catch (error) {
            console.error("Error al eliminar: ", error);
        } finally {
            setLoading(false);
        }
    };

    if (!form.titulo) return <p className="p-6 text-center">Cargando...</p>;

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-text-primary mb-5">Editar Capacitación</h1>
            <CapacitacionForm 
                form={form} 
                setForm={setForm} 
                handleSubmit={handleSubmit} 
                handleDelete={handleDelete}
                loading={loading} 
                mode='edit' 
            />
        </div>
    );
};

export default EditCapacitacion;
