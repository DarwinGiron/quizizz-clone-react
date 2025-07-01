import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { rtdb, db } from '../firebase/config';

const SessionStatsAdmin = () => {
  const { sessionId } = useParams();
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
      if (data && data.quizId) {
        // Cargar preguntas del quiz
        db.collection('quizzes').doc(data.quizId).get().then(docSnap => {
          if (docSnap.exists) setQuizQuestions(docSnap.data().questions || []);
        });
      }
    });
    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
    const unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      setParticipants(data ? Object.values(data) : []);
    });
    const answersRef = ref(rtdb, `liveSessions/${sessionId}/answers`);
    const unsubscribeAnswers = onValue(answersRef, (snapshot) => {
      const data = snapshot.val();
      setAnswers(data || {});
    });
    return () => {
      unsubscribeSession();
      unsubscribeParticipants();
      unsubscribeAnswers();
    };
  }, [sessionId]);

  // Calcular puntaje, estatus y respuestas correctas/incorrectas, tiempos y detalles por pregunta
  const ranking = participants.map((p) => {
    const userAnswers = answers[p.name] || [];
    let correct = 0;
    let incorrect = 0;
    let finished = false;
    let totalTime = 0;
    // userAnswers ahora puede ser array de objetos: { answer, time }
    const answerDetails = quizQuestions.map((q, idx) => {
      const ansObj = userAnswers[idx];
      if (!ansObj) return { status: 'unanswered', time: null };
      const isCorrect = ansObj.answer === q.correct;
      if (isCorrect) correct++;
      else incorrect++;
      if (typeof ansObj.time === 'number') totalTime += ansObj.time;
      return {
        status: isCorrect ? 'correct' : 'incorrect',
        time: ansObj.time || null,
      };
    });
    if (quizQuestions.length > 0 && userAnswers.length === quizQuestions.length) finished = true;
    return {
      name: p.name,
      score: correct,
      incorrect,
      finished,
      total: quizQuestions.length,
      answers: userAnswers,
      answerDetails,
      totalTime,
    };
  }).sort((a, b) => b.score - a.score || a.totalTime - b.totalTime);

  // Calcular precisión total de la clase
  const totalPrecision = ranking.length > 0
    ? (ranking.reduce((acc, p) => acc + (p.total > 0 ? (p.score / p.total) : 0), 0) / ranking.length) * 100
    : 0;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4">
      <div className="max-w-4xl mx-auto bg-white bg-opacity-10 rounded-2xl shadow-2xl p-8 mt-8">
        {/* Barra de precisión de la clase */}
        <div className="mb-8">
          <div className="flex flex-col items-center">
            <span className="text-lg font-bold text-blue-300 mb-2">Precisión de la clase</span>
            <div className="w-full max-w-xl h-12 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-full flex overflow-hidden border-4 border-blue-400 shadow-inner relative">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${totalPrecision}%` }}
              />
              <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white font-extrabold text-xl drop-shadow">
                {totalPrecision.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-8">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-2">Ranking</h2>
            <table className="w-full text-left bg-black bg-opacity-30 rounded-xl">
              <thead>
                <tr className="text-purple-300">
                  <th className="py-2 px-2">#</th>
                  <th className="py-2 px-2">Nombre</th>
                  <th className="py-2 px-2">Puntaje</th>
                  <th className="py-2 px-2 text-center">Avance</th>
                  <th className="py-2 px-2">Tiempo / Estado</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((p, i) => {
                  return (
                    <React.Fragment key={p.name}>
                      <tr className="border-b border-purple-700 align-top">
                        <td className="py-2 px-2 font-bold text-center">{i + 1}</td>
                        <td className="py-2 px-2 font-bold text-purple-200">{p.name}</td>
                        <td className="py-2 px-2 text-center align-middle">
                          <div className="text-green-400 font-bold text-lg">{p.score}</div>
                        </td>
                        <td className="py-2 px-2 text-center align-middle">
                          {/* Barra de avance horizontal más compacta */}
                          <div className="w-40 h-6 bg-gradient-to-r from-gray-700 via-gray-800 to-gray-900 rounded-full flex overflow-hidden mx-auto border-2 border-purple-400 shadow-inner relative">
                            {p.answerDetails.length > 0 ? (
                              p.answerDetails.map((ad, idx) => (
                                <div
                                  key={idx}
                                  className={`h-full flex-1 transition-all duration-300
                                    ${ad.status === 'correct' ? 'bg-gradient-to-b from-green-400 to-green-700 shadow-md' :
                                      ad.status === 'incorrect' ? 'bg-gradient-to-b from-red-400 to-red-700 shadow-md' :
                                      'bg-gradient-to-b from-gray-500 to-gray-700 opacity-60'}`}
                                  title={ad.status === 'unanswered' ? 'Sin responder' : ad.status === 'correct' ? 'Correcta' : 'Incorrecta'}
                                />
                              ))
                            ) : (
                              // Si no hay preguntas, barra vacía
                              <div className="h-full w-full bg-gradient-to-b from-gray-500 to-gray-700 opacity-60" />
                            )}
                            {/* Borde animado de avance */}
                            <div className="absolute left-0 top-0 h-full rounded-full pointer-events-none" style={{
                              width: `${(p.answers.length / (p.total || 1)) * 100}%`,
                              borderRight: '2.5px solid #a78bfa',
                              transition: 'width 0.3s',
                              zIndex: 2
                            }} />
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center align-middle">
                          <span className="text-yellow-300 font-bold text-lg">{p.totalTime.toFixed(1)}s</span>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {/* Botón para terminar la sesión y mostrar estadísticas totales */}
        <div className="flex flex-row justify-end mb-4 absolute right-8 top-8 z-10">
          <button
            className="bg-red-600 hover:bg-red-800 text-white font-bold py-2 px-6 rounded-xl shadow-lg text-lg transition-all"
            onClick={() => navigate('/estadisticas-totales/' + sessionId)}
          >
            Terminar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionStatsAdmin;
