import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rtdb } from '../firebase/config';
import { ref, get } from 'firebase/database';
import { query, orderByChild, equalTo } from 'firebase/database';
const JoinLandingPage = () => {
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear previous errors
    setIsLoading(true);

    try {
      const sessionsRef = ref(rtdb, `liveSessions`);
      const sessionsQuery = query(sessionsRef, orderByChild('joinCode'), equalTo(parseInt(joinCode)));
      const snapshot = await get(sessionsQuery);

      if (snapshot.exists()) {
        let sessionData = null;
        let sessionId = null;

        // Iterar sobre el snapshot (debería haber solo un resultado con equalTo)
        snapshot.forEach(childSnapshot => {
          sessionId = childSnapshot.key; // Get the key of the matching session node
          sessionData = childSnapshot.val(); // Get the session data
        });

        console.log('Session ID found:', sessionId);
        console.log('Session status:', sessionData ? sessionData.status : 'No data');

        // **VERIFICAR EL ESTADO DE LA SESIÓN**
        if (sessionData && sessionData.status === 'waiting') {
          navigate(`/join/${sessionId}`);
        } else {
          // La sesión existe pero no está en estado "waiting"
          setError('La sesión no está disponible para unirse en este momento.');
        }

      } else {
        setError('Código de acceso incorrecto. Verifica el código e inténtalo de nuevo.'); // Código no encontrado
      }
    } catch (err) {
      console.error("Error al verificar el código de sesión:", err);
      setError('Hubo un error al intentar unirte. Inténtalo de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-gray-800">
        <h1 className="text-2xl font-bold text-center text-purple-700 mb-6">Ingresa el Código de Sesión</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="joinCodeInput" className="block text-sm font-medium text-gray-700 mb-1">
              Código de Acceso:
            </label>
            <input
              type="number"
              id="joinCodeInput"
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-800"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-red-500 text-center text-sm mt-2">{error}</p>}
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!joinCode.trim() || isLoading}

          >
            Unirse
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinLandingPage;