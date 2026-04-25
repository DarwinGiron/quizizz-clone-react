import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { FiEye, FiEdit, FiTarget, FiEyeOff } from 'react-icons/fi';
import { FaGamepad, FaTrash } from 'react-icons/fa';
import { StartLiveSessionButton } from '../components';
import { ExportStatsModal } from '../../estadisticas';
import { BackButton } from '../../../shared';

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [showAnswers, setShowAnswers] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  const [showExportModal, setShowExportModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);

  // Función para cargar sesiones reales desde Firestore
  const fetchSessions = async () => {
    setLoadingSessions(true);
    console.log('[DEBUG] Buscando sesiones para quizId:', id);
    try {
      const q = query(
        collection(db, 'sessionStats'),
        where('quizId', '==', id)
      );
      console.log('[DEBUG] Query creada para sessionStats');
      const querySnapshot = await getDocs(q);
      console.log('[DEBUG] Documentos encontrados:', querySnapshot.size);
      const sessionsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('[DEBUG] Documento encontrado:', doc.id, data);
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
      
      console.log('[DEBUG] Sesiones procesadas:', sessionsData);
      // Ordenar por fecha más reciente
      sessionsData.sort((a, b) => b.finishedAt - a.finishedAt);
      setSessions(sessionsData);
    } catch (error) {
      console.error('[ERROR] Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
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
  }, [id]);

  // Detectar parámetro de URL para cambiar pestaña automáticamente
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['questions', 'sessions', 'comments'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  // Cargar sesiones cuando se cambia a la pestaña de sesiones
  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchSessions();
    }
  }, [activeTab, id]);

  const handleExportPDF = () => {
    console.log('Exportar PDF...');
    setShowExportModal(false);
  };

  const handleExportExcel = () => {
    console.log('Exportar Excel...');
    setShowExportModal(false);
  };
if (!quiz) return <p className="text-center mt-10">Cargando...</p>;

const sessionData = {
  title: quiz.title || 'Estadísticas del Quiz',
  date: new Date().toLocaleDateString(),
  users: [
    { name: '1044', precision: 100, score: 10410 },
    { name: '1176', precision: 100, score: 9205 },
    { name: '1774', precision: 100, score: 10620 },
    { name: '1840', precision: 100, score: 8920 },
  ]
};

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Botón de volver */}
      <BackButton to="/myquizzes" label="Volver a Mis Quizzes" className="mb-4" />
      
      {/* Encabezado */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{quiz.title}</h2>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1"><FiTarget /> 0% precisión</span>
              <span className="flex items-center gap-1"><FaGamepad /> 0 jugadas</span>
            </p>
          </div>
          <div className="space-x-2 flex items-center">
            <button
              onClick={() => navigate(`/preview/${id}`)}
              className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              <FiEye /> Vista previa
            </button>
            <button
              onClick={() => navigate(`/edit/${id}`)}
              className="flex items-center gap-1 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
            >
              <FiEdit /> Continuar editando
            </button>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <StartLiveSessionButton quizId={quiz.id} />
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          >
            📥 Exportar estadísticas
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-2 border-b flex gap-6 text-purple-600 font-semibold">
        <button
          className={`pb-2 ${activeTab === 'questions' ? 'border-b-2 border-purple-600' : 'text-gray-400'}`}
          onClick={() => setActiveTab('questions')}
        >
          Preguntas ({quiz.questions?.length || 0})
        </button>
        <button
          className={`pb-2 ${activeTab === 'sessions' ? 'border-b-2 border-purple-600' : 'text-gray-400'}`}
          onClick={() => setActiveTab('sessions')}
        >
          Sesiones {sessions.length > 0 && `(${sessions.length})`}
        </button>
        <button
          className={`pb-2 ${activeTab === 'comments' ? 'border-b-2 border-purple-600' : 'text-gray-400'}`}
          onClick={() => setActiveTab('comments')}
        >
          Comentario
        </button>
      </div>

      {/* Botón ocultar respuestas */}
      {activeTab === 'questions' && (
        <div className="flex justify-end sticky top-[112px] z-30 bg-[#f9fafb] py-2">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="flex items-center gap-2 bg-white border px-3 py-2 rounded-full text-sm text-purple-600 shadow hover:bg-gray-50 transition-all"
          >
            {showAnswers ? <FiEyeOff /> : <FiEye />}
            {showAnswers ? 'Ocultar respuestas' : 'Mostrar respuestas'}
          </button>
        </div>
      )}

      {/* Contenido dinámico */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {quiz.questions?.map((q, i) => (
            <div key={i} className="bg-white shadow rounded p-4">
              <div className="text-sm text-gray-600 mb-1">
                {i + 1}. Opción múltiple • ⏱ 30 segundos • 🏅 1 punto
              </div>
              <p className="font-semibold">{q.question}</p>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {q.options.map((opt, idx) => {
                  const isCorrect = idx === q.correctAnswer;
                  let style = 'bg-gray-100 border border-gray-300 text-gray-800';
                  if (showAnswers) {
                    style = isCorrect
                      ? 'bg-green-100 border-green-400 text-green-700'
                      : 'bg-red-100 border-red-400 text-red-700';
                  }
                  return (
                    <li key={idx} className={`px-3 py-2 rounded ${style}`}>
                      {opt}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="space-y-4 mt-4">
          {/* Botón para recargar sesiones manualmente */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Sesiones realizadas</h3>
            <button
              onClick={fetchSessions}
              disabled={loadingSessions}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm disabled:opacity-50"
            >
              {loadingSessions ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
          
          {loadingSessions ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Cargando sesiones...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-gray-500 text-lg">No hay sesiones registradas para esta capacitación.</p>
              <p className="text-gray-400 text-sm mt-2">Las sesiones aparecerán aquí una vez que se completen.</p>
              <p className="text-blue-600 text-xs mt-2">Quiz ID actual: {id}</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white p-4 rounded shadow flex justify-between items-center hover:bg-gray-50 transition"
              >
                <div className="flex-1">
                  <h4 className="font-semibold">{session.title}</h4>
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
                    className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-sm"
                  >
                    Ver informe
                  </button>
                  <button
                    onClick={() => {
                      setSessionToDelete(session);
                      setShowDeleteModal(true);
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-sm flex items-center gap-1"
                  >
                    <FaTrash size={12} /> Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="bg-white p-4 rounded shadow text-gray-500">Sección de comentarios próximamente...</div>
      )}

      {showExportModal && (
        <ExportStatsModal
          onClose={() => setShowExportModal(false)}
          sessionData={sessionData}
        />
      )}

      {/* Modal de confirmación para eliminar sesión */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl w-full max-w-md mx-4">
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

export default QuizDetails;
