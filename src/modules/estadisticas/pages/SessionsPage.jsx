import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { ClipboardList, Trash2, BarChart3, Inbox } from 'lucide-react';

const SessionsPage = () => {
  const { id } = useParams(); // quiz ID
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  // Función para cargar sesiones reales desde Firestore
  const fetchSessions = async () => {
    try {
      const q = query(
        collection(db, 'sessionStats'),
        where('quizId', '==', id)
      );
      const querySnapshot = await getDocs(q);
      const sessionsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessionsData.push({
          id: doc.id,
          sessionId: data.sessionId,
          title: `Sesión ${new Date(data.finishedAt).toLocaleDateString('es-ES')}`,
          date: new Date(data.finishedAt).toLocaleDateString('es-ES'),
          precision: data.summary?.totalPrecision || 0,
          participants: data.summary?.totalParticipants || 0,
          averageScore: data.summary?.averageScore || 0,
          finishedAt: data.finishedAt,
          startedAt: data.startedAt,
          joinCode: data.joinCode
        });
      });
      
      // Ordenar por fecha más reciente
      sessionsData.sort((a, b) => b.finishedAt - a.finishedAt);
      setSessions(sessionsData);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar sesión
  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteDoc(doc(db, 'sessionStats', sessionId));
      // Actualizar la lista de sesiones
      await fetchSessions();
      setShowDeleteModal(false);
      setSessionToDelete(null);
    } catch (error) {
      console.error('Error deleting session:', error);
      alert('Error al eliminar la sesión. Inténtalo de nuevo.');
    }
  };

  useEffect(() => {
    const fetchQuiz = async () => {
      const docRef = doc(db, 'quizzes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setQuiz({ id: docSnap.id, ...docSnap.data() });
      }
    };

    fetchQuiz();
    fetchSessions();
  }, [id]);

  if (!quiz) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-gray-600">Cargando sesiones...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-100 p-2.5 rounded-lg">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Sesiones de: {quiz.title}</h2>
          <p className="text-sm text-gray-500">Historial de sesiones finalizadas y sus estadísticas.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3" />
          <p className="text-gray-600">Cargando sesiones...</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg">No hay sesiones registradas para esta capacitación.</p>
          <p className="text-gray-400 text-sm mt-2">Las sesiones aparecerán aquí una vez que se completen.</p>
        </div>
      ) : (
        sessions.map((session) => (
          <div
            key={session.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <span className="inline-block text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full mb-1">
                  Finalizada
                </span>
                <h3 className="font-semibold text-lg">{session.title}</h3>
                <p className="text-sm text-gray-500">
                  {session.precision.toFixed(1)}% precisión • {session.participants} participantes • {session.averageScore.toFixed(1)} puntaje promedio
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Código: {session.joinCode} • Duración: {((session.finishedAt - session.startedAt) / 60000).toFixed(0)} min
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/sessions/${session.sessionId}/report`)}
                  className="text-sm bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-shadow flex items-center gap-2 font-medium"
                >
                  <ClipboardList className="w-4 h-4" /> Ver informe
                </button>
                <button
                  onClick={() => {
                    setSessionToDelete(session);
                    setShowDeleteModal(true);
                  }}
                  className="text-sm bg-white border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2 font-medium"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">¿Eliminar sesión?</h3>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que quieres eliminar la sesión "{sessionToDelete.title}"? 
              Esta acción no se puede deshacer y se perderán todas las estadísticas.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSessionToDelete(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteSession(sessionToDelete.id)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionsPage;
