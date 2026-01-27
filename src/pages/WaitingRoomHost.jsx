import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Users, Wifi, ChevronRight } from 'lucide-react';
import './WaitingRoom.css'; // Importar el archivo CSS

const WaitingRoomHost = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('No se proporcionó un ID de sesión.');
      setLoading(false);
      return;
    }

    const sessionDocRef = doc(db, 'liveSessions', sessionId);

    const unsubscribe = onSnapshot(sessionDocRef, (doc) => {
      if (doc.exists()) {
        const sessionData = doc.data();
        setSession(sessionData);
        setParticipants(sessionData.participants || []);
        setError('');
      } else {
        setError('La sesión no fue encontrada. Verifica el código.');
        setSession(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error al escuchar la sesión:", err);
      setError('Hubo un problema al conectar con la sesión.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [sessionId]);

  const handleStartQuiz = async () => {
    if (!session) return;

    try {
      const sessionDocRef = doc(db, 'liveSessions', sessionId);
      await updateDoc(sessionDocRef, {
        status: 'started',
        currentQuestionIndex: 0,
      });
      navigate(`/live-session/${sessionId}`);
    } catch (error) {
      console.error("Error al iniciar el cuestionario:", error);
      setError("No se pudo iniciar el cuestionario. Por favor, inténtalo de nuevo.");
    }
  };

  if (loading) {
    return <div className="loading-container"><p>Cargando sala de espera...</p></div>;
  }

  if (error) {
    return <div className="error-container"><p>{error}</p></div>;
  }

  return (
    <div className="waiting-room-container">
      <header className="waiting-room-header">
        <button onClick={() => navigate('/my-quizzes')} className="close-button">×</button>
      </header>

      <main className="waiting-room-main">
        <p>Únete en www.quizziz.com</p>
        <h1 className="join-code-display">{session?.joinCode}</h1>

        <div className="participants-container">
          <div className="participants-header">
            <div className="participants-count">
              <Users />
              <span>{participants.length}</span>
            </div>
            <Wifi />
          </div>
          <div className="participants-grid">
            {participants.length === 0 ? (
              <p className="waiting-placeholder">Esperando a que se unan los participantes...</p>
            ) : (
              participants.map((p, i) => (
                <div key={i} className="participant-card">{p.name}</div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="waiting-room-footer">
        <button 
          onClick={handleStartQuiz}
          disabled={participants.length === 0}
          className="start-button"
        >
          Empezar
          <ChevronRight />
        </button>
      </footer>
    </div>
  );
};

export default WaitingRoomHost;
