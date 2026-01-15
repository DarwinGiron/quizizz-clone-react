import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import CapacitacionForm from '../components/CapacitacionForm';
import { Edit } from 'lucide-react';

const CapacitacionDetallePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [capacitacion, setCapacitacion] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCapacitacion = async () => {
            setLoading(true);
            try {
                const docRef = doc(db, 'capacitaciones', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setCapacitacion({ id: docSnap.id, ...docSnap.data() });
                } else {
                    alert("No se encontró la capacitación.");
                    navigate('/capacitaciones');
                }
            } catch (error) {
                console.error("Error al obtener la capacitación: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCapacitacion();
    }, [id, navigate]);

    if (loading || !capacitacion) {
        return <p className="p-6 text-center text-text-muted">Cargando detalles...</p>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-2xl font-bold text-text-primary">Detalles de la Capacitación</h1>
                <button 
                    onClick={() => navigate(`/editar-capacitacion/${id}`)}
                    className="flex items-center gap-2 bg-accent text-accent-text font-semibold py-2 px-4 rounded-lg hover:bg-accent-strong transition-colors text-sm">
                    <Edit size={16}/>
                    Editar
                </button>
            </div>
            <CapacitacionForm 
                form={capacitacion} 
                mode='view' 
            />
        </div>
    );
};

export default CapacitacionDetallePage;
