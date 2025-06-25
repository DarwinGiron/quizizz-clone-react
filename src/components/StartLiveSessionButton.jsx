// src/components/StartLiveSessionButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set } from 'firebase/database'; // Import ref and set from Realtime Database
import { rtdb } from '../firebase/config'; // Import rtdb

const StartLiveSessionButton = ({ quizId }) => {
  const navigate = useNavigate();

  const startSession = async () => {
    const joinCode = Math.floor(100000 + Math.random() * 900000); // Generate numerical join code
    const sessionId = `${quizId}-${Date.now()}`; // Generate a unique session ID

    // Save session data to Realtime Database
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    await set(sessionRef, {
      quizId: quizId,
      joinCode: joinCode, // Save joinCode as a number
      status: 'waiting', // Initial status
      createdAt: Date.now(), // Use timestamp
    }); // Note: We are primarily using RTDB for live session data

    navigate(`/live/${quizId}/${sessionId}`); // Navigate using quizId and the generated sessionId
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
