import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, update } from 'firebase/database';
import { rtdb, db } from '../../../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import useSessionStats from '../hooks/useSessionStats';
import RankingTab from '../components/RankingTab';
import QuestionsTab from '../components/QuestionsTab';
import ResponsesTab from '../components/ResponsesTab';

const SessionStatsAdmin = () => {
  const { quizId, sessionId } = useParams();
  const navigate = useNavigate();
  const { ranking, questionAnalysis, quizQuestions, sessionData, kpis, participants } = useSessionStats(sessionId, quizId);

  // Estado para pestañas y modal
  const [activeTab, setActiveTab] = useState('ranking');
  const [showEndSessionModal, setShowEndSessionModal] = useState(false);

  // Función para terminar sesión
  const handleEndSession = async () => {
    let finalQuizId = quizId || sessionId?.split('-')[0];
    if (!finalQuizId || !sessionId) {
      alert('Error: Faltan datos necesarios.');
      return;
    }

    try {
      const sessionStats = {
        sessionId,
        quizId: finalQuizId,
        joinCode: sessionData?.joinCode || null,
        startedAt: sessionData?.createdAt || Date.now(),
        finishedAt: Date.now(),
        summary: {
          totalParticipants: kpis.totalParticipants,
          finishedCount: kpis.finishedCount,
          averageScore: kpis.averageScore.toFixed(2),
          totalPrecision: kpis.totalPrecision.toFixed(2),
        },
        ranking: ranking.map(p => ({
          name: p.name,
          score: p.score,
          incorrect: p.incorrect,
          finished: p.finished,
          total: p.total,
          answeredCount: p.answeredCount,
          totalTime: p.totalTime.toFixed(2),
          progressPercentage: p.total > 0 ? ((p.answeredCount / p.total) * 100).toFixed(1) : 0,
        })),
        questionAnalysis: questionAnalysis.map(q => ({
          question: q.question,
          correct: q.correct,
          incorrect: q.incorrect,
          accuracy: q.accuracy.toFixed(2),
          totalAnswers: q.correct + q.incorrect,
        })),
        questions: quizQuestions.map((q, i) => ({
          number: i + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
        participants: participants.map(p => ({
          name: p.name,
          type: p.type || 'casual',
          personnelCode: p.personnelCode || null,
        })),
      };

      const sessionStatsRef = doc(db, 'sessionStats', sessionId);
      await setDoc(sessionStatsRef, sessionStats);

      const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
      await update(sessionRef, { status: 'finished' });

      navigate('/my-quizzes');
    } catch (error) {
      console.error('Error finishing session:', error);
      alert('Error al terminar la sesión.');
    }
  };

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
            <p className="text-4xl font-extrabold text-white">{kpis.totalParticipants}</p>
          </div>
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-300">Precisión Media</h3>
            <p className="text-4xl font-extrabold text-blue-400">{kpis.totalPrecision.toFixed(1)}%</p>
          </div>
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-300">Puntaje Promedio</h3>
            <p className="text-4xl font-extrabold text-green-400">{kpis.averageScore.toFixed(1)}</p>
          </div>
          <div className="bg-gray-800/50 border border-purple-500/30 rounded-2xl p-6 flex flex-col justify-between shadow-lg backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-gray-300">Finalizados</h3>
            <p className="text-4xl font-extrabold text-yellow-400">{kpis.finishedCount} <span className="text-2xl text-gray-400">de {kpis.totalParticipants}</span></p>
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
          {activeTab === 'ranking' && <RankingTab ranking={ranking} />}
          {activeTab === 'questions' && <QuestionsTab questionAnalysis={questionAnalysis} />}
          {activeTab === 'grid' && <ResponsesTab ranking={ranking} quizQuestions={quizQuestions} />}
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
