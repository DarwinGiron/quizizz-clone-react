import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, push, onValue, get } from 'firebase/database';
import { db, rtdb } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import QuestionCard from '../components/QuestionCard';

const JoinSession = () => {
  const navigate = useNavigate();
  // Estados principales
  const [step, setStep] = useState('joincode'); // joincode | register | lobby | quiz | finished
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participant, setParticipant] = useState({ name: '', type: '', personnelCode: '' });
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  // Estados para feedback de respuesta (deben estar al tope)
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctIndex, setCorrectIndex] = useState(null);
  // Estado para cuenta regresiva en participantes
  const [remoteCountdown, setRemoteCountdown] = useState(null);
  // Estado para tiempo de inicio de la pregunta
  const [questionStart, setQuestionStart] = useState(Date.now());

  // Ocultar sidebar/layout: body fondo oscuro y sin padding
  useEffect(() => {
    document.body.classList.add('bg-black');
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.classList.remove('bg-black');
      document.body.style.overflow = '';
    };
  }, []);

  // Buscar sesión por joinCode
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
          if (
            dbCode &&
            dbCode === inputCode &&
            (data.status === 'waiting' || data.status === 'started')
          ) {
            foundSessionId = childSnap.key;
            foundSessionData = data;
          }
        });
      }
      if (!foundSessionId) {
        setError('No se encontró ninguna sesión activa con ese código.');
        setIsJoining(false);
        return;
      }
      setSessionId(foundSessionId);
      setSessionData(foundSessionData);
      setStep('register');
      setIsJoining(false);
    } catch (err) {
      setError('Error buscando la sesión.');
      setIsJoining(false);
    }
  };

  // Listener para sesión y participantes
  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      setSessionData(data);
      // Solo pasar a quiz si la sesión está iniciada y la cuenta regresiva terminó
      if (data && data.status === 'started' && (!remoteCountdown || remoteCountdown <= 0)) {
        if (step === 'lobby') setStep('quiz');
      }
      if (!data) {
        setSessionData(null);
      }
    });
    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
    const unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      setParticipants(data ? Object.values(data) : []);
    });
    return () => {
      unsubscribe();
      unsubscribeParticipants();
    };
  }, [sessionId, step, remoteCountdown]);

  // Escuchar la cuenta regresiva desde RTDB (para espectadores)
  useEffect(() => {
    if (!sessionId) return;
    const countdownRef = ref(rtdb, `liveSessions/${sessionId}/countdown`);
    const unsubscribe = onValue(countdownRef, (snapshot) => {
      setRemoteCountdown(snapshot.val());
    });
    return () => unsubscribe();
  }, [sessionId]);

  // Validar código de trabajador contra cuadrilla
  const validatePersonnelCode = async (code) => {
    const q = query(collection(db, 'cuadrilla'), where('codigo', '==', code));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const miembro = snap.docs[0].data();
      return miembro.nombre;
    }
    return null;
  };

  // Registrar participante
  const handleRegisterParticipant = async (e) => {
    e.preventDefault();
    setError('');
    setIsJoining(true);
    let nombre = '';
    let tipo = '';
    let code = '';
    // Si el valor es numérico y tiene longitud >= 4, se asume código de trabajador
    if (/^\d{4,}$/.test(participant.name.trim())) {
      nombre = await validatePersonnelCode(participant.name.trim());
      if (nombre) {
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
    setParticipant({ name: nombre, type: tipo, personnelCode: code });
    // Registrar en RTDB
    await push(ref(rtdb, `liveSessions/${sessionId}/participants`), {
      name: nombre,
      type: tipo,
      personnelCode: code,
    });
    setStep('lobby');
    setIsJoining(false);
  };

  // Cargar preguntas cuando la sesión inicie
  useEffect(() => {
    const cargarPreguntas = async () => {
      if (step === 'quiz' && sessionData?.quizId) {
        const quizDocRef = doc(db, 'quizzes', sessionData.quizId);
        const quizDocSnap = await getDoc(quizDocRef);
        if (quizDocSnap.exists() && quizDocSnap.data().questions) {
          setQuizQuestions(quizDocSnap.data().questions);
          setCurrentIndex(0);
          setAnswers([]);
        }
      }
    };
    cargarPreguntas();
  }, [step, sessionData]);

  // Resetear feedback al cambiar de pregunta
  useEffect(() => {
    setSelected(null);
    setShowFeedback(false);
    if (quizQuestions.length > 0 && currentIndex < quizQuestions.length) {
      const q = quizQuestions[currentIndex];
      setCorrectIndex(typeof q.correct === 'number' ? q.correct : (q.correct ? q.correct : 0));
      setQuestionStart(Date.now()); // Reiniciar tiempo de inicio aquí
    }
  }, [currentIndex, quizQuestions]);

  // Paso 1: Ingresar código de acceso
  if (step === 'joincode') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4">
        <div className="bg-white bg-opacity-10 rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center backdrop-blur-md border border-purple-400">
          <h1 className="text-3xl font-extrabold text-purple-300 mb-2 tracking-wide text-center">¡Únete a la partida!</h1>
          <p className="text-md text-purple-100 mb-6 text-center">Ingresa el código de acceso que te dio el anfitrión</p>
          <form onSubmit={handleFindSession} className="w-full flex flex-col gap-4 items-center">
            <input
              type="number"
              className="w-full px-6 py-3 text-2xl rounded-xl border-2 border-purple-400 bg-black bg-opacity-30 text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-purple-300"
              placeholder="Código de acceso"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              required
              disabled={isJoining}
              autoFocus
            />
            {error && <p className="text-red-400 text-center text-base">{error}</p>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg text-xl transition-all"
              disabled={isJoining}
            >
              {isJoining ? 'Buscando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Paso 2: Registro de participante
  if (step === 'register') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4">
        <div className="bg-white bg-opacity-10 rounded-2xl shadow-2xl p-8 w-full max-w-md flex flex-col items-center backdrop-blur-md border border-purple-400">
          <h2 className="text-2xl font-bold text-purple-200 mb-2 text-center">¿Cómo te llamas?</h2>
          <form
            onSubmit={handleRegisterParticipant}
            className="w-full flex flex-col gap-4 items-center"
          >
            <input
              type="text"
              className="w-full px-6 py-3 text-2xl rounded-xl border-2 border-purple-400 bg-black bg-opacity-30 text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-purple-300"
              placeholder="Tu nombre (si eres trabajador, ingresa tu código)"
              value={participant.name}
              onChange={e => setParticipant({ ...participant, name: e.target.value, personnelCode: '' })}
              required
              autoFocus
            />
            {error && <p className="text-red-400 text-center text-base">{error}</p>}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 text-white font-bold py-3 px-6 rounded-xl shadow-lg text-xl transition-all"
              disabled={isJoining}
            >
              {isJoining ? 'Registrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Paso 3: Lobby de espera
  if (step === 'lobby') {
    const puedeEmpezar = sessionData?.status === 'started';
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4">
        <div className="bg-white bg-opacity-10 rounded-2xl shadow-2xl p-8 w-full max-w-lg flex flex-col items-center backdrop-blur-md border border-purple-400">
          <h2 className="text-3xl font-extrabold text-purple-200 mb-4 text-center">¡Bienvenido, {participant.name}!</h2>
          <div className="w-full flex flex-col items-center mb-6">
            <p className="text-lg text-purple-100 mb-2">
              {puedeEmpezar ? '¡El anfitrión ha iniciado la evaluación! Espera un momento...' : 'Esperando a que el anfitrión empiece...'}
            </p>
            <div className="flex flex-row gap-2 mt-2">
              <span className="bg-purple-700 px-4 py-2 rounded-full text-lg font-bold tracking-widest text-white shadow">{sessionData?.joinCode}</span>
            </div>
          </div>
        </div>
        {(remoteCountdown && remoteCountdown > 0) && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 animate-fadeIn">
            <div className="flex flex-col items-center">
              <span className="text-6xl font-extrabold text-white animate-pulse mb-4">¡A la cuenta de!</span>
              <span className="text-[8rem] font-extrabold text-purple-400 animate-bounce">{remoteCountdown}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Paso 4: Quiz a ritmo del estudiante
  if (step === 'quiz' && quizQuestions.length > 0 && currentIndex < quizQuestions.length) {
    const handleAnswer = (i) => {
      if (selected !== null) return;
      setSelected(i);
      setShowFeedback(true);
      // Calcular tiempo de respuesta
      const answerTime = (Date.now() - questionStart) / 1000;
      setTimeout(() => {
        setShowFeedback(false);
        setSelected(null);
        if (currentIndex + 1 === quizQuestions.length) {
          setStep('finished');
        } else {
          setCurrentIndex(currentIndex + 1);
        }
      }, 2000);
      const newAnswers = [...answers];
      newAnswers[currentIndex] = { answer: i, time: answerTime };
      setAnswers(newAnswers);
      // Guardar en Firebase
      if (sessionId && participant.name) {
        const answersRef = ref(rtdb, `liveSessions/${sessionId}/answers/${participant.name}`);
        // Guardar el array completo de respuestas del participante
        // (esto permite que el admin vea el avance en tiempo real)
        import('firebase/database').then(({ set }) => {
          set(answersRef, newAnswers);
        });
      }
    };
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4">
        <div className="bg-white bg-opacity-10 rounded-2xl shadow-2xl p-8 w-full max-w-2xl flex flex-col items-center backdrop-blur-md border border-purple-400 animate-fadeIn">
          <h2 className="text-2xl font-bold text-purple-200 mb-4 text-center animate-bounce">Pregunta {currentIndex + 1} de {quizQuestions.length}</h2>
          <div className="w-full mb-6">
            <div className="bg-purple-800 rounded-xl p-6 text-xl text-white text-center mb-4 min-h-[80px] flex items-center justify-center animate-fadeInDown">
              {q.text || q.pregunta || 'Pregunta'}
            </div>
          </div>
          <div className="mt-6 w-full flex flex-col gap-4">
            {q.options.map((opt, i) => {
              let btnClass = 'w-full py-3 rounded-xl text-lg font-semibold shadow transition-all border-2 border-purple-400 bg-black bg-opacity-40 animate-fadeInUp';
              if (showFeedback && selected !== null) {
                if (i === correctIndex) btnClass += ' bg-green-600 text-white';
                else if (i === selected) btnClass += ' bg-red-600 text-white';
                else btnClass += ' text-purple-100 opacity-60';
              } else if (selected === i) {
                btnClass += ' bg-purple-700 text-white';
              } else {
                btnClass += ' hover:bg-purple-600 text-purple-100';
              }
              return (
                <button
                  key={i}
                  className={btnClass}
                  onClick={() => handleAnswer(i)}
                  disabled={selected !== null}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Paso 5: Finalizado
  if (step === 'finished') {
    // Página de estadísticas totales
    // Calcular estadísticas del participante
    const total = quizQuestions.length;
    const correct = answers.filter(a => a && typeof a.answer !== 'undefined' && quizQuestions[answers.indexOf(a)]?.correct === a.answer).length;
    const incorrect = answers.filter(a => a && typeof a.answer !== 'undefined' && quizQuestions[answers.indexOf(a)]?.correct !== a.answer).length;
    const precision = total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0';
    const totalTime = answers.reduce((acc, a) => acc + (a && a.time ? a.time : 0), 0).toFixed(1);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4">
        <div className="bg-white bg-opacity-10 rounded-2xl shadow-2xl p-8 w-full max-w-lg flex flex-col items-center backdrop-blur-md border border-purple-400">
          <h2 className="text-3xl font-extrabold text-purple-200 mb-4 text-center">¡Examen finalizado!</h2>
          <p className="text-lg text-purple-100 mb-6">Gracias por participar, {participant.name}.</p>
          <div className="w-full flex flex-col items-center gap-2 mt-4">
            <div className="text-xl font-bold text-blue-300">Tus estadísticas</div>
            <div className="flex flex-row gap-6 mt-2">
              <div className="flex flex-col items-center">
                <span className="text-green-400 font-bold text-2xl">{correct}</span>
                <span className="text-xs text-gray-200">Correctas</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-red-400 font-bold text-2xl">{incorrect}</span>
                <span className="text-xs text-gray-200">Incorrectas</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-blue-400 font-bold text-2xl">{precision}%</span>
                <span className="text-xs text-gray-200">Precisión</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-yellow-300 font-bold text-2xl">{totalTime}s</span>
                <span className="text-xs text-gray-200">Tiempo total</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default JoinSession;
