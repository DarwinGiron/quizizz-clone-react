import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { ref as dbRef, get as dbGet } from 'firebase/database';
import { db, rtdb } from '../../../firebase/config';
import { Eye, Pencil, Target, EyeOff, Gamepad2, Trash2, MessageSquare, FileSpreadsheet, LogIn } from 'lucide-react';
import { StartLiveSessionButton } from '../components';
import { processSessionData, fetchSessionFeedback, endLiveSession } from '../../estadisticas';
import { exportAllSessionsToExcel } from '../../estadisticas/utils/exportReport';
import { BackButton, useToast } from '../../../shared';

const QuizDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [quiz, setQuiz] = useState(null);
  const [showAnswers, setShowAnswers] = useState(true);
  const [activeTab, setActiveTab] = useState('questions');
  const [sessions, setSessions] = useState([]);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [exportingAll, setExportingAll] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionToEnd, setSessionToEnd] = useState(null);
  const [endingSession, setEndingSession] = useState(false);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const q = query(collection(db, 'sessionStats'), where('quizId', '==', id));
      const querySnapshot = await getDocs(q);
      const sessionsData = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sessionsData.push({
          id: doc.id,
          sessionId: data.sessionId,
          title: `Sesión ${new Date(data.finishedAt).toLocaleDateString('es-ES')}`,
          date: new Date(data.finishedAt).toLocaleDateString('es-ES'),
          precision: Number(data.summary?.totalPrecision) || 0,
          participants: Number(data.summary?.totalParticipants) || 0,
          averageScore: Number(data.summary?.averageScore) || 0,
          finishedAt: data.finishedAt,
          startedAt: data.startedAt,
          joinCode: data.joinCode,
        });
      });

      sessionsData.sort((a, b) => b.finishedAt - a.finishedAt);
      setSessions(sessionsData);
    } catch (error) {
      console.error('[ERROR] Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Busca sesiones en vivo en curso (en espera / ejecutando) de este quiz
  const fetchActiveSessions = async () => {
    try {
      const snap = await dbGet(dbRef(rtdb, 'liveSessions'));
      const val = snap.val();
      if (!val) { setActiveSessions([]); return; }
      const list = Object.entries(val)
        .filter(([, s]) => s.quizId === id && (s.status === 'waiting' || s.status === 'started'))
        .map(([sid, s]) => ({
          sessionId: sid,
          joinCode: s.joinCode,
          status: s.status,
          createdAt: s.createdAt,
          participantsCount: s.participants ? Object.keys(s.participants).length : 0,
        }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setActiveSessions(list);
    } catch (error) {
      console.error('Error obteniendo sesiones en curso:', error);
    }
  };

  // Termina una sesión en curso (guarda estadísticas y la marca como finalizada)
  const handleEndActiveSession = async () => {
    if (!sessionToEnd) return;
    setEndingSession(true);
    try {
      await endLiveSession(sessionToEnd.sessionId, id);
      await fetchActiveSessions();
      await fetchSessions();
      setSessionToEnd(null);
    } catch (error) {
      console.error('Error terminando sesión:', error);
      toast.error('No se pudo terminar la sesión. Inténtalo de nuevo.');
    } finally {
      setEndingSession(false);
    }
  };

  // Junta los comentarios de todas las sesiones finalizadas del quiz
  const fetchComments = async () => {
    if (sessions.length === 0) { setComments([]); return; }
    setLoadingComments(true);
    try {
      const all = [];
      for (const s of sessions) {
        const fb = await fetchSessionFeedback(s.sessionId);
        fb.forEach((f) => all.push({ ...f, sessionDate: s.date }));
      }
      all.sort((a, b) => (b.submittedAt || 0) - (a.submittedAt || 0));
      setComments(all);
    } catch (error) {
      console.error('Error obteniendo comentarios:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // Exporta todas las sesiones finalizadas del quiz en un solo Excel
  const handleExportAllSessions = async () => {
    setExportingAll(true);
    try {
      const q = query(collection(db, 'sessionStats'), where('quizId', '==', id));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast.info('No hay sesiones finalizadas para exportar.');
        return;
      }
      const processed = await Promise.all(
        snap.docs.map(async (d) => {
          const data = d.data();
          const s = processSessionData(data);
          s.feedback = await fetchSessionFeedback(data.sessionId || d.id);
          return s;
        })
      );
      exportAllSessionsToExcel(quiz?.title || 'Reporte', processed);
    } catch (error) {
      console.error('Error exportando todas las sesiones:', error);
      toast.error('No se pudieron exportar las sesiones. Inténtalo de nuevo.');
    } finally {
      setExportingAll(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      await deleteDoc(doc(db, 'sessionStats', sessionId));
      await fetchSessions();
      setShowDeleteModal(false);
      setSessionToDelete(null);
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Error al eliminar la sesión. Inténtalo de nuevo.');
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

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['questions', 'sessions', 'comments'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, []);

  // Carga las sesiones al entrar para poder mostrar las métricas del encabezado
  useEffect(() => {
    fetchSessions();
    fetchActiveSessions();
  }, [id]);

  // Carga los comentarios cuando se abre la pestaña (y ya hay sesiones)
  useEffect(() => {
    if (activeTab === 'comments') fetchComments();
  }, [activeTab, sessions]);

  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-gray-500 text-sm">Cargando quiz...</p>
      </div>
    );
  }

  // Paginación de sesiones: 10 por página, más reciente arriba (ya vienen ordenadas)
  const SESSIONS_PER_PAGE = 10;
  const totalSessionPages = Math.max(1, Math.ceil(sessions.length / SESSIONS_PER_PAGE));
  const currentSessionPage = Math.min(sessionsPage, totalSessionPages);
  const paginatedSessions = sessions.slice(
    (currentSessionPage - 1) * SESSIONS_PER_PAGE,
    currentSessionPage * SESSIONS_PER_PAGE
  );

  // Métricas del encabezado: solo cuentan sesiones finalizadas (sessionStats)
  const totalPlayed = sessions.length;
  const avgPrecision =
    totalPlayed > 0
      ? Math.round(
          sessions.reduce((acc, s) => acc + (s.precision || 0), 0) / totalPlayed
        )
      : 0;

  const TABS = [
    { id: 'questions', label: `Preguntas (${quiz.questions?.length || 0})` },
    { id: 'sessions', label: `Sesiones${sessions.length > 0 ? ` (${sessions.length})` : ''}` },
    { id: 'comments', label: 'Comentario' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <BackButton to="/myquizzes" label="Volver a Mis Quizzes" className="mb-4" />

      {/* Encabezado */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{quiz.title}</h2>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1"><Target className="w-4 h-4" /> {avgPrecision}% precisión</span>
              <span className="flex items-center gap-1"><Gamepad2 className="w-4 h-4" /> {totalPlayed} {totalPlayed === 1 ? 'jugada' : 'jugadas'}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/preview/${id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors"
            >
              <Eye className="w-4 h-4" /> Vista previa
            </button>
            <button
              onClick={() => navigate(`/edit/${id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors"
            >
              <Pencil className="w-4 h-4" /> Editar
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <StartLiveSessionButton quizId={quiz.id} />
          <button
            onClick={handleExportAllSessions}
            disabled={exportingAll || sessions.length === 0}
            className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {exportingAll ? (
              <span className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            {exportingAll ? 'Exportando...' : 'Exportar estadísticas'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b mb-4 text-sm font-medium">
        {TABS.map(({ id: tabId, label }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={`pb-2 transition-colors ${
              activeTab === tabId
                ? 'border-b-2 border-indigo-600 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Toggle respuestas */}
      {activeTab === 'questions' && (
        <div className="flex justify-end sticky top-[112px] z-30 bg-[#f9fafb] py-2">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="flex items-center gap-2 bg-white border border-gray-300 px-3 py-1.5 rounded-full text-sm text-indigo-600 shadow-sm hover:bg-gray-50 transition-colors"
          >
            {showAnswers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAnswers ? 'Ocultar respuestas' : 'Mostrar respuestas'}
          </button>
        </div>
      )}

      {/* Tab: Preguntas */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {quiz.questions?.map((q, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">
                {i + 1}. Opción múltiple · 30 segundos · 1 punto
              </div>
              <p className="font-semibold text-gray-800">{q.question}</p>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {q.options.map((opt, idx) => {
                  const isCorrect = idx === q.correctAnswer;
                  let style = 'bg-gray-100 border border-gray-300 text-gray-700';
                  if (showAnswers) {
                    style = isCorrect
                      ? 'bg-green-100 border-green-400 text-green-700'
                      : 'bg-red-100 border-red-400 text-red-700';
                  }
                  return (
                    <li key={idx} className={`px-3 py-2 rounded-lg text-sm ${style}`}>
                      {opt}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Tab: Sesiones */}
      {activeTab === 'sessions' && (
        <div className="space-y-4 mt-4">
          {/* Sesiones en curso (reingresar) */}
          {activeSessions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-800">Sesiones en curso</h3>
              {activeSessions.map((s) => (
                <div
                  key={s.sessionId}
                  className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                      </span>
                      <h4 className="font-semibold text-gray-800">
                        {s.status === 'waiting' ? 'En espera de participantes' : 'Evaluación en curso'}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Código: {s.joinCode} · {s.participantsCount} {s.participantsCount === 1 ? 'participante' : 'participantes'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => navigate(`/live/${id}/${s.sessionId}`)}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg px-4 py-2 rounded-lg text-sm font-semibold transition-shadow"
                    >
                      <LogIn className="w-4 h-4" /> Reingresar
                    </button>
                    <button
                      onClick={() => setSessionToEnd(s)}
                      className="flex items-center gap-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                    >
                      Terminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="text-base font-semibold text-gray-800">Sesiones realizadas</h3>

          {loadingSessions ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3" />
              <p className="text-gray-500 text-sm">Cargando sesiones...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-10 text-center">
              <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-4">
                <Gamepad2 className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No hay sesiones registradas aún.</p>
              <p className="text-gray-400 text-sm mt-1">Las sesiones aparecerán aquí una vez que se completen.</p>
            </div>
          ) : (
            <>
              {paginatedSessions.map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{session.title}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {session.precision.toFixed(1)}% precisión · {session.participants} participantes · {session.averageScore.toFixed(1)} puntaje promedio
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Código: {session.joinCode} · Duración: {((session.finishedAt - session.startedAt) / 60000).toFixed(0)} min
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => navigate(`/sessions/${session.sessionId}/report`)}
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1.5 rounded-lg hover:shadow-lg transition-shadow text-sm font-semibold"
                    >
                      Ver informe
                    </button>
                    <button
                      onClick={() => { setSessionToDelete(session); setShowDeleteModal(true); }}
                      className="flex items-center gap-1 bg-white border border-red-300 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                </div>
              ))}

              {/* Controles de paginación */}
              {totalSessionPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-gray-500">
                    Mostrando {(currentSessionPage - 1) * SESSIONS_PER_PAGE + 1}–
                    {Math.min(currentSessionPage * SESSIONS_PER_PAGE, sessions.length)} de {sessions.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSessionsPage((p) => Math.max(1, p - 1))}
                      disabled={currentSessionPage === 1}
                      className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    {Array.from({ length: totalSessionPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setSessionsPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                          p === currentSessionPage
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setSessionsPage((p) => Math.min(totalSessionPages, p + 1))}
                      disabled={currentSessionPage === totalSessionPages}
                      className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab: Comentarios */}
      {activeTab === 'comments' && (
        <div className="mt-4">
          {loadingComments ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3" />
              <p className="text-gray-500 text-sm">Cargando comentarios...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="bg-gray-100 p-4 rounded-full w-fit mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-gray-700 font-semibold text-lg mb-1">Sin comentarios aún</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                Los comentarios y retroalimentación de los participantes aparecerán aquí cuando estén disponibles.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const rated = comments.filter((c) => c.rating > 0);
                const avg = rated.length ? (rated.reduce((a, c) => a + c.rating, 0) / rated.length).toFixed(1) : null;
                return (
                  <div className="flex flex-wrap items-center gap-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-900">{comments.length}</span>
                      <span className="text-sm text-gray-500">{comments.length === 1 ? 'comentario' : 'comentarios'}</span>
                    </div>
                    {avg && (
                      <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
                        <span className="text-lg leading-none">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={s <= Math.round(avg) ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                        </span>
                        <span className="text-sm font-semibold text-gray-700">{avg} / 5</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {comments.map((c, i) => {
                const displayName =
                  c.personnelCode && c.personnelCode !== c.name
                    ? `${c.personnelCode} - ${c.name}`
                    : c.name || 'Anónimo';
                return (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                          {(c.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm">{displayName}</p>
                          {c.cargo && <p className="text-xs text-gray-500">{c.cargo}</p>}
                        </div>
                      </div>
                      {c.rating > 0 && (
                        <span className="text-base leading-none shrink-0">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <span key={s} className={s <= c.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                          ))}
                        </span>
                      )}
                    </div>
                    {c.comment ? (
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.comment}</p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Sin comentario escrito</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {c.sessionDate && <span className="mr-2">Sesión {c.sessionDate}</span>}
                      {c.submittedAt &&
                        new Date(c.submittedAt).toLocaleString('es-ES', {
                          day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal terminar sesión en curso */}
      {sessionToEnd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-3">¿Terminar sesión?</h3>
            <p className="text-gray-700 mb-6">
              Se cerrará la sesión para todos los participantes y se guardarán las
              estadísticas en el historial. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSessionToEnd(null)}
                disabled={endingSession}
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEndActiveSession}
                disabled={endingSession}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-60"
              >
                {endingSession ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Terminando...
                  </>
                ) : 'Sí, terminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar sesión */}
      {showDeleteModal && sessionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-3">¿Eliminar sesión?</h3>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro de que quieres eliminar la sesión "{sessionToDelete.title}"?
              Esta acción no se puede deshacer y se perderán todas las estadísticas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setSessionToDelete(null); }}
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteSession(sessionToDelete.id)}
                className="flex-1 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-semibold py-2 px-4 rounded-lg transition-colors"
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
