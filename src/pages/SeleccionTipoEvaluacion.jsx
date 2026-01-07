import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase/config';
import { Link, CheckCircle, ArrowRight } from 'lucide-react'; // Iconos para mejorar la UI

const SeleccionTipoEvaluacion = () => {
  const [modo, setModo] = useState(null);
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [seleccionada, setSeleccionada] = useState('');
  const [tituloLibre, setTituloLibre] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCapacitaciones = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'capacitaciones'));
        const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCapacitaciones(lista);
      } catch (error) {
        console.error("Error fetching capacitaciones:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCapacitaciones();
  }, []);

  const handleContinuar = () => {
    if (modo === 'vinculada' && seleccionada) {
      const cap = capacitaciones.find(c => c.id === seleccionada);
      // Navega a la página de creación con el estado necesario
      navigate('/create-quiz', { state: { linkedCapId: cap.id, titulo: cap.titulo } });
    } else if (modo === 'independiente' && tituloLibre.trim()) {
      // Navega a la página de creación con el título libre
      navigate('/create-quiz', { state: { titulo: tituloLibre.trim() } });
    } else {
      // Podríamos usar un toast o un mensaje más elegante en el futuro
      alert('Debes completar la información para continuar.');
    }
  };

  const SelectionCard = ({ value, title, description, children }) => (
    <div
      onClick={() => setModo(value)}
      className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 relative ${ 
        modo === value ? 'border-purple-600 bg-gray-800/50 shadow-lg' : 'border-gray-700 bg-gray-900 hover:border-purple-500/70'
      }`}>
      {modo === value && (
        <CheckCircle size={24} className="absolute top-4 right-4 text-purple-500" />
      )}
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{description}</p>
      {children}
    </div>
  );

  return (
    <div className="p-6 text-white max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Crear Nueva Evaluación</h1>
      <p className="text-gray-400 mb-8">Elige cómo quieres empezar a construir tu quiz.</p>

      <div className="grid md:grid-cols-2 gap-6">
        <SelectionCard
          value="vinculada"
          title="Vincular a Capacitación"
          description="La evaluación usará el mismo nombre y quedará asociada a una capacitación existente."
        >
           {modo === 'vinculada' && (
              <div className="mt-4">
                <label className="block mb-2 text-sm font-semibold text-gray-300">Selecciona una capacitación:</label>
                {loading ? <p className='text-sm text-gray-500'>Cargando...</p> : (
                    <select
                        value={seleccionada}
                        onChange={(e) => setSeleccionada(e.target.value)}
                        className="w-full bg-gray-800 border-gray-600 text-white p-3 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                        <option value="" disabled>-- Elige una capacitación --</option>
                        {capacitaciones.map((c) => (
                        <option key={c.id} value={c.id}>{c.titulo}</option>
                        ))}
                    </select>
                )}
              </div>
            )}
        </SelectionCard>

        <SelectionCard
          value="independiente"
          title="Evaluación Independiente"
          description="Crea un quiz desde cero que no estará asociado a ninguna capacitación."
        >
          {modo === 'independiente' && (
            <div className="mt-4">
              <label className="block mb-2 text-sm font-semibold text-gray-300">Título de la evaluación:</label>
              <input
                type="text"
                value={tituloLibre}
                onChange={(e) => setTituloLibre(e.target.value)}
                className="w-full bg-gray-800 border-gray-600 text-white p-3 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Ej. Conocimiento de Productos 2024"
              />
            </div>
          )}
        </SelectionCard>
      </div>

      {(modo === 'vinculada' && seleccionada) || (modo === 'independiente' && tituloLibre.trim()) ? (
          <div className="mt-8 flex justify-end">
            <button
                onClick={handleContinuar}
                className="bg-purple-600 text-white font-bold px-8 py-3 rounded-lg hover:bg-purple-700 transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-purple-500/20"
            >
                Continuar y Añadir Preguntas
                <ArrowRight size={20} />
            </button>
          </div>
        ) : null}
    </div>
  );
};

export default SeleccionTipoEvaluacion;
