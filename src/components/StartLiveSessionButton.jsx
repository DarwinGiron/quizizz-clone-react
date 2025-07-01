// src/components/StartLiveSessionButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set } from 'firebase/database'; // Import ref and set from Realtime Database
import { rtdb } from '../firebase/config'; // Import rtdb

const StartLiveSessionButton = ({ quizId }) => {
  const navigate = useNavigate();

  const startSession = async () => {
    const joinCode = Math.floor(100000 + Math.random() * 900000); // Generar código de unión
    const sessionId = `${quizId}-${Date.now()}`; // ID único

    // Guardar sesión en RTDB y esperar a que se complete antes de navegar
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    await set(sessionRef, {
      quizId: quizId,
      joinCode: joinCode,
      status: 'waiting',
      createdAt: Date.now(),
    });

    // Esperar un poco más para asegurar que RTDB propague los datos
    setTimeout(() => {
      navigate(`/live/${quizId}/${sessionId}`);
    }, 900); // 900ms para mayor robustez
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
