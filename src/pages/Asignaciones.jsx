import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const Asignaciones = () => {
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCapacitaciones = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, 'capacitaciones'));
        const caps = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCapacitaciones(caps);
      } catch (error) {
        console.error("Error al obtener capacitaciones: ", error);
      }
      setLoading(false);
    };
    fetchCapacitaciones();
  }, []);

  // --- CORRECCIÓN ---
  // Se añade una guarda (|| '') para evitar el crash si una capacitación no tiene nombre.
  const filteredCapacitaciones = capacitaciones.filter(c =>
    (c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 text-text-primary">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Asignación de Capacitaciones</h1>
      </div>

      <div className="bg-secondary p-6 rounded-xl border border-border">
        <div className="flex justify-between mb-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={20}/>
            <input
              type="text"
              placeholder="Buscar capacitación por nombre..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-primary border text-text-primary border-border focus:ring-2 focus:ring-accent focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-10 text-text-muted">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-secondary">
                  <th className="p-4 text-sm font-semibold text-text-muted uppercase">Nombre Capacitación</th>
                  <th className="p-4 text-sm font-semibold text-text-muted uppercase">Descripción</th>
                  <th className="p-4 text-sm font-semibold text-text-muted uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCapacitaciones.map(cap => (
                  <tr key={cap.id} className="border-b border-border last:border-0 hover:bg-hover">
                    <td className="p-4 font-medium text-text-primary">{cap.nombre || 'Sin nombre'}</td>
                    <td className="p-4 text-text-secondary max-w-sm truncate">{cap.descripcion}</td>
                    <td className="p-4">
                      <Link 
                        to={`/asignaciones/avanzada/${cap.id}`}
                        className="bg-accent text-accent-text font-bold py-2 px-4 rounded-lg hover:bg-accent-strong transition-colors text-sm"
                      >
                        Gestionar Asignación
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredCapacitaciones.length === 0 && !loading && (
          <div className="text-center py-10 text-text-muted">
            <p>No se encontraron capacitaciones que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Asignaciones;
