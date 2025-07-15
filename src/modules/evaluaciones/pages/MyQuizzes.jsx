import React, { useEffect, useRef, useState } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import { Link, useNavigate } from 'react-router-dom';
import { FiMoreVertical, FiEye, FiUsers, FiTrendingUp, FiCalendar } from 'react-icons/fi';

const MyQuizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [quizStats, setQuizStats] = useState({});
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuizzesAndStats = async () => {
      try {
        setLoading(true);
        
        // Obtener todos los quizzes
        const querySnapshot = await getDocs(collection(db, 'quizzes'));
        const fetchedQuizzes = [];
        querySnapshot.forEach((doc) => {
          fetchedQuizzes.push({ id: doc.id, ...doc.data() });
        });
        setQuizzes(fetchedQuizzes);

        // Obtener estadísticas de sesiones para cada quiz
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
              if (sessionData.createdAt) {
                const sessionDate = sessionData.createdAt.toDate();
                if (!lastSessionDate || sessionDate > lastSessionDate) {
                  lastSessionDate = sessionDate;
                }
              }
              if (sessionData.precision !== undefined) {
                totalPrecision += sessionData.precision;
                sessionsWithPrecision++;
              }
            });

            return {
              quizId: quiz.id,
              totalSessions,
              totalParticipants,
              lastSessionDate,
              averagePrecision: sessionsWithPrecision > 0 ? Math.round(totalPrecision / sessionsWithPrecision) : 0
            };
          } catch (error) {
            console.error(`Error obteniendo stats para quiz ${quiz.id}:`, error);
            return {
              quizId: quiz.id,
              totalSessions: 0,
              totalParticipants: 0,
              lastSessionDate: null,
              averagePrecision: 0
            };
          }
        });

        const stats = await Promise.all(statsPromises);
        const statsMap = {};
        stats.forEach(stat => {
          statsMap[stat.quizId] = stat;
        });
        setQuizStats(statsMap);

      } catch (err) {
        console.error('Error al obtener quizzes y estadísticas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzesAndStats();
  }, []);

  // Cierra el dropdown si haces clic fuera
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
      const quizCopy = {
        ...quiz,
        title: quiz.title + ' (copia)',
        createdAt: new Date(),
      };
      delete quizCopy.id;
      const docRef = await addDoc(collection(db, 'quizzes'), quizCopy);
      setQuizzes([...quizzes, { id: docRef.id, ...quizCopy }]);
    } catch (err) {
      console.error('Error duplicando quiz:', err);
    }
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  const toggleDropdown = (event, index) => {
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: buttonRect.bottom + window.scrollY + 4,
      left: buttonRect.left + window.scrollX - 100,
    });
    setDropdownOpen(index);
  };

  return (
    <div className="flex justify-center pt-8 min-h-[60vh] p-8 relative">
      <div className="w-full max-w-6xl">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => navigate('/create')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-5 rounded-2xl shadow-md transition-all duration-200"
          >
            <span className="text-xl leading-none">➕</span>
            <span className="text-sm sm:text-base">Crear nueva evaluación</span>
          </button>
        </div>


        <h1 className="text-2xl font-bold mb-6 text-center">Mis Quizzes</h1>

        {loading ? (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 gap-6 w-full max-w-5xl">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-md px-6 py-4 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4 text-6xl">📝</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No tienes quizzes aún</h3>
            <p className="text-gray-500 mb-6">Crea tu primer quiz para comenzar a capacitar a tu equipo</p>
            <button
              onClick={() => navigate('/create')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Crear primer quiz
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 gap-6 w-full max-w-5xl">
              {quizzes
                .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                .map((quiz, index) => {
                  const stats = quizStats[quiz.id] || {
                    totalSessions: 0,
                    totalParticipants: 0,
                    lastSessionDate: null,
                    averagePrecision: 0
                  };

                  const formatDate = (date) => {
                    if (!date) return 'Nunca';
                    return date.toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    });
                  };

                  return (
                    <div key={quiz.id}>
                      <div 
                        onClick={() => navigate(`/quiz/${quiz.id}?tab=sessions`)}
                        className="group bg-white rounded-xl shadow-md hover:shadow-xl px-6 py-5 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-100"
                      >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h2 className="text-xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors mb-2 line-clamp-2">
                              {quiz.title}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <FiCalendar size={14} />
                              <span>Última sesión: {formatDate(stats.lastSessionDate)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/preview/${quiz.id}`);
                              }}
                              title="Vista previa"
                              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              <FiEye size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleDropdown(e, index);
                              }}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors dropdown-toggle"
                            >
                              <FiMoreVertical size={18} />
                            </button>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <span className="text-blue-600 font-semibold text-sm">📋</span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Preguntas</p>
                              <p className="text-lg font-bold text-gray-800">{quiz.questions?.length || 0}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <FiTrendingUp className="text-green-600" size={16} />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Sesiones</p>
                              <p className="text-lg font-bold text-gray-800">{stats.totalSessions}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <FiUsers className="text-purple-600" size={16} />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Participantes</p>
                              <p className="text-lg font-bold text-gray-800">{stats.totalParticipants}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                            <div className="p-2 bg-orange-100 rounded-lg">
                              <span className="text-orange-600 font-semibold text-sm">📊</span>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Precisión</p>
                              <p className="text-lg font-bold text-gray-800">
                                {stats.averagePrecision > 0 ? `${stats.averagePrecision}%` : 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {stats.totalSessions > 0 && (
                          <div className="mt-4 flex justify-between items-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Quiz activo con datos
                            </span>
                            <span className="text-xs text-gray-400">
                              Clic para ver estadísticas detalladas
                            </span>
                          </div>
                        )}
                        {stats.totalSessions === 0 && (
                          <div className="mt-4 flex justify-between items-center">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              📋 Sin sesiones aún
                            </span>
                            <span className="text-xs text-gray-400">
                              Crear sesión en vivo para comenzar
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* 🔽 Dropdown flotante visible sobre todo */}
      {dropdownOpen !== null && (
        <div
          className="fixed w-40 bg-white border rounded shadow-lg z-50 dropdown-menu"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
          }}
        >
          <button
            onClick={() => {
              window.location.href = `/live/${quizzes[dropdownOpen].id}`;
              setDropdownOpen(null);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100"
          >
            Sesión en vivo
          </button>
          <button
            onClick={() => {
              handleEdit(quizzes[dropdownOpen].id);
              setDropdownOpen(null);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100"
          >
            Editar
          </button>
          <button
            onClick={() => {
              handleDuplicate(quizzes[dropdownOpen]);
              setDropdownOpen(null);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100"
          >
            Duplicar
          </button>
          <button
            onClick={() => {
              handleDelete(quizzes[dropdownOpen].id);
              setDropdownOpen(null);
            }}
            className="w-full text-left px-3 py-2 hover:bg-gray-100 text-red-500"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
};

export default MyQuizzes;
