import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, runTransaction } from 'firebase/database';
import { dbRealtime } from '../firebase/config';

const JoinSession = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const sessionRef = ref(dbRealtime, `sessions/${roomCode}`);

    runTransaction(sessionRef, (session) => {
      if (session) {
        if (!session.participants) session.participants = 0;
        session.participants++;
      }
      return session;
    }).then(() => {
      // Después de unirse, podrías redirigir al jugador a la vista del juego
      console.log('Unido a la sala');
    }).catch((error) => {
      console.error('Error al unirse a la sala:', error);
    });
  }, [roomCode]);

  return (
    <div className="flex flex-col justify-center items-center min-h-[60vh] text-center">
      <h1 className="text-2xl font-bold text-green-600 mb-4">Te has unido a la sala {roomCode}</h1>
      <p className="text-lg text-gray-700">Espera a que el anfitrión inicie la capacitación.</p>
    </div>
  );
};

export default JoinSession;
