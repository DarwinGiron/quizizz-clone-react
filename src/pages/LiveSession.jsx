import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, update } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { QRCodeCanvas } from 'qrcode.react';
import { Users, QrCode } from 'lucide-react'; // Using icons for a cleaner look

const LiveSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState('');

  const joinUrl = `${window.location.origin}/join`;

  useEffect(() => {
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);

    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSessionData(data);
        const participantsList = data.participants ? Object.values(data.participants) : [];
        setParticipants(participantsList);
      } else {
        setError('La sesión no fue encontrada o ha sido cerrada.');
        // Optional: Redirect after a delay if session is not found
        setTimeout(() => navigate('/my-quizzes'), 3000);
      }
    });

    return () => unsubscribe();
  }, [sessionId, navigate]);

  const startSession = async () => {
    if (sessionData.status === 'waiting' && participants.length > 0) {
      const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
      await update(sessionRef, { status: 'started' });
      // Navigate to the actual quiz playing screen for the host (to be created)
      // For now, we can just show a confirmation.
      console.log('Quiz started!');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-xl text-yellow-400">{error}</p>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-xl text-white animate-pulse">Cargando sala de espera...</p>
      </div>
    );
  }
  
  if (sessionData.status === 'started') {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="text-center text-white">
                <h1 className="text-4xl font-bold mb-4">¡El quiz ha comenzado!</h1>
                <p>La vista de presentación del quiz aún está en desarrollo.</p>
                <button onClick={() => navigate('/my-quizzes')} className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
                    Volver a Mis Quizzes
                </button>
            </div>
        </div>
      )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans" style={{background: 'linear-gradient(135deg, #1e0a4f, #4a00e0)'}}>
      {/* --- Header --- */}
      <header className="flex justify-between items-center p-4 md:p-6">
        <span className="text-2xl font-bold">W.</span>
        <button
          onClick={() => navigate('/my-quizzes')}
          className="px-4 py-2 border border-white/50 text-white rounded-lg bg-white/10 hover:bg-white/20 transition text-sm"
        >
          Salir de la sesión
        </button>
      </header>

      {/* --- Main Content --- */}
      <main className="flex-grow flex flex-col items-center justify-center text-center p-4">
        <div className="mb-8">
            <p className="text-gray-300 text-lg">Únete en <span className="font-bold text-white">{joinUrl.replace(/^https?:\/\//, '')}</span></p>
            <p className="text-gray-300 text-lg">con el código de acceso:</p>
        </div>
        
        <div className="text-6xl md:text-8xl font-bold tracking-widest text-white mb-8">
          {sessionData.joinCode}
        </div>

        <button onClick={() => setShowQR(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-lg transition">
            <QrCode size={20} />
            <span>Mostrar QR</span>
        </button>
      </main>

      {/* --- Footer with Participants & Start Button --- */}
      <footer className="p-4 md:p-6 flex flex-col items-center w-full">
          <div className="w-full max-w-4xl">
              <div className="flex items-center gap-2 text-gray-300 mb-3">
                  <Users size={20}/>
                  <h2 className="font-semibold">{participants.length} participante(s)</h2>
              </div>
              <div className="h-20 w-full bg-black/30 rounded-lg p-2 flex flex-wrap gap-2 items-start overflow-y-auto">
                  {participants.length === 0 ? (
                      <span className="text-gray-400 italic p-2">Esperando a que se unan los participantes...</span>
                  ) : (
                      participants.map((p, i) => (
                          <span key={i} className="bg-purple-600 px-3 py-1 rounded-full text-sm font-medium animate-fade-in">
                              {p.name || `Participante ${i + 1}`}
                          </span>
                      ))
                  )}
              </div>
          </div>

        <button
          onClick={startSession}
          disabled={participants.length === 0}
          className="w-full max-w-4xl mt-4 bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg text-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
        >
          EMPEZAR
        </button>
      </footer>

      {/* --- QR Code Modal --- */}
      {showQR && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setShowQR(false)}>
          <div className="bg-white p-6 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
            <QRCodeCanvas value={joinUrl} size={256} />
            <p className="text-center text-black font-bold text-2xl mt-4">{sessionData.joinCode}</p>
            <p className="text-center text-gray-600 mt-1">{joinUrl}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSession;
