import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref as rtdbRef, push, get } from 'firebase/database';
// We remove Firestore imports as we are using mock data now
// import { collection, query, where, getDocs } from 'firebase/firestore'; 
import { rtdb } from '../firebase/config';

// Import the mock user data
import mockUsers from '../mock_users.json';

const PersonnelCodeEntry = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [personnelCode, setPersonnelCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!personnelCode.trim()) {
      setError('Por favor, ingresa tu código de personal.');
      return;
    }
    setIsLoading(true);
    setError('');

    // Simulate a short delay to mimic a network request
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // 1. Verify if personnel code exists in the mock JSON data
      const userFound = mockUsers.find(user => user.codigo === personnelCode.trim());

      if (!userFound) {
        setError('Código de personal no encontrado. Verifica tu código e inténtalo de nuevo.');
        setIsLoading(false);
        return;
      }

      const userData = userFound;

      // 2. Check if user is already in the session (this part still uses RTDB)
      const participantsRef = rtdbRef(rtdb, `liveSessions/${sessionId}/participants`);
      const snapshot = await get(participantsRef);
      if (snapshot.exists()) {
          const participants = snapshot.val();
          const isAlreadyJoined = Object.values(participants).some(p => p.personnelCode === userData.codigo);
          if(isAlreadyJoined) {
            navigate(`/waiting/${sessionId}`);
            return;
          }
      }

      // 3. Add user to the session in Realtime Database
      await push(participantsRef, {
        name: userData.nombre,
        personnelCode: userData.codigo,
        area: userData.area,
      });

      // 4. Redirect to the waiting room
      navigate(`/waiting/${sessionId}`);

    } catch (err) {
      console.error("Error processing request:", err);
      setError('Hubo un error al procesar tu solicitud. Inténtalo de nuevo.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 font-sans" style={{background: 'linear-gradient(135deg, #4a00e0, #8e2de2)'}}>
      <div className="absolute top-5 left-5 text-2xl font-bold">W.</div>
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-4">¡Casi listo!</h1>
        <p className="text-lg text-gray-300 mb-8">Introduce tu código de personal para continuar.</p>

        <form onSubmit={handleVerifyCode} className="w-full flex flex-col items-center">
           <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Tu código de personal"
                value={personnelCode}
                onChange={(e) => setPersonnelCode(e.target.value)}
                className="w-full p-4 pr-24 text-center text-lg text-gray-800 rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-lg transition shadow-md disabled:opacity-50"
                disabled={!personnelCode.trim() || isLoading}
              >
                {isLoading ? '...' : 'Entrar'}
              </button>
           </div>
          {error && <p className="text-yellow-300 bg-red-800 bg-opacity-50 p-3 rounded-lg mt-6 text-sm">{error}</p>}
        </form>
      </div>
      <div className="absolute bottom-4 text-xs text-gray-400">
        <p>&copy; 2024 Quizizz Inc. (DBA Wayground)</p>
      </div>
    </div>
  );
};

export default PersonnelCodeEntry;
