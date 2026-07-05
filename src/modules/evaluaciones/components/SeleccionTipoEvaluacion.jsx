import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase/config';
import { BackButton } from '../../../shared';

const SeleccionTipoEvaluacion = () => {
  const [modo, setModo] = useState(null);
  const [capacitaciones, setCapacitaciones] = useState([]);
  const [seleccionada, setSeleccionada] = useState('');
  const [tituloLibre, setTituloLibre] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCapacitaciones = async () => {
      const snap = await getDocs(collection(db, 'capacitaciones'));
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCapacitaciones(lista);
    };
    fetchCapacitaciones();
  }, []);

  const handleContinuar = () => {
    if (modo === 'vinculada' && seleccionada) {
      const cap = capacitaciones.find(c => c.id === seleccionada);
      navigate('/create', { state: { linkedCapId: cap.id, titulo: cap.titulo } });
    } else if (modo === 'independiente' && tituloLibre.trim()) {
      navigate('/create', { state: { titulo: tituloLibre.trim() } });
    } else {
      alert('Debes completar la información para continuar.');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <BackButton to="/myquizzes" label="Volver a Mis Quizzes" className="mb-6" />
      <h1 className="text-2xl font-bold mb-4">¿Cómo deseas crear esta evaluación?</h1>

      <div className="space-y-4">
        <div
          onClick={() => setModo('vinculada')}
          className={`border rounded p-4 cursor-pointer hover:bg-indigo-50 ${
            modo === 'vinculada' ? 'border-indigo-600 bg-indigo-50' : ''
          }`}
        >
          <strong>Vincular a capacitación existente</strong>
          <p className="text-sm text-gray-600">Usará el mismo nombre y quedará asociada.</p>
        </div>

        <div
          onClick={() => setModo('independiente')}
          className={`border rounded p-4 cursor-pointer hover:bg-indigo-50 ${
            modo === 'independiente' ? 'border-indigo-600 bg-indigo-50' : ''
          }`}
        >
          <strong>Evaluación independiente</strong>
          <p className="text-sm text-gray-600">No se asociará a ninguna capacitación.</p>
        </div>
      </div>

      {modo === 'vinculada' && (
        <div className="mt-6">
          <label className="block mb-1">Selecciona una capacitación:</label>
          <select
            value={seleccionada}
            onChange={(e) => setSeleccionada(e.target.value)}
            className="w-full border p-2 rounded"
          >
            <option value="">-- Elige una --</option>
            {capacitaciones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
        </div>
      )}

      {modo === 'independiente' && (
        <div className="mt-6">
          <label className="block mb-1">Título de la evaluación:</label>
          <input
            type="text"
            value={tituloLibre}
            onChange={(e) => setTituloLibre(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="Ej. Evaluación de ergonomía"
          />
        </div>
      )}

      <button
        onClick={handleContinuar}
        className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition-shadow font-semibold"
      >
        Continuar
      </button>
    </div>
  );
};

export default SeleccionTipoEvaluacion;
