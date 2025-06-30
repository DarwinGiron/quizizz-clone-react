import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, push, onValue, get, child } from 'firebase/database';
import { db, rtdb } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

const JoinSession = () => {
  const navigate = useNavigate();
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [sessionStatus, setSessionStatus] = useState('waiting');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [personnelCode, setPersonnelCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [step, setStep] = useState('joincode'); // 'joincode' | 'lobby'

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
    try {
      // Buscar todas las sesiones en RTDB y encontrar la que tenga joinCode igual
      const sessionsSnap = await get(ref(rtdb, 'liveSessions'));
      let foundSessionId = '';
      let foundSessionData = null;
      if (sessionsSnap.exists()) {
        sessionsSnap.forEach((childSnap) => {
          const data = childSnap.val();
          if (data.joinCode && String(data.joinCode) === String(joinCodeInput)) {
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
      setSessionStatus(foundSessionData.status || 'waiting');
      setStep('lobby');
      setIsJoining(false);
    } catch (err) {
      setError('Error buscando la sesión.');
      setIsJoining(false);
    }
  };

  // Listener para sesión y participantes SOLO si ya se encontró la sesión
  useEffect(() => {
    if (!sessionId) return;
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSessionData(data);
        setSessionStatus(data.status || 'waiting');
      } else {
        setSessionStatus('ended');
        setSessionData(null);
      }
    });
    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
    const unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];
      setParticipants(list);
    });
    return () => {
      unsubscribe();
      unsubscribeParticipants();
    };
  }, [sessionId]);

  // Listener para la pregunta actual (si se implementa gamificación)
  useEffect(() => {
    if (!sessionId || !rtdb) return;
    const currentQuestionRef = ref(rtdb, `liveSessions/${sessionId}/currentQuestion`);
    const unsubscribeQuestion = onValue(currentQuestionRef, (snapshot) => {
      const questionData = snapshot.val();
      if (questionData) {
        setCurrentQuestion(questionData);
      } else {
        setCurrentQuestion(null);
      }
    });
    return () => {
      unsubscribeQuestion();
    };
  }, [sessionId, rtdb]);

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

  // Unirse a la sesión (lobby)
  const handleJoinSession = async (e) => {
    e.preventDefault();
    setError('');
    if (!personnelCode.trim()) {
      setError('Debes ingresar tu código de trabajador.');
      return;
    }
    setIsJoining(true);
    try {
      // Validar código de trabajador en cuadrilla
      const nombre = await validatePersonnelCode(personnelCode.trim());
      if (!nombre) {
        setError('Código de trabajador no válido. Consulta a tu supervisor.');
        setIsJoining(false);
        return;
      }
      setParticipantName(nombre);
      // Registrar participante en RTDB
      const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
      await push(participantsRef, {
        name: nombre,
        personnelCode: personnelCode.trim(),
      });
      setIsJoining(false);
    } catch (error) {
      setError('Error al unirse a la sesión.');
      setIsJoining(false);
    }
  };

  // Paso 1: Ingresar código de acceso
  if (step === 'joincode') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-gray-800">
          <h1 className="text-2xl font-bold text-center text-purple-700 mb-6">Unirse a una Sesión</h1>
          <form onSubmit={handleFindSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código de Acceso:</label>
              <input
                type="number"
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                required
                disabled={isJoining}
              />
            </div>
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow transition"
              disabled={isJoining}
            >
              {isJoining ? 'Buscando...' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Paso 2: Lobby y formulario de trabajador
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-gray-800">
        <h1 className="text-3xl font-bold text-center text-purple-700 mb-6">Unirse a la Sesión</h1>
        {sessionStatus === 'waiting' && (
          <>
            <form onSubmit={handleJoinSession} className="space-y-4">
              <div>
                <label htmlFor="personnelCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Código de Trabajador:
                </label>
                <input
                  type="text"
                  id="personnelCode"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-800"
                  value={personnelCode}
                  onChange={(e) => setPersonnelCode(e.target.value)}
                  required
                  disabled={isJoining}
                />
              </div>
              {error && <p className="text-red-500 text-center text-sm">{error}</p>}
              <button
                type="submit"
                disabled={isJoining || !personnelCode.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? 'Uniéndose...' : 'Unirse'}
              </button>
              <p className="text-center text-gray-600 text-sm mt-4">Espera a que el anfitrión inicie la sesión.</p>
            </form>
            {/* Lista de participantes */}
            <div className="mt-8 w-full text-center">
              <p className="text-sm text-gray-400 mb-2">👥 Participantes en la sala:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {participants.map((p, i) => (
                  <div key={i} className="bg-purple-700 px-3 py-1 rounded-full text-xs text-white">
                    {p.name || `Participante ${i + 1}`}
                    {p.personnelCode && (
                      <span className="ml-2 text-purple-200">({p.personnelCode})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {sessionStatus === 'cancelled' && (
          <p className="text-center text-red-500 text-lg font-semibold mt-8">La sesión fue cancelada por el anfitrión.</p>
        )}
      </div>
    </div>
  );
};

export default JoinSession;
