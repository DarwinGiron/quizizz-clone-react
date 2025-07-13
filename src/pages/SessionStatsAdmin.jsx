import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, update } from 'firebase/database';
import { rtdb, db } from '../firebase/config';
import { doc, setDoc } from 'firebase/firestore';

const SessionStatsAdmin = () => {
  const { quizId, sessionId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [answers, setAnswers] = useState({});
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [sessionData, setSessionData] = useState(null);

  // Ocultar sidebar/layout en el lobby del admin
  useEffect(() => {
    document.body.classList.add('bg-black');
    const mainLayout = document.getElementById('main-layout-sidebar');
    if (mainLayout) mainLayout.style.display = 'none';
    return () => {
      document.body.classList.remove('bg-black');
      if (mainLayout) mainLayout.style.display = '';
    };
  }, []);

  // Escuchar participantes y respuestas
  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    const unsubscribeSession = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      setSessionData(data);
    });
    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
    const unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      console.log('[DEBUG] Datos de participantes desde Firebase:', data);
      setParticipants(data ? Object.values(data) : []);
    });
    const answersRef = ref(rtdb, `liveSessions/${sessionId}/answers`);
    const unsubscribeAnswers = onValue(answersRef, (snapshot) => {
      const data = snapshot.val();
      console.log('[DEBUG] Datos de respuestas desde Firebase:', data);
      console.log('[DEBUG] Estructura completa de answers:', JSON.stringify(data, null, 2));
      setAnswers(data || {});
    });
    return () => {
      unsubscribeSession();
      unsubscribeParticipants();
      unsubscribeAnswers();
    };
  }, [sessionId]);

  // Nuevo useEffect: cargar preguntas cuando quizId cambie
  useEffect(() => {
    let finalQuizId = quizId;
    
    // Si no hay quizId en parámetros, intentar extraerlo del sessionId
    if (!finalQuizId && sessionId) {
      const quizIdFromSession = sessionId.split('-')[0];
      if (quizIdFromSession && quizIdFromSession !== sessionId) {
        finalQuizId = quizIdFromSession;
        console.log('[DEBUG] QuizId extraído del sessionId para cargar preguntas:', finalQuizId);
      }
    }
    
    if (!finalQuizId) return;
    
    import('firebase/firestore').then(firestore => {
      const { getFirestore, doc, getDoc } = firestore;
      const firestoreDb = getFirestore();
      const quizRef = doc(firestoreDb, 'quizzes', finalQuizId);
      getDoc(quizRef).then(docSnap => {
        if (docSnap.exists()) {
          const newQuestions = docSnap.data().questions || [];
          setQuizQuestions(prev => {
            if (
              prev.length !== newQuestions.length ||
              JSON.stringify(prev) !== JSON.stringify(newQuestions)
            ) {
              return newQuestions;
            }
            return prev;
          });
        } else {
          setQuizQuestions([]);
        }
      });
    });
  }, [quizId, sessionId]);

  // Calcular ranking y detalles robustos
  const ranking = participants.map((p) => {
    console.log('[DEBUG] Procesando participante:', p.name);
    console.log('[DEBUG] Respuestas del participante desde answers[p.name]:', answers[p.name]);
    console.log('[DEBUG] Tipo de respuestas:', typeof answers[p.name]);
    
    // Las respuestas están guardadas como answers[participantName] = [array_de_respuestas]
    const userAnswers = Array.isArray(answers[p.name]) ? answers[p.name] : [];
    console.log('[DEBUG] userAnswers procesadas:', userAnswers);
    let correct = 0;
    let incorrect = 0;
    let finished = false;
    let totalTime = 0;
    // answerDetails: para cada pregunta, status y tiempo
    // NO ordenar aquí, solo mapear en el orden original de las preguntas
    const answerDetails = quizQuestions.map((q, idx) => {
      const ansObj = userAnswers[idx];
      console.log('[DEBUG] Pregunta', idx, '- ansObj:', ansObj, '- correctAnswer:', q.correctAnswer);
      // Asegura que la comparación sea robusta para opciones tipo string/number
      const correctValue = q.correctAnswer;
      const userValue = ansObj?.answer;

      if (userValue === undefined) return { status: 'unanswered', time: null };
      
      const isCorrect = userValue === correctValue;
      console.log('[DEBUG] userValue:', userValue, 'correctValue:', correctValue, 'isCorrect:', isCorrect);
      if (isCorrect) correct++;
      else incorrect++;
      if (ansObj && typeof ansObj.time === 'number') totalTime += ansObj.time;
      return {
        status: isCorrect ? 'correct' : 'incorrect',
        time: ansObj.time || null,
      };
    });
    if (quizQuestions.length > 0 && answerDetails.every(ad => ad.status !== 'unanswered')) finished = true;
    const answeredCount = answerDetails.filter(ad => ad.status !== 'unanswered').length;
    return {
      name: p.name,
      score: correct,
      incorrect,
      finished,
      total: quizQuestions.length,
      answers: userAnswers,
      answerDetails,
      answeredCount,
      totalTime,
    };
  }).sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);

  // --- Función para terminar la sesión ---
  const handleEndSession = async () => {
    console.log('[DEBUG] ===== INICIANDO handleEndSession =====');
    console.log('[DEBUG] quizId desde parámetros:', quizId);
    console.log('[DEBUG] sessionId desde parámetros:', sessionId);
    
    // Intentar extraer quizId del sessionId si no viene en parámetros
    let finalQuizId = quizId;
    if (!finalQuizId && sessionId) {
      // Los sessionId tienen formato: quizId-timestamp
      const quizIdFromSession = sessionId.split('-')[0];
      if (quizIdFromSession && quizIdFromSession !== sessionId) {
        finalQuizId = quizIdFromSession;
        console.log('[DEBUG] quizId extraído del sessionId:', finalQuizId);
      }
    }
    
    // Validar que tengamos los datos necesarios
    if (!finalQuizId || !sessionId) {
      console.error('[ERROR] Faltan parámetros: finalQuizId =', finalQuizId, 'sessionId =', sessionId);
      alert('Error: Faltan datos necesarios para terminar la sesión.');
      return;
    }
    
    try {
      console.log('[DEBUG] Iniciando proceso de guardado de estadísticas');
      console.log('[DEBUG] SessionId:', sessionId);
      console.log('[DEBUG] FinalQuizId que se usará:', finalQuizId);
      console.log('[DEBUG] SessionData completo:', sessionData);
      console.log('[DEBUG] SessionData.quizId:', sessionData?.quizId);
      console.log('[DEBUG] QuizId desde URL:', quizId);
      console.log('[DEBUG] Todas las propiedades de sessionData:', Object.keys(sessionData || {}));
      
      // Preparar datos completos de estadísticas para guardar
      const sessionStats = {
        sessionId: sessionId,
        quizId: finalQuizId, // Usar el quizId validado
        joinCode: sessionData?.joinCode || null,
        startedAt: sessionData?.createdAt || Date.now(),
        finishedAt: Date.now(),
        
        // Métricas generales (KPIs)
        summary: {
          totalParticipants: totalParticipants || 0,
          finishedCount: finishedCount || 0,
          averageScore: parseFloat((averageScore || 0).toFixed(2)),
          totalPrecision: parseFloat((totalPrecision || 0).toFixed(2))
        },
        
        // Datos de clasificación (Pestaña 1)
        ranking: ranking.map(p => ({
          name: p.name,
          score: p.score,
          incorrect: p.incorrect,
          finished: p.finished,
          total: p.total,
          answeredCount: p.answeredCount,
          totalTime: parseFloat(p.totalTime.toFixed(2)),
          progressPercentage: p.total > 0 ? parseFloat(((p.answeredCount / p.total) * 100).toFixed(1)) : 0
        })),
        
        // Análisis por pregunta (Pestaña 2)
        questionAnalysis: questionAnalysis.map(q => ({
          question: q.question,
          correct: q.correct,
          incorrect: q.incorrect,
          accuracy: parseFloat(q.accuracy.toFixed(2)),
          totalAnswers: q.correct + q.incorrect
        })),
        
        // Respuestas detalladas (Pestaña 3)
        detailedResponses: ranking.map(p => ({
          participantName: p.name,
          responses: quizQuestions.map((q, i) => {
            const answerDetail = p.answerDetails[i];
            const userAnswer = p.answers[i];
            return {
              questionNumber: i + 1,
              question: q.question || `Pregunta ${i + 1}`,
              userAnswer: userAnswer !== undefined ? q.options[userAnswer.answer] : null,
              correctAnswer: q.options[q.correctAnswer],
              isCorrect: answerDetail?.status === 'correct',
              responseTime: answerDetail?.time || null,
              status: answerDetail?.status || 'unanswered'
            };
          })
        })),
        
        // Datos de preguntas completas
        questions: quizQuestions.map((q, i) => ({
          number: i + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer
        })),
        
        // Datos de participantes completos
        participants: participants.map(p => ({
          name: p.name,
          type: p.type || 'casual',
          personnelCode: p.personnelCode || null
        }))
      };

      console.log('[DEBUG] Datos de estadísticas preparados:', sessionStats);
      
      // Validar que no hay campos undefined antes de guardar
      const validateObject = (obj, path = '') => {
        for (const [key, value] of Object.entries(obj)) {
          if (value === undefined) {
            console.error('[ERROR] Campo undefined encontrado:', `${path}.${key}`);
            return false;
          }
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (!validateObject(value, `${path}.${key}`)) return false;
          }
        }
        return true;
      };
      
      if (!validateObject(sessionStats)) {
        console.error('[ERROR] Datos con campos undefined, no se puede guardar');
        alert('Error: Hay datos faltantes que impiden guardar las estadísticas.');
        return;
      }

      // Guardar estadísticas en Firestore
      const sessionStatsRef = doc(db, 'sessionStats', sessionId);
      await setDoc(sessionStatsRef, sessionStats);
      
      console.log('[DEBUG] Estadísticas guardadas exitosamente en Firestore con ID:', sessionId);
      
      // Actualizar estado de la sesión en RTDB
      const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
      await update(sessionRef, { status: 'finished' });
      
      console.log('[DEBUG] Estado de sesión actualizado a finished');
      
      // Redirigir al admin a la página de my-quizzes
      navigate('/my-quizzes');
    } catch (error) {
      console.error("[ERROR] Error finishing session:", error);
      console.error("[ERROR] Error details:", error.message);
      alert("Hubo un error al intentar terminar la sesión y guardar las estadísticas. Por favor, inténtalo de nuevo.");
    }
  };

  // --- Estado para las pestañas ---
  const [activeTab, setActiveTab] = useState('ranking'); // 'ranking', 'questions', 'grid'
  
  // --- Estado para el modal de confirmación ---
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);

  // --- Métricas Clave (KPIs) ---
  const totalParticipants = ranking.length;
  const finishedCount = ranking.filter(p => p.finished).length;
  const averageScore = totalParticipants > 0 
    ? ranking.reduce((acc, p) => acc + p.score, 0) / totalParticipants 
    : 0;
  const totalPrecision = totalParticipants > 0 && quizQuestions.length > 0
    ? (ranking.reduce((acc, p) => acc + (p.total > 0 ? (p.score / p.total) : 0), 0) / totalParticipants) * 100
    : 0;

  // --- Análisis por Pregunta ---
  const questionAnalysis = quizQuestions.map((q, index) => {
    let correctCount = 0;
    let incorrectCount = 0;
    ranking.forEach(p => {
      const answerDetail = p.answerDetails[index];
      if (answerDetail?.status === 'correct') {
        correctCount++;
      } else if (answerDetail?.status === 'incorrect') {
        incorrectCount++;
      }
    });
    const totalAnswers = correctCount + incorrectCount;
    const accuracy = totalAnswers > 0 ? (correctCount / totalAnswers) * 100 : 0;
    return {
      question: q.question,
      correct: correctCount,
      incorrect: incorrectCount,
      accuracy: accuracy,
    };
  }).sort((a, b) => b.accuracy - a.accuracy);


  return (
    <div className="min-h-screen w-full bg-gray-900 text-white font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-purple-300">Panel de Sesión en Vivo</h1>
              <p className="text-purple-100">Monitoriza el progreso de los participantes en tiempo real.</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <span className="text-sm text-gray-400">Código de Sesión</span>
                <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">{sessionData?.joinCode}</p>
              </div>
              <button
                onClick={() => setShowEndSessionModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>Terminar Sesión</span>
              </button>
            </div>
          </div>
        </header>

        {/* Tarjetas de Métricas (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-300">Participantes</h3>
            <p className="text-4xl font-extrabold text-white">{totalParticipants}</p>
          </div>
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-300">Precisión Media</h3>
            <p className="text-4xl font-extrabold text-blue-400">{totalPrecision.toFixed(1)}%</p>
          </div>
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-300">Puntaje Promedio</h3>
            <p className="text-4xl font-extrabold text-green-400">{averageScore.toFixed(1)}</p>
          </div>
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-300">Finalizados</h3>
            <p className="text-4xl font-extrabold text-yellow-400">{finishedCount} <span className="text-2xl text-gray-400">de {totalParticipants}</span></p>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="mb-8 flex border-b border-purple-800/50">
          <button
            onClick={() => setActiveTab('ranking')}
            className={`py-3 px-6 font-semibold text-lg transition-colors duration-200 ${activeTab === 'ranking' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
          >
            Clasificación
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-3 px-6 font-semibold text-lg transition-colors duration-200 ${activeTab === 'questions' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
          >
            Análisis de Preguntas
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            className={`py-3 px-6 font-semibold text-lg transition-colors duration-200 ${activeTab === 'grid' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'}`}
          >
            Respuestas Detalladas
          </button>
        </div>

        {/* Contenido de las Pestañas */}
        <div className="bg-gray-800/50 border border-purple-500/30 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden">
          {activeTab === 'ranking' && (
            <div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-purple-200 mb-4">Tabla de Clasificación</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-black/30">
                    <tr className="text-purple-300">
                      <th className="py-3 px-6 font-semibold text-center">#</th>
                      <th className="py-3 px-6 font-semibold">Nombre</th>
                      <th className="py-3 px-6 font-semibold text-center">Correctas</th>
                      <th className="py-3 px-6 font-semibold text-center">Incorrectas</th>
                      <th className="py-3 px-6 font-semibold text-center">Puntaje Total</th>
                      <th className="py-3 px-6 font-semibold">Progreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.length === 0 && (
                      <tr><td colSpan="6" className="text-center py-12 text-gray-400">Esperando participantes...</td></tr>
                    )}
                    {ranking.map((p, i) => {
                      const progress = p.total > 0 ? (p.answeredCount / p.total) * 100 : 0;
                      return (
                        <tr key={p.name} className="border-t border-purple-900/50 hover:bg-gray-700/50 transition-colors duration-200">
                          <td className="py-4 px-6 font-bold text-center text-xl">{i + 1}</td>
                          <td className="py-4 px-6 font-bold text-lg text-purple-200">{p.name}</td>
                          <td className="py-4 px-6 text-center text-green-400 font-bold text-lg">{p.score}</td>
                          <td className="py-4 px-6 text-center text-red-400 font-bold text-lg">{p.incorrect}</td>
                          <td className="py-4 px-6 text-center text-yellow-300 font-bold text-xl">{p.score}</td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="w-full bg-gray-700 rounded-full h-4 border-2 border-purple-400/50">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${p.finished ? 'bg-green-500' : 'bg-purple-500'}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="w-20 text-right font-semibold">{progress.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-purple-200 mb-4">Análisis por Pregunta</h2>
                <p className="text-purple-100">Preguntas ordenadas por mayor a menor precisión.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-black/30">
                    <tr className="text-purple-300">
                      <th className="py-3 px-6 font-semibold">Pregunta</th>
                      <th className="py-3 px-6 font-semibold text-center">Precisión</th>
                      <th className="py-3 px-6 font-semibold text-center">Correctas</th>
                      <th className="py-3 px-6 font-semibold text-center">Incorrectas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questionAnalysis.map((q, i) => (
                      <tr key={i} className="border-t border-purple-900/50">
                        <td className="py-4 px-6">{q.question}</td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold text-blue-300 text-lg">{q.accuracy.toFixed(1)}%</span>
                            <div className="w-24 bg-gray-700 rounded-full h-2.5"><div className="bg-blue-500 h-2.5 rounded-full" style={{width: `${q.accuracy}%`}}></div></div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-center text-green-400 font-bold">{q.correct}</td>
                        <td className="py-4 px-6 text-center text-red-400 font-bold">{q.incorrect}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'grid' && (
            <div>
              <div className="p-6">
                <h2 className="text-2xl font-bold text-purple-200 mb-4">Respuestas Detalladas por Participante</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-black/30">
                    <tr>
                      <th className="sticky left-0 bg-black/30 py-3 px-6 font-semibold text-purple-300 z-10">Participante</th>
                      {quizQuestions.map((q, i) => (
                        <th key={i} className="py-3 px-4 font-semibold text-center align-top" style={{ minWidth: '160px', maxWidth: '240px' }}>
                          <span className="block text-xs font-normal text-purple-200 mb-1">Pregunta {i + 1}</span>
                          {q.question || `Pregunta ${i+1}`}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((p) => (
                      <tr key={p.name} className="border-t border-purple-900/50">
                        <td className="sticky left-0 bg-gray-800/80 backdrop-blur-sm py-4 px-6 font-bold text-purple-200 z-10">{p.name}</td>
                        {quizQuestions.map((q, i) => {
                          const answerDetail = p.answerDetails[i];
                          const userAnswer = p.answers[i];
                          const answerText = userAnswer !== undefined ? q.options[userAnswer.answer] : '–';
                          let cellClass = 'py-4 px-4 text-center whitespace-nowrap ';
                          if (answerDetail?.status === 'correct') cellClass += 'bg-green-800/30 text-green-300';
                          else if (answerDetail?.status === 'incorrect') cellClass += 'bg-red-800/30 text-red-300';
                          else cellClass += 'text-gray-500';
                          return (
                            <td key={i} className={cellClass}>
                              {answerText}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Confirmación para Terminar Sesión */}
        {showEndSessionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-purple-500/30 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
              <h3 className="text-xl font-bold text-purple-300 mb-4">Confirmar Fin de Sesión</h3>
              <p className="text-purple-100 mb-6">
                ¿Estás seguro de que quieres terminar esta sesión para todos los participantes? Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowEndSessionModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    console.log('[DEBUG] Usuario hizo clic en terminar sesión');
                    setShowEndSessionModal(false);
                    handleEndSession();
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                  Sí, terminar sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionStatsAdmin;
