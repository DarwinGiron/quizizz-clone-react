import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, push, onValue, get } from 'firebase/database';
import { db, rtdb } from '../../../firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { QuestionCard } from '../components';
import { Avatar3D, DEFAULT_AVATAR_CONFIG, AVATAR_COLORS, AVATAR_STYLES, AVATAR_ACCESSORIES } from '../../../shared/components/Avatar';
import confetti from '../../../utils/confetti';

const JoinSession = () => {
  const navigate = useNavigate();
  // Estados principales
  const [step, setStep] = useState(() => localStorage.getItem('quizizz_step') || 'joincode');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('quizizz_sessionId') || '');
  const [sessionData, setSessionData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participant, setParticipant] = useState(() => {
    try {
      const saved = localStorage.getItem('quizizz_participant');
      return saved
        ? JSON.parse(saved)
        : { name: '', type: '', personnelCode: '', avatarConfig: DEFAULT_AVATAR_CONFIG };
    } catch {
      return { name: '', type: '', personnelCode: '', avatarConfig: DEFAULT_AVATAR_CONFIG };
    }
  });

  const hashString = (text) => {
    return String(text || '')
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  };

  const getAvatarConfigForParticipant = (participantData) => {
    const name = participantData?.name || participantData?.personnelCode || 'Invitado';
    const seed = Math.abs(hashString(name));
    const styles = Object.values(AVATAR_STYLES);
    const style = styles[seed % styles.length];
    const skin = AVATAR_COLORS.skin[seed % AVATAR_COLORS.skin.length];
    const hair = AVATAR_COLORS.hair[seed % AVATAR_COLORS.hair.length];
    const clothes = AVATAR_COLORS.clothes[seed % AVATAR_COLORS.clothes.length];
    const accessory = AVATAR_ACCESSORIES[seed % AVATAR_ACCESSORIES.length].id;

    return {
      ...DEFAULT_AVATAR_CONFIG,
      style: style.id,
      skinColor: skin,
      hairColor: hair,
      clothesColor: clothes,
      shoesColor: '#333333',
      accessory,
    };
  };
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(() => {
    // Siempre empezar desde 0 para nuevas sesiones
    return 0;
  });
  const [answers, setAnswers] = useState(() => {
    // Siempre empezar con respuestas vacías para nuevas sesiones
    return [];
  });
  // Estados para feedback de respuesta (deben estar al tope)
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [correctIndex, setCorrectIndex] = useState(null);
  // Estado para cuenta regresiva en participantes
  const [remoteCountdown, setRemoteCountdown] = useState(null);
  // Estado para simular cuenta regresiva cuando se une a media partida
  const [simulatedCountdown, setSimulatedCountdown] = useState(null);
  const [showSimulatedCountdown, setShowSimulatedCountdown] = useState(false);
  // Estado para tiempo de inicio de la pregunta
  const [questionStart, setQuestionStart] = useState(Date.now());
  // Estado para puntaje y confeti
  const [score, setScore] = useState(null);
  const [showScore, setShowScore] = useState(false);

  // Hook centralizado para manejar la persistencia del paso (step)
  useEffect(() => {
    if (['joincode', 'register', 'lobby', 'quiz'].includes(step)) {
      localStorage.setItem('quizizz_step', step);
    } else if (step === 'finished') {
      // Limpiar todo al finalizar
      localStorage.removeItem('quizizz_step');
      localStorage.removeItem('quizizz_sessionId');
      localStorage.removeItem('quizizz_participant');
      localStorage.removeItem('quizizz_currentIndex');
      localStorage.removeItem('quizizz_answers');
    }
  }, [step]);

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
      // Limpiar progreso anterior y persistir nueva sesión
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

  // Listener para sesión y participantes
  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      setSessionData(data);
      
      // Si la sesión ya está iniciada y el participante está en lobby, iniciar cuenta regresiva simulada
      if (data && data.status === 'started' && step === 'lobby' && !showSimulatedCountdown && simulatedCountdown === null) {
        // Simular cuenta regresiva de 3 segundos para el participante que se une a media partida
        setShowSimulatedCountdown(true);
        setSimulatedCountdown(3);
        // Reiniciar progreso para nueva sesión
        setCurrentIndex(0);
        setAnswers([]);
        let counter = 3;
        const interval = setInterval(() => {
          counter--;
          setSimulatedCountdown(counter);
          if (counter === 0) {
            clearInterval(interval);
            setShowSimulatedCountdown(false);
            setSimulatedCountdown(null);
            setStep('quiz'); // Pasar directamente al quiz después de la cuenta regresiva
          }
        }, 1000);
      }
      // Solo pasar a quiz si la sesión está iniciada y la cuenta regresiva terminó (para casos normales)
      else if (data && data.status === 'started' && (!remoteCountdown || remoteCountdown <= 0) && !showSimulatedCountdown) {
        if (step === 'lobby') setStep('quiz');
      }
      if (!data) {
        setSessionData(null);
      }
    });
    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
    const unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      setParticipants(data ? Object.values(data).map((p) => ({
        ...p,
        avatarConfig: p.avatarConfig || getAvatarConfigForParticipant(p),
      })) : []);
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

    const avatarConfig = getAvatarConfigForParticipant({ name: nombre, type: tipo, personnelCode: code });
    const participanteObj = {
      name: nombre,
      type: tipo,
      personnelCode: code,
      avatarConfig,
    };
    setParticipant(participanteObj);
    localStorage.setItem('quizizz_participant', JSON.stringify(participanteObj));
    // Registrar en RTDB
    await push(ref(rtdb, `liveSessions/${sessionId}/participants`), participanteObj);
    setStep('lobby');
    setIsJoining(false);
  };

  // Cargar preguntas cuando la sesión inicie o se esté en la pantalla final
  useEffect(() => {
    const cargarPreguntas = async () => {
      if ((step === 'quiz' || step === 'finished') && sessionData?.quizId) {
        console.log('[Debug] Cargando preguntas para el quiz ID:', sessionData.quizId);
        const quizDocRef = doc(db, 'quizzes', sessionData.quizId);
        const quizDocSnap = await getDoc(quizDocRef);
        if (quizDocSnap.exists() && quizDocSnap.data().questions) {
          const questions = quizDocSnap.data().questions;
          console.log('[Debug] Preguntas cargadas de Firestore:', questions);
          setQuizQuestions(questions);
          // Siempre reiniciar el progreso al comenzar el quiz
          if (step === 'quiz') {
            setCurrentIndex(0);
            setAnswers([]);
            // Limpiar localStorage de sesiones anteriores
            localStorage.removeItem('quizizz_currentIndex');
            localStorage.removeItem('quizizz_answers');
          }
        } else {
          console.error('[Debug] No se encontró el documento del quiz o no tiene preguntas.');
        }
      }
    };
    cargarPreguntas();
  }, [step, sessionData?.quizId]); // Depender del quizId para re-ejecutar si cambia

  // Resetear feedback al cambiar de pregunta
  useEffect(() => {
    setSelected(null);
    setShowFeedback(false);
    if (quizQuestions.length > 0 && currentIndex < quizQuestions.length) {
      const q = quizQuestions[currentIndex];
      setCorrectIndex(typeof q.correctAnswer === 'number' ? q.correctAnswer : 0);
      setQuestionStart(Date.now()); // Reiniciar tiempo de inicio aquí
    }
    // Solo persistir avance si estamos en el quiz y hay progreso real
    if (step === 'quiz' && currentIndex > 0) {
      localStorage.setItem('quizizz_currentIndex', currentIndex);
    }
    if (step === 'quiz' && answers.length > 0) {
      localStorage.setItem('quizizz_answers', JSON.stringify(answers));
    }
  }, [currentIndex, quizQuestions, answers, step]);

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
          <div className="mb-6">
            <Avatar3D config={participant.avatarConfig} animation="idle" size="md" interactive={false} />
          </div>
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
              {puedeEmpezar ? '¡El anfitrión ha iniciado la evaluación! Prepárate...' : 'Esperando a que el anfitrión empiece...'}
            </p>
            <div className="flex flex-row gap-2 mt-2">
              <span className="bg-purple-700 px-4 py-2 rounded-full text-lg font-bold tracking-widest text-white shadow">{sessionData?.joinCode}</span>
            </div>
          </div>
          {/* Lista de participantes en el lobby */}
          <div className="w-full mt-4">
            <h3 className="text-md text-purple-300 mb-2 text-center">Participantes en la sala:</h3>
            {participants.length === 0 ? (
              <div className="text-gray-400 text-center">Nadie se ha unido aún</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {participants.map((p, i) => (
                  <div key={i} className="bg-purple-700/70 rounded-3xl p-4 flex items-center gap-4 shadow-lg">
                    <Avatar3D config={p.avatarConfig} animation="idle" size="sm" interactive={false} />
                    <div className="text-left">
                      <p className="font-semibold text-white">{p.name || `Participante ${i + 1}`}</p>
                      {p.personnelCode && <p className="text-sm text-gray-300">Código: {p.personnelCode}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
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
        {showSimulatedCountdown && simulatedCountdown !== null && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 animate-fadeIn">
            <div className="flex flex-col items-center">
              <span className="text-6xl font-extrabold text-white animate-pulse mb-4">¡A la cuenta de!</span>
              <span className="text-[8rem] font-extrabold text-purple-400 animate-bounce">{simulatedCountdown}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Paso 4: Quiz a ritmo del estudiante
  if (step === 'quiz' && quizQuestions.length > 0 && currentIndex < quizQuestions.length) {
    const q = quizQuestions[currentIndex];
    const handleAnswer = (i) => {
      if (selected !== null) return;
      setSelected(i);
      setShowFeedback(true);
      // Calcular tiempo de respuesta
      const answerTime = (Date.now() - questionStart) / 1000;
      // Calcular puntaje
      let puntos = 0;
      const tiempoLimite = 30;
      if (i === correctIndex) {
        if (answerTime <= tiempoLimite) {
          puntos = Math.round(600 + ((tiempoLimite - answerTime) / tiempoLimite) * 600);
        } else {
          puntos = 600;
        }
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.7 }
        });
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
      newAnswers[currentIndex] = {
        answer: i,
        time: answerTime,
        score: puntos,
        correct: i === correctIndex,
        question: q.question || '', // Corregido para usar la propiedad correcta
      };
      setAnswers(newAnswers);
      // Guardar en Firebase
      if (sessionId && participant.name) {
        const answersRef = ref(rtdb, `liveSessions/${sessionId}/answers/${participant.name}`);
        import('firebase/database').then(({ set }) => {
          set(answersRef, newAnswers);
        });
      }
    };

    // Calcular ranking local en tiempo real (por avance y puntaje)
    const ranking = participants.map(p => {
      const userAnswers = Array.isArray(p.name === participant.name ? answers : (answers[p.name] || [])) ? (p.name === participant.name ? answers : (answers[p.name] || [])) : [];
      const answeredCount = userAnswers.filter(a => a && typeof a.answer !== 'undefined').length;
      const score = userAnswers.reduce((acc, a) => acc + (a && a.score ? a.score : 0), 0);
      return {
        name: p.name,
        answeredCount,
        score,
      };
    }).sort((a, b) => b.answeredCount - a.answeredCount || b.score - a.score);
    const myRank = ranking.findIndex(r => r.name === participant.name) + 1;

    const formatOrdinal = (n) => {
      if (n <= 0) return n;
      const s = ['to', 'ro', 'do', 'ro', 'to', 'to', 'to', 'mo', 'vo', 'no'];
      const last = n % 10;
      const lastTwo = n % 100;
      if (lastTwo >= 11 && lastTwo <= 13) {
        return `${n}vo.`;
      }
      return `${n}${s[last]}.`;
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4">
        {/* Ranking en tiempo real en la esquina superior izquierda */}
        <div className="fixed top-4 left-4 bg-black bg-opacity-50 rounded-full px-4 py-2 shadow-lg z-20">
          <span className="text-lg font-bold text-white">
            Posición: <span className="text-green-300">{formatOrdinal(myRank)}</span>
          </span>
        </div>
        <div className="bg-white bg-opacity-10 rounded-2xl shadow-2xl p-8 w-full max-w-2xl flex flex-col items-center backdrop-blur-md border border-purple-400 animate-fadeIn">
          <h2 className="text-2xl font-bold text-purple-200 mb-4 text-center animate-bounce">Pregunta {currentIndex + 1} de {quizQuestions.length}</h2>
          <div className="w-full mb-6">
            <div className="bg-purple-800 rounded-xl p-6 text-xl text-white text-center mb-4 min-h-[80px] flex items-center justify-center animate-fadeInDown">
              {q.question || 'Pregunta'}
            </div>
          </div>
          <div className="mt-6 w-full flex flex-col gap-4">
            {showScore && (
              <div className="text-3xl font-extrabold text-green-300 text-center animate-bounce mb-2">
                +{score} puntos
              </div>
            )}
            {q.options && q.options.length > 0 ? q.options.map((opt, i) => {
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
            }) : <div className="text-red-300 text-center">No hay opciones configuradas para esta pregunta.</div>}
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
    const correct = answers.filter(a => a?.correct).length;
    const incorrect = answers.filter(a => a && a.correct === false).length;
    const precision = total > 0 ? ((correct / total) * 100).toFixed(1) : '0.0';
    const totalTime = answers.reduce((acc, a) => acc + (a && a.time ? a.time : 0), 0).toFixed(1);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4">
        <div className="bg-white bg-opacity-10 rounded-2xl shadow-2xl p-8 w-full max-w-2xl flex flex-col items-center backdrop-blur-md border border-purple-400">
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

          {/* Resumen de Preguntas */}
          <div className="w-full mt-8">
            <h3 className="text-xl font-bold text-purple-300 mb-4 text-center">Resumen de tus respuestas</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {quizQuestions.map((q, index) => {
                const userAnswer = answers[index];
                const isCorrect = userAnswer?.correct;
                const questionText = q.question || 'Pregunta sin texto';
                
                return (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg text-left ${isCorrect ? 'bg-green-900/50' : 'bg-red-900/50'}`}>
                    <span className="text-white flex-1 mr-4">{index + 1}. {questionText}</span>
                    {userAnswer !== undefined ? (
                      isCorrect ? (
                        <span className="text-green-300 font-bold flex-shrink-0">Correcta</span>
                      ) : (
                        <span className="text-red-300 font-bold flex-shrink-0">Incorrecta</span>
                      )
                    ) : (
                      <span className="text-gray-400 font-bold flex-shrink-0">Sin responder</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    );
  }

  return null;
};

export default JoinSession;
