import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Plus, MapPin, Calendar } from 'lucide-react';

const CapacitacionesDashboard = () => {
    const navigate = useNavigate();
    const [capacitaciones, setCapacitaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCapacitaciones = async () => {
            setLoading(true);
            try {
                const snapshot = await getDocs(collection(db, 'capacitaciones'));
                const fetchedCapacitaciones = snapshot.docs
                    .map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setCapacitaciones(fetchedCapacitaciones);
            } catch (error) {
                console.error("Error al obtener las capacitaciones: ", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCapacitaciones();
    }, []);

    const CapacitacionCard = ({ cap }) => (
        <div 
            onClick={() => navigate(`/capacitacion/${cap.id}`)}
            className="bg-secondary rounded-xl border border-border-secondary shadow-sm transition-all p-4 cursor-pointer hover:bg-hover hover:border-accent"
        >
            <h3 className="text-md font-bold text-text-primary truncate mb-2">{cap.titulo}</h3>
            <p className="text-xs text-text-muted mb-3 h-9 overflow-hidden">{cap.descripcion || "Sin descripción."}</p>
            <div className="flex flex-col gap-1.5 text-xs text-text-muted pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                    <MapPin size={12} />
                    <span>{cap.salon}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar size={12} />
                    <span>{cap.fecha_inicio} al {cap.fecha_fin || cap.fecha_inicio}</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-text-primary">Gestor de Capacitaciones</h1>
                <button 
                    onClick={() => navigate('/crear-capacitacion')} 
                    className="flex items-center gap-2 bg-accent-strong text-accent-text font-bold py-2 px-4 rounded-lg hover:bg-accent transition-colors shadow-lg shadow-accent/20 text-sm">
                    <Plus size={18}/>
                    Crear
                </button>
            </div>
            
            {loading ? (
                <p className="text-center text-text-muted">Cargando...</p>
            ) : capacitaciones.length === 0 ? (
                <div className="text-center py-12 px-6 bg-secondary rounded-xl border border-dashed border-border">
                    <h3 className="text-lg font-semibold text-text-primary">No hay capacitaciones</h3>
                    <p className="text-text-muted mt-2 text-sm">Usa el botón "Crear" para añadir la primera.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {capacitaciones.map(cap => (
                        <CapacitacionCard key={cap.id} cap={cap} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CapacitacionesDashboard;
