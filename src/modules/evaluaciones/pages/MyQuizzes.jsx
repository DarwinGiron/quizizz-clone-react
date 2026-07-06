import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { useNavigate } from 'react-router-dom';
import { MoreVertical, Eye, Users, TrendingUp, Calendar, BookOpen, Target } from 'lucide-react';
import { TipoEvaluacionModal, EstadisticasCapacitacionModal } from '../components';
import { useAuth } from '../../../shared';

const MyQuizzes = () => {
  const { isSupervisor } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [quizStats, setQuizStats] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState(true);
  const [showTipoModal, setShowTipoModal] = useState(false);
  const [showEstadisticasModal, setShowEstadisticasModal] = useState(false);
  const [selectedQuizForStats, setSelectedQuizForStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzesAndStats = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'quizzes'));
        const fetchedQuizzes = [];
        querySnapshot.forEach((doc) => {
          fetchedQuizzes.push({ id: doc.id, ...doc.data() });
        });
        setQuizzes(fetchedQuizzes);

        const statsPromises = fetchedQuizzes.map(async (quiz) => {
          try {
            const sessionsQuery = query(
              collection(db, 'sessionStats'),
              where('quizId', '==', quiz.id)
            );
            const sessionsSnapshot = await getDocs(sessionsQuery);

            let totalParticipants = 0;
            let totalSessions = sessionsSnapshot.size;
            let lastSessionDate = null;
            let totalPrecision = 0;
            let sessionsWithPrecision = 0;

            sessionsSnapshot.forEach((doc) => {
              const sessionData = doc.data();
              if (sessionData.participants) {
                totalParticipants += sessionData.participants.length;
              }
              // La fecha se guarda como timestamp numérico (finishedAt / startedAt)
              const finishedMs = sessionData.finishedAt || sessionData.startedAt;
              if (finishedMs) {
                const sessionDate = new Date(finishedMs);
                if (!lastSessionDate || sessionDate > lastSessionDate) {
                  lastSessionDate = sessionDate;
                }
              }
              // La precisión se guarda en summary.totalPrecision
              const prec = Number(sessionData.summary?.totalPrecision);
              if (!Number.isNaN(prec)) {
                totalPrecision += prec;
                sessionsWithPrecision++;
              }
            });

            return {
              quizId: quiz.id,
              totalSessions,
              totalParticipants,
              lastSessionDate,
              averagePrecision: sessionsWithPrecision > 0 ? Math.round(totalPrecision / sessionsWithPrecision) : 0,
            };
          } catch (error) {
            console.error(`Error obteniendo stats para quiz ${quiz.id}:`, error);
            return { quizId: quiz.id, totalSessions: 0, totalParticipants: 0, lastSessionDate: null, averagePrecision: 0 };
          }
        });

        const stats = await Promise.all(statsPromises);
        const statsMap = {};
        stats.forEach((stat) => { statsMap[stat.quizId] = stat; });
        setQuizStats(statsMap);
      } catch (err) {
        console.error('Error al obtener quizzes y estadísticas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzesAndStats();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest('.dropdown-toggle') &&
        !event.target.closest('.dropdown-menu')
      ) {
        setDropdownOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'quizzes', id));
      setQuizzes(quizzes.filter((quiz) => quiz.id !== id));
    } catch (err) {
      console.error('Error eliminando quiz:', err);
    }
  };

  const handleDuplicate = async (quiz) => {
    try {
      const quizCopy = { ...quiz, title: quiz.title + ' (copia)', createdAt: new Date() };
      delete quizCopy.id;
      const docRef = await addDoc(collection(db, 'quizzes'), quizCopy);
      setQuizzes([...quizzes, { id: docRef.id, ...quizCopy }]);
    } catch (err) {
      console.error('Error duplicando quiz:', err);
    }
  };

  const handleEdit = (id) => navigate(`/edit/${id}`);

  const toggleDropdown = (event, index) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: buttonRect.bottom + window.scrollY + 4,
      left: buttonRect.left + window.scrollX - 100,
    });
    setDropdownOpen(index);
  };

  const handleTipoEvaluacionSelect = (seleccion) => {
    if (seleccion.tipo === 'capacitacion') {
      navigate('/create', { state: { capacitacionVinculada: seleccion.capacitacion, tipoEvaluacion: 'capacitacion' } });
    } else {
      navigate('/create', { state: { tipoEvaluacion: 'evento' } });
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Nunca';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="flex justify-center pt-8 min-h-[60vh] p-8 relative">
      <div className="w-full max-w-6xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2.5 rounded-lg">
              <BookOpen className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isSupervisor ? 'Reportes' : 'Mis Quizzes'}
            </h1>
          </div>
          {!isSupervisor && (
            <button
              onClick={() => setShowTipoModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-shadow text-white font-semibold py-2.5 px-5 rounded-lg"
            >
              <span className="text-lg leading-none">+</span>
              <span className="text-sm sm:text-base">Crear nueva evaluación</span>
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
            <p className="text-gray-500 text-sm">Cargando evaluaciones...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="bg-indigo-100 p-4 rounded-full w-fit mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {isSupervisor ? 'Aún no hay evaluaciones' : 'No tienes quizzes aún'}
            </h3>
            <p className="text-gray-500 mb-6">
              {isSupervisor
                ? 'Cuando haya sesiones finalizadas, sus reportes aparecerán aquí.'
                : 'Crea tu primera evaluación para comenzar a capacitar a tu equipo'}
            </p>
            {!isSupervisor && (
              <button
                onClick={() => setShowTipoModal(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-shadow text-white font-semibold py-3 px-6 rounded-lg"
              >
                Crear primer quiz
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {quizzes
              .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
              .map((quiz, index) => {
                const stats = quizStats[quiz.id] || {
                  totalSessions: 0,
                  totalParticipants: 0,
                  lastSessionDate: null,
                  averagePrecision: 0,
                };

                return (
                  <div
                    key={quiz.id}
                    onClick={() => navigate(`/quiz/${quiz.id}?tab=sessions`)}
                    className="group bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md px-6 py-5 transition-all duration-200 cursor-pointer"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h2 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {quiz.title}
                          </h2>
                          {quiz.capacitacionVinculada && (
                            <span className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full shrink-0">
                              Vinculada
                            </span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Última sesión: {formatDate(stats.lastSessionDate)}</span>
                          </div>
                          {quiz.capacitacionVinculada && (
                            <div className="flex items-center gap-1.5 text-sm text-indigo-600">
                              <span>🔗</span>
                              <span>Capacitación: {quiz.capacitacionVinculada.titulo}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {!isSupervisor && (
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/preview/${quiz.id}`); }}
                            title="Vista previa"
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4.5 h-4.5" size={18} />
                          </button>
                        )}
                        {quiz.capacitacionVinculada && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedQuizForStats(quiz); setShowEstadisticasModal(true); }}
                            title="Estadísticas de Capacitación"
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-semibold"
                          >
                            Stats
                          </button>
                        )}
                        {!isSupervisor && (
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleDropdown(e, index); }}
                            className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors dropdown-toggle"
                          >
                            <MoreVertical size={18} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="p-1.5 bg-blue-100 rounded-lg">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Preguntas</p>
                          <p className="text-base font-bold text-gray-800">{quiz.questions?.length || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="p-1.5 bg-green-100 rounded-lg">
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Sesiones</p>
                          <p className="text-base font-bold text-gray-800">{stats.totalSessions}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                        <div className="p-1.5 bg-indigo-100 rounded-lg">
                          <Users className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Participantes</p>
                          <p className="text-base font-bold text-gray-800">{stats.totalParticipants}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <div className="p-1.5 bg-orange-100 rounded-lg">
                          <Target className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Precisión</p>
                          <p className="text-base font-bold text-gray-800">
                            {stats.averagePrecision > 0 ? `${stats.averagePrecision}%` : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="mt-4 flex justify-between items-center">
                      {stats.totalSessions > 0 ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Quiz activo con datos
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          Sin sesiones aún
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {stats.totalSessions > 0 ? 'Clic para ver estadísticas' : 'Crea una sesión en vivo para comenzar'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Dropdown flotante */}
      {dropdownOpen !== null && (
        <div
          className="fixed w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 dropdown-menu py-1"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
        >
          <button
            onClick={() => { window.location.href = `/live/${quizzes[dropdownOpen].id}`; setDropdownOpen(null); }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
          >
            Sesión en vivo
          </button>
          <button
            onClick={() => { handleEdit(quizzes[dropdownOpen].id); setDropdownOpen(null); }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
          >
            Editar
          </button>
          <button
            onClick={() => { handleDuplicate(quizzes[dropdownOpen]); setDropdownOpen(null); }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700 transition-colors"
          >
            Duplicar
          </button>
          <button
            onClick={() => { handleDelete(quizzes[dropdownOpen].id); setDropdownOpen(null); }}
            className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 transition-colors"
          >
            Eliminar
          </button>
        </div>
      )}

      <TipoEvaluacionModal
        isOpen={showTipoModal}
        onClose={() => setShowTipoModal(false)}
        onSelect={handleTipoEvaluacionSelect}
      />

      <EstadisticasCapacitacionModal
        isOpen={showEstadisticasModal}
        onClose={() => { setShowEstadisticasModal(false); setSelectedQuizForStats(null); }}
        quiz={selectedQuizForStats}
      />
    </div>
  );
};

export default MyQuizzes;
