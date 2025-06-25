// src/components/StartLiveSessionButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const StartLiveSessionButton = ({ quizId }) => {
  const navigate = useNavigate();

  const startSession = async () => {
    const joinCode = Math.floor(100000 + Math.random() * 900000).toString();

    const docRef = await addDoc(collection(db, 'sessions'), {
      quizId,
      joinCode,
      createdAt: Timestamp.now(),
      active: true
    });

    navigate(`/live/${quizId}/${docRef.id}`);
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
