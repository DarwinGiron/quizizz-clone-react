import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import CapacitacionForm from '../components/CapacitacionForm';

const CreateCapacitacion = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        hora_inicio: '',
        hora_fin: '',
        salon: '',
        cupoPorBloque: 10,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const fechaFin = form.fecha_fin || form.fecha_inicio;
        if (!form.fecha_inicio || !form.hora_inicio || !form.hora_fin || !form.salon) {
            alert("Por favor, completa todos los campos de programación.");
            setLoading(false);
            return;
        }

        try {
            const batch = writeBatch(db);
            
            // 1. Crear el documento principal de la capacitación
            const capacitacionRef = doc(collection(db, 'capacitaciones'));
            batch.set(capacitacionRef, {
                ...form,
                fecha_fin: fechaFin,
                createdAt: new Date()
            });

            // 2. Generar los bloques de horarios
            const dias = eachDayOfInterval({ start: parseISO(form.fecha_inicio), end: parseISO(fechaFin) });
            
            // Validación de conflictos (simplificada, idealmente se haría en un backend)
            // Aquí se podría hacer una consulta para verificar si ya existen bloques en esos horarios y salones

            dias.forEach(dia => {
                const nuevoBloqueRef = doc(collection(db, 'capacitacion_bloques'));
                batch.set(nuevoBloqueRef, {
                    capacitacion_id: capacitacionRef.id,
                    fecha: format(dia, 'yyyy-MM-dd'),
                    hora_inicio: form.hora_inicio,
                    hora_fin: form.hora_fin,
                    salon: form.salon,
                    cupo_disponible: Number(form.cupoPorBloque),
                    participantes: [] 
                });
            });

            // 3. Ejecutar todas las operaciones atómicamente
            await batch.commit();
            navigate(`/capacitacion/${capacitacionRef.id}`);

        } catch (error) {
            console.error("Error al crear la capacitación: ", error);
            alert("Hubo un error al crear la capacitación. Revisa la consola para más detalles.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-text-primary mb-5">Crear Nueva Capacitación</h1>
            <CapacitacionForm 
                form={form} 
                setForm={setForm} 
                handleSubmit={handleSubmit} 
                loading={loading} 
                mode='create' 
            />
        </div>
    );
};

export default CreateCapacitacion;
