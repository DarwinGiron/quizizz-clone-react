// LiveSession.jsx actualizado con Realtime Database y Firestore para cargar preguntas
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Importar useNavigate
import { ref, onValue, set, update, get } from 'firebase/database'; // Importar update y get
import { rtdb, db } from '../../../firebase/config'; // Asegúrate de exportar tu RTDB y db (Firestore) en config.js
import { doc, getDoc } from 'firebase/firestore'; // Importar doc y getDoc
import { QRCodeCanvas } from 'qrcode.react'; // Asegúrate de tener qrcode.react instalado
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase/config';
import { Avatar3D, DEFAULT_AVATAR_CONFIG, AVATAR_COLORS, AVATAR_STYLES, AVATAR_ACCESSORIES } from '../../../shared/components/Avatar';
import ResponseCounter from '../components/ResponseCounter';

const LiveSession = () => {
  const { quizId, sessionId } = useParams();
  const navigate = useNavigate(); // Inicializar useNavigate
  const [participants, setParticipants] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('waiting'); // Estado de la sesión
  const [sessionJoinCode, setSessionJoinCode] = useState(null); // Estado para el código de unión de la sesión
  const [quizQuestions, setQuizQuestions] = useState([]); // Estado para las preguntas del quiz
  const [localJoinCode, setLocalJoinCode] = useState(null);
  const [joinCodeTimeout, setJoinCodeTimeout] = useState(false);
  // Estado para el modal de eliminación
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState(null);
  // Estado para cuenta regresiva
  const [countdown, setCountdown] = useState(null);

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
  const [showCountdown, setShowCountdown] = useState(false);
  const [remoteCountdown, setRemoteCountdown] = useState(null);
  const [user, loading] = useAuthState(auth);

  const joinLink = `${window.location.origin}/join/${sessionId}`;

  useEffect(() => {
    // Listener para participantes
    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
    const unsubscribeParticipants = onValue(participantsRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setParticipants([]);
        return;
      }
      
      // Cargar avatares con soporte para Firebase
      const participantsWithAvatars = await Promise.all(
        Object.values(data).map(async (p) => {
          let avatarConfig = p.avatarConfig;
          
          // Si no tiene avatarConfig, intentar cargar desde Firebase
          if (!avatarConfig && p.userId) {
            try {
              const avatarRef = ref(rtdb, `avatars/${p.userId}`);
              const snapshot = await get(avatarRef);
              if (snapshot.exists()) {
                avatarConfig = snapshot.val();
              }
            } catch (err) {
              console.log('No se pudo cargar avatar de Firebase:', err);
            }
          }
          
          // Si aún no hay avatarConfig, generar uno
          if (!avatarConfig) {
            avatarConfig = getAvatarConfigForParticipant(p);
          }
          
          return {
            ...p,
            avatarConfig,
          };
        })
      );
      
      setParticipants(participantsWithAvatars);
    });

    // Listener para el estado general de la sesión y el joinCode
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    const unsubscribeSession = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSessionStatus(data.status || 'waiting');
        if (typeof data.joinCode !== 'undefined' && data.joinCode !== null) {
          setSessionJoinCode(data.joinCode);
          setJoinCodeTimeout(false); // Limpiar error si llega el código
        }
      }
    });

    // Escuchar la cuenta regresiva desde RTDB (para admin y espectadores)
    const countdownRef = ref(rtdb, `liveSessions/${sessionId}/countdown`);
    const unsubscribeCountdown = onValue(countdownRef, (snapshot) => {
      setRemoteCountdown(snapshot.val());
    });

    return () => {
      unsubscribeParticipants();
      unsubscribeSession();
      unsubscribeCountdown();
    };
  }, [sessionId]);

  // Timeout para mostrar error si no hay código tras 3 segundos
  useEffect(() => {
    if (!sessionJoinCode) {
      const timeout = setTimeout(() => {
        if (!sessionJoinCode) setJoinCodeTimeout(true);
      }, 3000);
      return () => clearTimeout(timeout);
    } else {
      setJoinCodeTimeout(false);
    }
  }, [sessionJoinCode]);

  // Mostrar el joinCode local solo si no hay en RTDB
  useEffect(() => {
    if (!sessionJoinCode && localJoinCode) {
      setSessionJoinCode(localJoinCode);
    }
  }, [sessionJoinCode, localJoinCode]);

  // Modificar startSession para iniciar cuenta regresiva antes de cambiar estado
  const startSession = async () => {
    if (sessionStatus === 'waiting') {
      setShowCountdown(true);
      setCountdown(3);
      // Guardar cuenta regresiva en RTDB
      const countdownRef = ref(rtdb, `liveSessions/${sessionId}/countdown`);
      let counter = 3;
      set(countdownRef, counter);
      const interval = setInterval(() => {
        counter--;
        setCountdown(counter);
        set(countdownRef, counter);
        if (counter === 0) {
          clearInterval(interval);
          setShowCountdown(false);
          set(countdownRef, null); // Limpiar countdown en RTDB
          // Cambiar el estado de la sesión en RTDB
          const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
          update(sessionRef, {
            status: 'started',
            quizId: quizId,
          });
        }
      }, 1000);
    }
  };

  const handleCancelSession = async () => {
    // Cambiar estado a cancelado en RTDB sin borrar joinCode
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    await update(sessionRef, {
      status: 'cancelled',
      quizId: quizId,
    });
    navigate(-1);
  };

  // Handler para eliminar participante
  const handleDeleteParticipant = async (participant) => {
    if (!participant || !sessionId) return;
    // Buscar el key del participante en RTDB
    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
    onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entry = Object.entries(data).find(([key, value]) => value.name === participant.name && (!participant.personnelCode || value.personnelCode === participant.personnelCode));
        if (entry) {
          const [key] = entry;
          // Eliminar el participante
          set(ref(rtdb, `liveSessions/${sessionId}/participants/${key}`), null);
        }
      }
    }, { onlyOnce: true });
    setShowDeleteModal(false);
    setParticipantToDelete(null);
  }

  // Redirección automática del admin a la página de estadísticas en tiempo real
  useEffect(() => {
    // Solo redirigir si la sesión ha comenzado, el countdown terminó y el usuario está autenticado
    if (!loading && user && sessionStatus === 'started' && (!remoteCountdown || remoteCountdown <= 0)) {
      navigate(`/admin/session/${quizId}/${sessionId}/stats`, { replace: true });
    }
  }, [sessionStatus, remoteCountdown, quizId, sessionId, navigate, user, loading]);

  // Mostrar pantalla de carga si el estado de autenticación está cargando
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-purple-800 to-black text-white">
        <span className="text-3xl font-bold animate-pulse">Cargando...</span>
      </div>
    );
  }

  // Si no hay usuario autenticado, no renderizar nada (o redirigir al login si lo prefieres)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-purple-800 to-black text-white font-sans relative overflow-hidden">
      {/* Botón Regresar en la esquina superior izquierda */}
      <button
        onClick={handleCancelSession}
        className="absolute top-4 left-4 px-4 py-2 border border-white text-white rounded-md bg-white bg-opacity-10 hover:bg-opacity-20 transition z-10"
      >
        Regresar
      </button>

      <div className="max-w-2xl mx-auto pt-12 px-6">
        {/* Encabezado de la sesión (instrucciones, código, QR) */}
        <div className="border border-purple-600 rounded-lg p-6 flex flex-col sm:flex-row justify-between items-center bg-black bg-opacity-30 backdrop-blur-md shadow-xl">
          {/* Instrucciones + Código */}
          <div className="space-y-3 text-center sm:text-left">
            <p className="uppercase text-xs text-gray-400">1. ÚNETE USANDO CUALQUIER DISPOSITIVO</p>
            <p className="font-semibold text-white text-md">{`${window.location.origin}/join`}</p>
            <p className="uppercase text-xs text-gray-400">2. INTRODUCE EL CÓDIGO DE UNIÓN</p>
            <p className="text-4xl font-bold tracking-widest">
              {sessionJoinCode
                ? <span translate="no">{sessionJoinCode}</span>
                : joinCodeTimeout
                  ? 'Error: No se pudo obtener el código. Intenta recargar.'
                  : 'Cargando...'}
            </p>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center mt-6 sm:mt-0 gap-3">
            <div onClick={() => setShowQR(true)} className="cursor-pointer">
              <QRCodeCanvas
                value={`https://join.myquiz.com/${sessionId}`}
                size={100}
                bgColor="#FFFFFF"
                fgColor="#000000"
                className="cursor-pointer hover:scale-105 transition"
                onClick={() => setShowQR(true)}
              />
              <p className="text-xs text-center mt-1">Share via QR</p>
            </div>
          </div>
        </div>

        {sessionStatus === 'waiting' && (
          <div className="flex flex-col items-center mt-6">
            {/* Botón EMPEZAR */}
            <button
              onClick={startSession}
              disabled={participants.length === 0}
              className={`bg-purple-600 hover:bg-purple-700 text-white w-full max-w-md py-3 rounded-full text-lg font-semibold shadow transition-all
                ${participants.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`
              }
            >
              EMPEZAR
            </button>

            {/* Lista de participantes */}
            <div className="mt-8 w-full text-center">
              <p className="text-3xl text-gray-400 mb-2">
                👥 Esperando a los participantes...
              </p>
              {participants.length === 0 ? (
                <div className="text-gray-300">Aún no hay participantes en la sala.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {participants.map((p, i) => {
                    const expression = ['happy', 'thinking', 'impressed', 'shocked'][i % 4];
                    return (
                      <div
                        key={i}
                        className="bg-purple-700/70 rounded-3xl p-4 flex flex-col items-center gap-3 shadow-lg cursor-pointer hover:bg-purple-600 transition hover:shadow-xl"
                        onClick={() => { setShowDeleteModal(true); setParticipantToDelete(p); }}
                        title="Eliminar participante"
                      >
                        <Avatar3D
                          config={p.avatarConfig || getAvatarConfigForParticipant(p)}
                          animation={p.animation || 'idle'}
                          expression={expression}
                          size="sm"
                          interactive={false}
                        />
                        <div className="text-white font-semibold">{p.name || `Participante ${i + 1}`}</div>
                        {p.personnelCode && <div className="text-xs text-gray-300">Cód: {p.personnelCode}</div>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visualización de la pregunta actual para el admin */}
        {sessionStatus === 'started' && (!remoteCountdown || remoteCountdown <= 0) && quizQuestions.length > 0 && (
          <div className="mt-8 text-center animate-fadeIn">
            <h3 className="text-2xl font-bold mb-4 animate-bounce">Pregunta en vivo</h3>
            <div className="bg-purple-800 rounded-xl p-6 text-xl text-white text-center mb-6 min-h-[80px] flex items-center justify-center animate-fadeInDown">
              {quizQuestions[0].text || quizQuestions[0].pregunta || 'Pregunta'}
            </div>
            <ResponseCounter sessionId={sessionId} currentQuestionIndex={0} question={quizQuestions[0]} />
          </div>
        )}
      </div>

      {/* Modal QR grande */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          onClick={e => {
            if (e.target === e.currentTarget) setShowQR(false);
          }}
        >
          <div className="relative bg-white p-4 rounded-lg shadow-lg">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-2 right-2 text-gray-700 hover:text-black text-lg"
            >
              ✖
            </button>
            <QRCodeCanvas
              value={`https://join.myquiz.com/${sessionId}`}
              size={300}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar participante */}
      {showDeleteModal && participantToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-xl flex flex-col items-center">
            <h2 className="text-xl font-bold text-red-600 mb-4">¿Eliminar participante?</h2>
            <p className="mb-6 text-gray-800">¿Seguro que deseas eliminar a <span className="font-semibold">{participantToDelete.name}</span> de la sesión?</p>
            <div className="flex gap-4">
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-bold"
                onClick={() => handleDeleteParticipant(participantToDelete)}
              >
                Eliminar
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-lg font-bold"
                onClick={() => { setShowDeleteModal(false); setParticipantToDelete(null); }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mostrar animación de cuenta regresiva sobre el contenido */}
      {((showCountdown || (remoteCountdown && remoteCountdown > 0)) && sessionStatus !== 'started') && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 animate-fadeIn">
          <div className="flex flex-col items-center">
            <span className="text-6xl font-extrabold text-white animate-pulse mb-4">¡A la cuenta de!</span>
            <span className="text-[8rem] font-extrabold text-purple-400 animate-bounce">
              {showCountdown ? countdown : remoteCountdown}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSession;
