import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '../firebase/config';
import './WaitingRoom.css';

const WaitingRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [sessionStatus, setSessionStatus] = useState('waiting');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);

    const listener = onValue(sessionRef, (snapshot) => {
      const sessionData = snapshot.val();
      if (sessionData) {
        setSessionStatus(sessionData.status);
        setJoinCode(sessionData.joinCode); // Assuming joinCode is stored in the session data
        if (sessionData.participants) {
          setParticipants(Object.values(sessionData.participants));
        }

        if (sessionData.status === 'started') {
          navigate(`/quiz/${sessionData.quizId}/${sessionId}`);
        }
      }
    });

    return () => {
      off(sessionRef, 'value', listener);
    };
  }, [sessionId, navigate]);

  return (
    <div className="waiting-room-container">
      <div className="waiting-room-header">
        <p>Código de la sesión:</p>
        <h1 className="join-code-display">{joinCode}</h1>
        <h2>Esperando a que el anfitrión inicie la sesión...</h2>
      </div>
      <div className="participants-grid">
        {participants.map((participant, index) => (
          <div key={index} className="participant-card">
            {participant.name}
          </div>
        ))}
      </div>
      <div className="waiting-room-footer">
        <p>{participants.length} participante(s) unido(s)</p>
      </div>
    </div>
  );
};

export default WaitingRoom;
