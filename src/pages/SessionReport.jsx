import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaChartPie, FaUserFriends, FaDownload, FaFilePdf } from 'react-icons/fa';

const SessionReport = () => {
  const { sessionId } = useParams();
  const [tab, setTab] = useState('participants');

  // Simulación de datos de sesión
  const sessionData = {
    title: 'Higiene Personal e Instalaciones Gestión de alergenos',
    date: '13 jun',
    precision: 96,
    completion: 100,
    participants: 12,
    questions: 10,
    users: [
      { id: 1, name: '1044', precision: 100, score: 10410 },
      { id: 2, name: '1176', precision: 100, score: 9205 },
      { id: 3, name: '1774', precision: 100, score: 10620 },
      { id: 4, name: '1840', precision: 100, score: 8920 },
    ],
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Resumen general */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">En vivo quiz</span>
        <h2 className="text-xl font-bold mt-2">{sessionData.title}</h2>
        <p className="text-sm text-gray-500 mb-4">📅 {sessionData.date}</p>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4 text-center">
          <div>
            <p className="text-sm text-gray-500">Precisión</p>
            <p className="text-lg font-semibold">{sessionData.precision}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Terminación</p>
            <p className="text-lg font-semibold">{sessionData.completion}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Participantes</p>
            <p className="text-lg font-semibold">{sessionData.participants}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Preguntas</p>
            <p className="text-lg font-semibold">{sessionData.questions}</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 bg-white border px-4 py-2 rounded shadow-sm text-sm hover:bg-gray-50">
            <FaDownload /> Descargar resultados
          </button>
          <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            <FaFilePdf /> Generar PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-4 text-sm font-medium">
        <button
          className={`pb-2 ${tab === 'participants' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
          onClick={() => setTab('participants')}
        >
          Participantes
        </button>
        <button
          className={`pb-2 ${tab === 'questions' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
          onClick={() => setTab('questions')}
        >
          Preguntas
        </button>
        <button
          className={`pb-2 ${tab === 'summary' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
          onClick={() => setTab('summary')}
        >
          Resumen
        </button>
        <button
          className={`pb-2 ${tab === 'comments' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}
          onClick={() => setTab('comments')}
        >
          Comentario
        </button>
      </div>

      {/* Contenido por pestaña */}
      {tab === 'participants' && (
        <div className="overflow-x-auto bg-white rounded shadow p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Nombre</th>
                <th className="py-2 text-center">Precisión</th>
                <th className="py-2 text-center">Puntos</th>
                <th className="py-2 text-center">Puntuación</th>
              </tr>
            </thead>
            <tbody>
              {sessionData.users.map((user) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 flex items-center gap-2 font-medium">
                    <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-white font-bold">
                      {user.name.charAt(0)}
                    </div>
                    {user.name}
                  </td>
                  <td className="py-2 text-center text-green-600 font-semibold">{user.precision}%</td>
                  <td className="py-2 text-center">10/10</td>
                  <td className="py-2 text-center">{user.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'questions' && (
        <div className="bg-white rounded shadow p-4">
          <p className="text-gray-500">Aquí se mostrarán los resultados por pregunta (en desarrollo).</p>
        </div>
      )}

      {tab === 'summary' && (
        <div className="bg-white rounded shadow p-4">
          <p className="text-gray-500">Resumen general del rendimiento de la sesión (en desarrollo).</p>
        </div>
      )}

      {tab === 'comments' && (
        <div className="bg-white rounded shadow p-4">
          <p className="text-gray-500">Sección de comentarios o retroalimentación (en desarrollo).</p>
        </div>
      )}
    </div>
  );
};

export default SessionReport;
