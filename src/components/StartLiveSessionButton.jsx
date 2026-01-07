import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set } from 'firebase/database';
import { rtdb } from '../firebase/config';

const StartLiveSessionButton = ({ quizId }) => {
  const navigate = useNavigate();

  const startSession = async () => {
    // The join code IS the session ID.
    const sessionId = String(Math.floor(100000 + Math.random() * 900000));

    // The path in the database will be based on this unique ID.
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    
    await set(sessionRef, {
      quizId: quizId,
      joinCode: sessionId, // The join code is the same as the session ID
      status: 'waiting',
      createdAt: Date.now(),
    });

    // Navigate the host to the live session page using the new session ID.
    navigate(`/live/${quizId}/${sessionId}`);
  };

  return (
    <button
      onClick={startSession}
      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm font-semibold shadow"
    >
      ▶ Iniciar sesión en vivo
    </button>
  );
};

export default StartLiveSessionButton;
