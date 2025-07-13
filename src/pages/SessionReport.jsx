import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChartPie, FaUserFriends, FaDownload, FaFilePdf, FaArrowLeft } from 'react-icons/fa';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const SessionReport = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState('participants');
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    try {
      setLoading(true);
      console.log('[DEBUG] Cargando datos de sesión:', sessionId);
      
      // Buscar en Firestore la sesión terminada en la colección 'sessionStats'
      const sessionsRef = collection(db, 'sessionStats');
      const q = query(sessionsRef, where('sessionId', '==', sessionId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('[DEBUG] No se encontró la sesión en Firestore, intentando búsqueda directa');
        // Intentar búsqueda directa por documento ID
        try {
          const docRef = doc(db, 'sessionStats', sessionId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('[DEBUG] Datos de sesión encontrados por ID:', data);
            processSessionData(data);
            return;
          }
        } catch (error) {
          console.log('[DEBUG] Error en búsqueda directa:', error);
        }
        
        console.log('[DEBUG] No se encontró la sesión en ninguna búsqueda');
        setSessionData(null);
        return;
      }

      const sessionDoc = querySnapshot.docs[0];
      const data = sessionDoc.data();
      console.log('[DEBUG] Datos de sesión encontrados:', data);
      processSessionData(data);

    } catch (error) {
      console.error('[ERROR] Error cargando datos de sesión:', error);
      setSessionData(null);
    } finally {
      setLoading(false);
    }
  };

  const processSessionData = (data) => {
    // Calcular estadísticas desde los datos guardados
    const participants = data.participants || [];
    const responses = data.responses || [];
    const questions = data.questions || [];

    // Calcular ranking y estadísticas por participante
    const ranking = participants.map(participant => {
      const participantResponses = responses.filter(r => r.participant === participant.name);
      const correctAnswers = participantResponses.filter(r => r.isCorrect).length;
      const totalAnswers = participantResponses.length;
      const precision = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
      const score = correctAnswers * 1000; // Base score

      return {
        id: participant.name,
        name: participant.name,
        personnelCode: participant.personnelCode,
        precision: Math.round(precision),
        score,
        correctAnswers,
        totalAnswers
      };
    });

    // Estadísticas generales
    const totalParticipants = participants.length;
    const averagePrecision = totalParticipants > 0 
      ? Math.round(ranking.reduce((acc, p) => acc + p.precision, 0) / totalParticipants)
      : 0;
    
    const completionRate = totalParticipants > 0 && questions.length > 0
      ? Math.round((ranking.filter(p => p.totalAnswers === questions.length).length / totalParticipants) * 100)
      : 0;

    setSessionData({
      title: data.quizTitle || 'Quiz sin título',
      date: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      }) : 'Fecha desconocida',
      precision: averagePrecision,
      completion: completionRate,
      participants: totalParticipants,
      questions: questions.length,
      users: ranking.sort((a, b) => b.score - a.score)
    });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded shadow p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded shadow p-6 text-center">
          <h2 className="text-xl font-bold text-gray-600 mb-2">Sesión no encontrada</h2>
          <p className="text-gray-500">No se pudieron cargar los datos de esta sesión.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Botón de volver */}
      <button
        onClick={() => navigate('/my-quizzes?tab=sessions')}
        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4 transition-colors"
      >
        <FaArrowLeft />
        <span>Volver a Mis Quizzes</span>
      </button>

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
                <th className="py-2">Participante</th>
                <th className="py-2 text-center">Precisión</th>
                <th className="py-2 text-center">Puntos</th>
                <th className="py-2 text-center">Puntuación</th>
              </tr>
            </thead>
            <tbody>
              {sessionData.users.map((user, index) => {
                const displayName = user.personnelCode && user.personnelCode !== user.name 
                  ? `${user.personnelCode} - ${user.name}`
                  : user.name;
                
                return (
                  <tr key={`${user.id}-${index}`} className="border-b hover:bg-gray-50">
                    <td className="py-2 flex items-center gap-2 font-medium">
                      <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-xs">
                        {user.personnelCode ? user.personnelCode.charAt(0) : user.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold">{displayName}</span>
                        {user.personnelCode && user.personnelCode !== user.name && (
                          <span className="text-xs text-gray-500">Código: {user.personnelCode}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 text-center text-green-600 font-semibold">{user.precision}%</td>
                    <td className="py-2 text-center">{user.correctAnswers}/{sessionData.questions}</td>
                    <td className="py-2 text-center">{user.score}</td>
                  </tr>
                );
              })}
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
