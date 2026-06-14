import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, push, onValue, get, set } from 'firebase/database';
import { db, rtdb } from '../../../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import confetti from '../../../utils/confetti';

const JoinSession = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(() => localStorage.getItem('quizizz_step') || 'joincode');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('quizizz_sessionId') || '');
  const [sessionData, setSessionData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participant, setParticipant] = useState(() => {
    try {
      const saved = localStorage.getItem('quizizz_participant');
      return saved ? JSON.parse(saved) : { name: '', type: '', personnelCode: '' };
    } catch {
      return { name: '', type: '', personnelCode: '' };
    }
  });

  const hashString = (text) =>
    String(text || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctIndex, setCorrectIndex] = useState(null);
  const [remoteCountdown, setRemoteCountdown] = useState(null);
  const [questionStart, setQuestionStart] = useState(Date.now());
  const [score, setScore] = useState(null);
  const [showScore, setShowScore] = useState(false);
  const answeredRef = useRef(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackHover, setFeedbackHover] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [roomClosed, setRoomClosed] = useState(false);

  useEffect(() => {
    if (['joincode', 'register', 'lobby', 'quiz'].includes(step)) {
      localStorage.setItem('quizizz_step', step);
    } else if (step === 'finished') {
      localStorage.removeItem('quizizz_step');
      localStorage.removeItem('quizizz_sessionId');
      localStorage.removeItem('quizizz_participant');
      localStorage.removeItem('quizizz_currentIndex');
      localStorage.removeItem('quizizz_answers');
    }
  }, [step]);

  useEffect(() => {
    document.body.classList.add('bg-black', 'join-immersive');
    return () => {
      document.body.classList.remove('bg-black', 'join-immersive');
      document.body.style.overflow = '';
    };
  }, []);

  // Permitir desplazamiento cuando el contenido es largo (pantalla de resultados);
  // en las demás pantallas inmersivas se mantiene fijo.
  useEffect(() => {
    document.body.style.overflow = step === 'finished' ? 'auto' : 'hidden';
  }, [step]);

  const handleFindSession = async (e) => {
    e.preventDefault();
    setError('');
    setIsJoining(true);
    const inputCode = String(joinCodeInput).trim();
    if (!inputCode) {
      setError('Debes ingresar un código de acceso válido.');
      setIsJoining(false);
      return;
    }
    try {
      const sessionsSnap = await get(ref(rtdb, 'liveSessions'));
      let foundSessionId = null;
      let foundSessionData = null;
      if (sessionsSnap.exists()) {
        sessionsSnap.forEach((childSnap) => {
          const data = childSnap.val();
          const dbCode = String(data.joinCode).trim();
          if (dbCode && dbCode === inputCode && (data.status === 'waiting' || data.status === 'started')) {
            foundSessionId = childSnap.key;
            foundSessionData = data;
          }
        });
      }
      if (!foundSessionId) {
        setError('No se encontró ninguna sesión activa con ese código. La sesión puede haber finalizado o sido cancelada.');
        setIsJoining(false);
        return;
      }
      setSessionId(foundSessionId);
      setSessionData(foundSessionData);
      setStep('register');
      setCurrentIndex(0);
      setAnswers([]);
      localStorage.removeItem('quizizz_currentIndex');
      localStorage.removeItem('quizizz_answers');
      localStorage.setItem('quizizz_sessionId', foundSessionId);
      setIsJoining(false);
    } catch (err) {
      setError('Error buscando la sesión.');
      setIsJoining(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      setSessionData(data);

      if (data && data.status === 'started' && step === 'lobby' && (!remoteCountdown || remoteCountdown <= 0)) {
        setCurrentIndex(0);
        setAnswers([]);
        setStep('quiz');
      }
      // La sala se cerró (anfitrión terminó/canceló, o se eliminó la sesión):
      // sacar al participante que aún está en lobby o respondiendo.
      const closed = !data || data.status === 'finished' || data.status === 'cancelled';
      if (closed && (step === 'lobby' || step === 'quiz')) {
        setRoomClosed(true);
      }
      if (!data) setSessionData(null);
    });
    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
    const unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      setParticipants(data ? Object.values(data) : []);
    });
    return () => { unsubscribe(); unsubscribeParticipants(); };
  }, [sessionId, step, remoteCountdown]);

  useEffect(() => {
    if (!sessionId) return;
    const countdownRef = ref(rtdb, `liveSessions/${sessionId}/countdown`);
    const unsubscribe = onValue(countdownRef, (snapshot) => {
      setRemoteCountdown(snapshot.val());
    });
    return () => unsubscribe();
  }, [sessionId]);

  const validatePersonnelCode = async (code) => {
    const q = query(collection(db, 'cuadrilla'), where('codigo', '==', code));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const miembro = snap.docs[0].data();
      return { nombre: miembro.nombre, area: miembro.area || '' };
    }
    return null;
  };

  const handleRegisterParticipant = async (e) => {
    e.preventDefault();
    setError('');
    setIsJoining(true);

    // Verificar que la sesión no haya terminado ni sido cancelada
    const sessionSnap = await get(ref(rtdb, `liveSessions/${sessionId}`));
    const currentStatus = sessionSnap.val()?.status;
    if (currentStatus === 'finished' || currentStatus === 'cancelled') {
      setError('Esta sesión ya ha finalizado. No es posible registrarse.');
      setIsJoining(false);
      return;
    }

    let nombre = '';
    let tipo = '';
    let code = '';
    let cargo = '';
    if (/^\d{4,}$/.test(participant.name.trim())) {
      const miembro = await validatePersonnelCode(participant.name.trim());
      if (miembro) {
        nombre = miembro.nombre;
        cargo = miembro.area || '';
        tipo = 'trabajador';
        code = participant.name.trim();
      } else {
        setError('Código de trabajador no válido. Consulta a tu supervisor.');
        setIsJoining(false);
        return;
      }
    } else {
      nombre = participant.name.trim();
      tipo = 'casual';
      code = '';
    }
    // Cada ingreso es independiente: se permiten varios registros con el mismo
    // código, pero cada uno recibe un ID único para que sus respuestas y
    // resultados NO se mezclen entre sí (otra oportunidad = nuevos resultados).
    const participantId = `${code || 'cas'}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const participanteObj = { id: participantId, name: nombre, type: tipo, personnelCode: code, cargo };
    setParticipant(participanteObj);
    localStorage.setItem('quizizz_participant', JSON.stringify(participanteObj));
    await set(ref(rtdb, `liveSessions/${sessionId}/participants/${participantId}`), participanteObj);
    setStep('lobby');
    setIsJoining(false);
  };

  const handleSubmitFeedback = async () => {
    setFeedbackSending(true);
    try {
      const feedbackRef = ref(rtdb, `liveSessions/${sessionId}/feedback`);
      await push(feedbackRef, {
        name: participant.name,
        personnelCode: participant.personnelCode || null,
        cargo: participant.cargo || null,
        rating: feedbackRating || 0,
        comment: feedbackComment.trim(),
        submittedAt: Date.now(),
      });
      setFeedbackSent(true);
    } catch (err) {
      console.error('Error enviando feedback:', err);
    } finally {
      setFeedbackSending(false);
    }
  };

  const handleRestartQuiz = () => {
    setStep('register');
    setParticipant({ name: '', type: '', personnelCode: '' });
    setAnswers([]);
    setCurrentIndex(0);
    setSelected(null);
    setShowFeedback(false);
    setCorrectIndex(null);
    setScore(null);
    setShowScore(false);
    localStorage.removeItem('quizizz_currentIndex');
    localStorage.removeItem('quizizz_answers');
  };

  useEffect(() => {
    const cargarPreguntas = async () => {
      if ((step === 'quiz' || step === 'finished') && sessionData?.quizId) {
        const quizDocRef = doc(db, 'quizzes', sessionData.quizId);
        const quizDocSnap = await getDoc(quizDocRef);
        if (quizDocSnap.exists() && quizDocSnap.data().questions) {
          const questions = quizDocSnap.data().questions;
          setQuizQuestions(questions);
          if (step === 'quiz') {
            setCurrentIndex(0);
            setAnswers([]);
            localStorage.removeItem('quizizz_currentIndex');
            localStorage.removeItem('quizizz_answers');
          }
        } else {
          console.error('[Debug] No se encontró el documento del quiz o no tiene preguntas.');
        }
      }
    };
    cargarPreguntas();
  }, [step, sessionData?.quizId]);

  // Reseteo SOLO al cambiar de pregunta (no debe depender de `answers`,
  // de lo contrario se desbloquean los botones al responder)
  useEffect(() => {
    answeredRef.current = false;
    setSelected(null);
    setShowFeedback(false);
    if (quizQuestions.length > 0 && currentIndex < quizQuestions.length) {
      const q = quizQuestions[currentIndex];
      setCorrectIndex(typeof q.correctAnswer === 'number' ? q.correctAnswer : 0);
      setQuestionStart(Date.now());
    }
  }, [currentIndex, quizQuestions, step]);

  // Persistencia de progreso en localStorage
  useEffect(() => {
    if (step === 'quiz' && currentIndex > 0) localStorage.setItem('quizizz_currentIndex', currentIndex);
    if (step === 'quiz' && answers.length > 0) localStorage.setItem('quizizz_answers', JSON.stringify(answers));
  }, [currentIndex, answers, step]);

  // ── Estilos compartidos para las pantallas inmersivas ──
  const screenBg = 'flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 to-black text-white font-sans p-4';
  const cardBase = 'bg-white/10 rounded-2xl shadow-2xl p-8 w-full flex flex-col items-center backdrop-blur-md border border-indigo-400/40';
  const inputBase = 'w-full px-6 py-3 text-2xl rounded-xl border-2 border-indigo-400 bg-black/30 text-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-indigo-300';
  const primaryBtn = 'w-full bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg text-xl transition-all';

  // Sala cerrada por el anfitrión
  if (roomClosed) {
    const exitRoom = () => {
      setRoomClosed(false);
      setSessionId('');
      setSessionData(null);
      setParticipant({ name: '', type: '', personnelCode: '' });
      setAnswers([]);
      setCurrentIndex(0);
      localStorage.removeItem('quizizz_step');
      localStorage.removeItem('quizizz_sessionId');
      localStorage.removeItem('quizizz_participant');
      localStorage.removeItem('quizizz_currentIndex');
      localStorage.removeItem('quizizz_answers');
      setStep('joincode');
    };
    return (
      <div className={screenBg}>
        <div className={`${cardBase} max-w-md text-center`}>
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-extrabold text-indigo-200 mb-2">La sesión ha finalizado</h2>
          <p className="text-indigo-100 mb-6">El anfitrión cerró la sala. ¡Gracias por participar!</p>
          <button onClick={exitRoom} className={primaryBtn}>Salir</button>
        </div>
      </div>
    );
  }

  // Paso 1: Código de acceso
  if (step === 'joincode') {
    return (
      <div className={screenBg}>
        <div className={`${cardBase} max-w-md`}>
          <h1 className="text-3xl font-extrabold text-indigo-300 mb-2 tracking-wide text-center">¡Únete a la partida!</h1>
          <p className="text-indigo-100 mb-6 text-center">Ingresa el código de acceso que te dio el anfitrión</p>
          <form onSubmit={handleFindSession} className="w-full flex flex-col gap-4 items-center">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className={inputBase}
              placeholder="Código de acceso"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.replace(/\D/g, ''))}
              required
              disabled={isJoining}
              autoFocus
            />
            {error && <p className="text-red-400 text-center text-sm">{error}</p>}
            <button type="submit" className={primaryBtn} disabled={isJoining}>
              {isJoining ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Buscando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Paso 2: Registro
  if (step === 'register') {
    return (
      <div className={screenBg}>
        <div className={`${cardBase} max-w-md`}>
          <h2 className="text-2xl font-bold text-indigo-200 mb-2 text-center">¿Cómo te llamas?</h2>
          <form onSubmit={handleRegisterParticipant} className="w-full flex flex-col gap-4 items-center">
            <input
              type="text"
              className={inputBase}
              placeholder="Tu nombre o código de trabajador"
              value={participant.name}
              onChange={(e) => setParticipant({ ...participant, name: e.target.value, personnelCode: '' })}
              required
              autoFocus
            />
            {error && <p className="text-red-400 text-center text-sm">{error}</p>}
            <button type="submit" className={primaryBtn} disabled={isJoining}>
              {isJoining ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Registrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Paso 3: Lobby
  if (step === 'lobby') {
    return (
      <div className={screenBg}>
        <button
          onClick={() => { setStep('joincode'); setSessionId(''); setSessionData(null); setError(''); localStorage.removeItem('quizizz_sessionId'); }}
          className="absolute top-4 left-4 px-4 py-2 border border-white/30 text-white rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-medium"
        >
          ← Regresar
        </button>
        <div className={`${cardBase} max-w-lg`}>
          <h2 className="text-3xl font-extrabold text-indigo-200 mb-4 text-center">¡Bienvenido, {participant.name}!</h2>
          <div className="w-full flex flex-col items-center mb-6">
            <p className="text-indigo-100 mb-3 text-center">
              {sessionData?.status === 'started'
                ? '¡El anfitrión ha iniciado la evaluación! Prepárate...'
                : 'Esperando a que el anfitrión empiece...'}
            </p>
            <span className="bg-indigo-700/80 px-4 py-2 rounded-full text-lg font-bold tracking-widest text-white shadow">
              {sessionData?.joinCode}
            </span>
          </div>
          <div className="w-full">
            <h3 className="text-sm text-indigo-300 mb-3 text-center font-medium uppercase tracking-wider">Participantes en la sala</h3>
            {participants.length === 0 ? (
              <div className="text-gray-400 text-center text-sm">Nadie se ha unido aún</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {participants.map((p, i) => (
                  <div key={i} className="bg-indigo-700/70 rounded-2xl p-3 flex items-center gap-3 shadow">
                    <div className="w-9 h-9 rounded-full bg-indigo-500/50 flex items-center justify-center font-bold text-base shrink-0">
                      {(p.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{p.name || `Participante ${i + 1}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {remoteCountdown !== null && remoteCountdown > 0 && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
            <div className="flex flex-col items-center">
              <span className="text-5xl font-extrabold text-white mb-4">¡A la cuenta de!</span>
              <span className="text-[8rem] font-extrabold text-indigo-400 animate-bounce">{remoteCountdown}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Paso 4: Quiz
  if (step === 'quiz' && quizQuestions.length > 0 && currentIndex < quizQuestions.length) {
    const q = quizQuestions[currentIndex];
    const currentScore = answers.reduce((acc, a) => acc + (a?.score || 0), 0);

    const handleAnswer = (i) => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      setSelected(i);
      setShowFeedback(true);
      const answerTime = (Date.now() - questionStart) / 1000;
      let puntos = 0;
      const tiempoLimite = 30;
      if (i === correctIndex) {
        if (answerTime <= tiempoLimite) {
          puntos = Math.round(600 + ((tiempoLimite - answerTime) / tiempoLimite) * 600);
        } else {
          puntos = 600;
        }
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.7 } });
      }
      setScore(puntos);
      setShowScore(true);
      setTimeout(() => {
        setShowFeedback(false);
        setSelected(null);
        setShowScore(false);
        if (currentIndex + 1 === quizQuestions.length) {
          setStep('finished');
        } else {
          setCurrentIndex(currentIndex + 1);
        }
      }, 3000);
      const newAnswers = [...answers];
      newAnswers[currentIndex] = { answer: i, time: answerTime, score: puntos, correct: i === correctIndex, question: q.question || '' };
      setAnswers(newAnswers);
      if (sessionId && participant.id) {
        const answersRef = ref(rtdb, `liveSessions/${sessionId}/answers/${participant.id}`);
        import('firebase/database').then(({ set }) => { set(answersRef, newAnswers); });
      }
    };

    const ranking = participants.map((p) => {
      const userAnswers = p.id === participant.id ? answers : [];
      const answeredCount = userAnswers.filter((a) => a && typeof a.answer !== 'undefined').length;
      const sc = userAnswers.reduce((acc, a) => acc + (a && a.score ? a.score : 0), 0);
      return { id: p.id, name: p.name, answeredCount, score: sc };
    }).sort((a, b) => b.answeredCount - a.answeredCount || b.score - a.score);
    const myRank = ranking.findIndex((r) => r.id === participant.id) + 1;

    const formatOrdinal = (n) => {
      if (n <= 0) return n;
      const s = ['to', 'ro', 'do', 'ro', 'to', 'to', 'to', 'mo', 'vo', 'no'];
      const last = n % 10;
      const lastTwo = n % 100;
      if (lastTwo >= 11 && lastTwo <= 13) return `${n}vo.`;
      return `${n}${s[last]}.`;
    };

    return (
      <div className={screenBg}>
        <div className="fixed top-4 left-4 bg-black/50 rounded-full px-4 py-2 shadow-lg z-20">
          <span className="text-sm font-bold text-white">
            Posición: <span className="text-green-300">{formatOrdinal(myRank)}</span>
          </span>
        </div>

        <div className={`${cardBase} max-w-2xl`}>
          <div className="w-full mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-indigo-200 mb-1">
                Pregunta {currentIndex + 1} de {quizQuestions.length}
              </h2>
              <p className="text-sm text-gray-400">Responde con atención.</p>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Puntaje acumulado</div>
              <div className="text-2xl font-bold text-yellow-300">{currentScore}</div>
            </div>
          </div>

          <div className="w-full mb-6">
            <div className="bg-indigo-800/80 rounded-xl p-6 text-xl text-white text-center min-h-[80px] flex items-center justify-center">
              {q.question || 'Pregunta'}
            </div>
          </div>

          <div className={`w-full flex flex-col gap-3 ${selected !== null ? 'pointer-events-none' : ''}`}>
            {showScore && (
              <div className="text-3xl font-extrabold text-green-300 text-center animate-bounce mb-1">
                +{score} puntos
              </div>
            )}
            {q.options && q.options.length > 0 ? (
              q.options.map((opt, i) => {
                const answered = selected !== null;
                let btnClass = 'w-full py-3 rounded-xl text-lg font-semibold shadow transition-all border-2 border-indigo-400/50 bg-black/40';
                if (showFeedback && selected !== null) {
                  if (i === correctIndex) btnClass += ' !bg-green-600 !border-green-500 text-white';
                  else if (i === selected) btnClass += ' !bg-red-600 !border-red-500 text-white';
                  else btnClass += ' text-indigo-200 opacity-50';
                } else if (selected === i) {
                  btnClass += ' bg-indigo-700 text-white';
                } else {
                  btnClass += ' hover:bg-indigo-600/60 text-indigo-100';
                }
                if (answered) btnClass += ' cursor-not-allowed';
                return (
                  <button key={i} className={btnClass} onClick={() => handleAnswer(i)} disabled={answered}>
                    {opt}
                  </button>
                );
              })
            ) : (
              <div className="text-red-300 text-center text-sm">No hay opciones configuradas para esta pregunta.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Paso 5: Finalizado
  if (step === 'finished') {
    const total = quizQuestions.length;
    const correct = answers.filter((a) => a?.correct).length;
    const incorrect = answers.filter((a) => a && a.correct === false).length;
    const precision = total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0';
    const totalTime = answers.reduce((acc, a) => acc + (a?.time || 0), 0).toFixed(1);

    return (
      <div className={screenBg}>
        <button
          onClick={() => setStep('joincode')}
          className="absolute top-4 left-4 px-4 py-2 border border-white/30 text-white rounded-lg bg-white/10 hover:bg-white/20 transition text-sm font-medium"
        >
          ← Regresar
        </button>
        <div className={`${cardBase} max-w-2xl`}>
          <h2 className="text-3xl font-extrabold text-indigo-200 mb-3 text-center">¡Examen finalizado!</h2>
          <p className="text-indigo-100 mb-6 text-center">Gracias por participar, {participant.name}.</p>

          <div className="w-full">
            <div className="text-center text-indigo-300 font-semibold mb-4 uppercase tracking-wider text-sm">Tus estadísticas</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: 'Correctas', value: correct, color: 'text-green-400' },
                { label: 'Incorrectas', value: incorrect, color: 'text-red-400' },
                { label: 'Precisión', value: `${precision}%`, color: 'text-indigo-300' },
                { label: 'Tiempo', value: `${totalTime}s`, color: 'text-yellow-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/10 rounded-xl p-3 text-center">
                  <div className={`font-bold text-2xl ${color}`}>{value}</div>
                  <div className="text-xs text-gray-300 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full">
            <h3 className="text-base font-bold text-indigo-300 mb-3 text-center">Resumen de tus respuestas</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {quizQuestions.map((q, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer?.correct;
                const bg = userAnswer === undefined ? 'bg-gray-900/50' : isCorrect ? 'bg-green-900/50' : 'bg-red-900/50';
                return (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${bg}`}>
                    <span className="text-white flex-1 mr-4 text-sm">{index + 1}. {q.question || 'Pregunta sin texto'}</span>
                    <span className={`font-bold text-sm shrink-0 ${
                      userAnswer === undefined ? 'text-gray-400' : isCorrect ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {userAnswer === undefined ? 'Sin responder' : isCorrect ? 'Correcta' : 'Incorrecta'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Comentario y calificación (debajo del resumen) ── */}
          <div className="w-full mt-8 pt-6 border-t border-indigo-400/30">
            {feedbackSent ? (
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="text-5xl">🎉</div>
                <h3 className="text-xl font-extrabold text-indigo-200 text-center">¡Gracias por tu opinión!</h3>
                <p className="text-indigo-100 text-center text-sm">Tu comentario ha sido enviado correctamente.</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-extrabold text-indigo-200 mb-1 text-center">¿Cómo te pareció la sesión?</h3>
                <p className="text-indigo-300 text-sm mb-5 text-center">Tu opinión es opcional pero muy valiosa.</p>

                {/* Estrellas */}
                <div className="flex gap-2 mb-4 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setFeedbackRating(star)}
                      onMouseEnter={() => setFeedbackHover(star)}
                      onMouseLeave={() => setFeedbackHover(0)}
                      className="text-4xl transition-transform hover:scale-110 focus:outline-none"
                    >
                      <span className={(feedbackHover || feedbackRating) >= star ? 'text-yellow-400' : 'text-white/20'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
                {feedbackRating > 0 && (
                  <p className="text-indigo-300 text-sm mb-4 text-center">
                    {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][feedbackRating]}
                  </p>
                )}

                {/* Cuadro de comentario */}
                <textarea
                  className="w-full px-4 py-3 rounded-xl border-2 border-indigo-400 bg-black/30 text-white placeholder-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm"
                  rows={4}
                  placeholder="Escribe tu comentario aquí (opcional)..."
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  maxLength={500}
                />
                <p className="text-xs text-indigo-400 text-right mt-1 mb-4">{feedbackComment.length}/500</p>

                {/* Botón enviar (debajo del cuadro) */}
                <button
                  onClick={handleSubmitFeedback}
                  disabled={feedbackSending}
                  className={`${primaryBtn} flex items-center justify-center gap-2`}
                >
                  {feedbackSending ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : 'Enviar comentario y calificación'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default JoinSession;
