import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Clock, Users, ArrowRight } from 'lucide-react';

const Asignaciones = () => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCapacitaciones = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, 'capacitaciones'));
        const fetchedCapacitaciones = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCapacitaciones(fetchedCapacitaciones);
      } catch (error) {
        console.error("Error al obtener las capacitaciones: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCapacitaciones();
  }, []);

  // Navega a la página de asignación detallada para una capacitación específica
  const handleAssignClick = (capacitacionId) => {
    navigate(`/asignaciones/detalle/${capacitacionId}`);
  };

  const CapacitacionCard = ({ cap }) => (
    <div className="bg-secondary p-5 rounded-xl border border-border-secondary shadow-sm transition-all hover:border-border hover:shadow-md">
      <h3 className="text-lg font-bold text-text-primary truncate mb-2">{cap.titulo}</h3>
      <p className="text-sm text-text-muted mb-4 h-10 overflow-hidden">{cap.descripcion}</p>
      <div className="flex items-center text-xs text-text-muted gap-4 mb-4">
          <div className="flex items-center gap-1.5">
              <Briefcase size={14} />
              <span>{cap.ponente}</span>
          </div>
          <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>{cap.duracion}</span>
          </div>
      </div>
      <button 
        onClick={() => handleAssignClick(cap.id)}
        className="w-full flex justify-center items-center gap-2 bg-accent text-accent-text font-semibold py-2 px-4 rounded-lg hover:bg-accent-strong transition-colors">
        <span>Asignar Participantes</span>
        <ArrowRight size={18} />
      </button>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Panel de Asignaciones</h1>
        {/* Podríamos agregar un botón para crear capacitaciones si es rol admin */}
      </div>

      {loading ? (
        <p className="text-center text-text-muted">Cargando capacitaciones...</p>
      ) : capacitaciones.length === 0 ? (
        <div className="text-center py-16 px-8 bg-secondary rounded-xl border border-dashed border-border">
            <h3 className="text-xl font-semibold text-text-primary">No hay capacitaciones creadas</h3>
            <p className="text-text-muted mt-2">Crea una nueva capacitación para poder asignar participantes.</p>
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

export default Asignaciones;
