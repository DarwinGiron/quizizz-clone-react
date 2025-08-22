import React from 'react';
import { useParams } from 'react-router-dom';

const EstadisticasTotales = () => {
  const { sessionId } = useParams();
  // Aquí puedes cargar y mostrar las estadísticas totales de la sesión
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4 flex flex-col items-center justify-center">
      <div className="max-w-3xl w-full bg-white bg-opacity-10 rounded-2xl shadow-2xl p-8 mt-8">
        <h1 className="text-3xl font-extrabold text-purple-200 mb-6 text-center">Estadísticas Totales de la Sesión</h1>
        <p className="text-lg text-purple-100 text-center">Sesión ID: {sessionId}</p>
        {/* Aquí puedes renderizar el resumen global, ranking, gráficos, etc. */}
        <div className="mt-8 text-center text-purple-300">(Aquí irá el resumen global de la sesión)</div>
      </div>
    </div>
  );
};

export default EstadisticasTotales;
