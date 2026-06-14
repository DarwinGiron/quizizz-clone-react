// LiveSession.jsx — pantalla de host/admin para la sesión en vivo
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, set, update } from 'firebase/database';
import { rtdb, db } from '../../../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../firebase/config';
import ResponseCounter from '../components/ResponseCounter';

const LiveSession = () => {
  const { quizId, sessionId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('waiting');
  const [sessionJoinCode, setSessionJoinCode] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [localJoinCode, setLocalJoinCode] = useState(null);
  const [joinCodeTimeout, setJoinCodeTimeout] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [participantToDelete, setParticipantToDelete] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const [remoteCountdown, setRemoteCountdown] = useState(null);
  const [user, loading] = useAuthState(auth);

  const joinLink = `${window.location.origin}/join/${sessionId}`;

  useEffect(() => {
    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
    const unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      setParticipants(data ? Object.values(data) : []);
    });

    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    const unsubscribeSession = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSessionStatus(data.status || 'waiting');
        if (typeof data.joinCode !== 'undefined' && data.joinCode !== null) {
          setSessionJoinCode(data.joinCode);
          setJoinCodeTimeout(false);
        }
      }
    });

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

  useEffect(() => {
    if (!sessionJoinCode && localJoinCode) {
      setSessionJoinCode(localJoinCode);
    }
  }, [sessionJoinCode, localJoinCode]);

  const startSession = async () => {
    if (sessionStatus === 'waiting') {
      setShowCountdown(true);
      setCountdown(3);
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
          set(countdownRef, null);
          const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
          update(sessionRef, { status: 'started', quizId: quizId });
        }
      }, 1000);
    }
  };

  const handleCancelSession = async () => {
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    await update(sessionRef, { status: 'cancelled', quizId: quizId });
    navigate(-1);
  };

  const handleDeleteParticipant = async (participant) => {
    if (!participant || !sessionId) return;
    // Si el participante tiene ID único, se elimina directamente su entrada
    if (participant.id) {
      await set(ref(rtdb, `liveSessions/${sessionId}/participants/${participant.id}`), null);
      setShowDeleteModal(false);
      setParticipantToDelete(null);
      return;
    }
    // Respaldo para entradas antiguas sin ID
    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
    onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const entry = Object.entries(data).find(
          ([key, value]) =>
            value.name === participant.name &&
            (!participant.personnelCode || value.personnelCode === participant.personnelCode)
        );
        if (entry) {
          const [key] = entry;
          set(ref(rtdb, `liveSessions/${sessionId}/participants/${key}`), null);
        }
      }
    }, { onlyOnce: true });
    setShowDeleteModal(false);
    setParticipantToDelete(null);
  };

  useEffect(() => {
    if (!loading && user && sessionStatus === 'started' && (!remoteCountdown || remoteCountdown <= 0)) {
      navigate(`/admin/session/${quizId}/${sessionId}/stats`, { replace: true });
    }
  }, [sessionStatus, remoteCountdown, quizId, sessionId, navigate, user, loading]);

  // Si la sesión se finalizó o canceló, cerrar la sala del host
  useEffect(() => {
    if (sessionStatus === 'finished' || sessionStatus === 'cancelled') {
      navigate('/myquizzes', { replace: true });
    }
  }, [sessionStatus, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400" />
          <span className="text-lg font-medium text-indigo-200">Cargando sesión...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-900 to-black text-white font-sans relative overflow-hidden">
      {/* Botón regresar */}
      <button
        onClick={handleCancelSession}
        className="absolute top-4 left-4 px-4 py-2 border border-white/30 text-white rounded-lg bg-white/10 hover:bg-white/20 transition z-10 text-sm font-medium"
      >
        Regresar
      </button>

      <div className="max-w-2xl mx-auto pt-12 px-6">
        {/* Código e instrucciones */}
        <div className="border border-indigo-600/50 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center bg-black/30 backdrop-blur-md shadow-xl">
          <div className="space-y-3 text-center sm:text-left">
            <p className="uppercase text-xs text-gray-400 tracking-wider">1. Únete usando cualquier dispositivo</p>
            <p className="font-semibold text-white">{`${window.location.origin}/join`}</p>
            <p className="uppercase text-xs text-gray-400 tracking-wider">2. Introduce el código de unión</p>
            <p className="text-4xl font-bold tracking-widest text-indigo-200">
              {sessionJoinCode
                ? <span translate="no">{sessionJoinCode}</span>
                : joinCodeTimeout
                  ? <span className="text-red-400 text-lg">Error: No se pudo obtener el código. Recarga la página.</span>
                  : 'Cargando...'
              }
            </p>
          </div>

          <div className="flex flex-col items-center mt-6 sm:mt-0 gap-3">
            <div onClick={() => setShowQR(true)} className="cursor-pointer">
              <QRCodeCanvas
                value={`https://join.myquiz.com/${sessionId}`}
                size={100}
                bgColor="#FFFFFF"
                fgColor="#000000"
                className="cursor-pointer hover:scale-105 transition rounded"
              />
              <p className="text-xs text-center mt-1 text-gray-400">Escanear QR</p>
            </div>
          </div>
        </div>

        {sessionStatus === 'waiting' && (
          <div className="flex flex-col items-center mt-6">
            <button
              onClick={startSession}
              disabled={participants.length === 0}
              className={`bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg transition-shadow text-white w-full max-w-md py-3.5 rounded-full text-lg font-bold ${
                participants.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              EMPEZAR
            </button>

            <div className="mt-8 w-full text-center">
              <p className="text-2xl text-gray-400 mb-4">Esperando participantes...</p>
              {participants.length === 0 ? (
                <div className="text-gray-500 text-sm">Aún no hay participantes en la sala.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                  {participants.map((p, i) => (
                    <div
                      key={i}
                      className="bg-indigo-700/70 rounded-2xl p-4 flex flex-col items-center gap-2 shadow-lg cursor-pointer hover:bg-indigo-600/80 transition"
                      onClick={() => { setShowDeleteModal(true); setParticipantToDelete(p); }}
                      title="Clic para eliminar participante"
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-500/50 flex items-center justify-center font-bold text-lg">
                        {(p.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="text-white font-semibold">{p.name || `Participante ${i + 1}`}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {sessionStatus === 'started' && (!remoteCountdown || remoteCountdown <= 0) && quizQuestions.length > 0 && (
          <div className="mt-8 text-center">
            <h3 className="text-2xl font-bold mb-4 animate-bounce">Pregunta en vivo</h3>
            <div className="bg-indigo-800/80 rounded-xl p-6 text-xl text-white text-center mb-6 min-h-[80px] flex items-center justify-center">
              {quizQuestions[0].text || quizQuestions[0].pregunta || 'Pregunta'}
            </div>
            <ResponseCounter sessionId={sessionId} currentQuestionIndex={0} question={quizQuestions[0]} />
          </div>
        )}
      </div>

      {/* Modal QR grande */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={(e) => { if (e.target === e.currentTarget) setShowQR(false); }}
        >
          <div className="relative bg-white p-6 rounded-xl shadow-2xl">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-lg"
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

      {/* Modal eliminar participante */}
      {showDeleteModal && participantToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center max-w-sm w-full mx-4">
            <h2 className="text-xl font-bold text-red-600 mb-3">¿Eliminar participante?</h2>
            <p className="mb-6 text-gray-700 text-center">
              ¿Seguro que deseas eliminar a <span className="font-semibold">{participantToDelete.name}</span> de la sesión?
            </p>
            <div className="flex gap-3 w-full">
              <button
                className="flex-1 bg-white border border-red-300 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-semibold transition-colors"
                onClick={() => handleDeleteParticipant(participantToDelete)}
              >
                Eliminar
              </button>
              <button
                className="flex-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-semibold transition-colors"
                onClick={() => { setShowDeleteModal(false); setParticipantToDelete(null); }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cuenta regresiva */}
      {((showCountdown || (remoteCountdown && remoteCountdown > 0)) && sessionStatus !== 'started') && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="flex flex-col items-center">
            <span className="text-5xl font-extrabold text-white mb-4">¡A la cuenta de!</span>
            <span className="text-[8rem] font-extrabold text-indigo-400 animate-bounce">
              {showCountdown ? countdown : remoteCountdown}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSession;
