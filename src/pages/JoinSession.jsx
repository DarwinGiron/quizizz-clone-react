import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, push, onValue, get } from 'firebase/database';
import { rtdb } from '../firebase/config'; // Asegúrate de que rtdb se exporte como la instancia de Realtime Database

const JoinSession = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [participantName, setParticipantName] = useState('');
  const [sessionStatus, setSessionStatus] = useState('waiting'); // 'waiting', 'started', 'finished', 'ended'
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [personnelCode, setPersonnelCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [error, setError] = useState('');
  const [sessionData, setSessionData] = useState(null);

  // Función para manejar errores de forma centralizada
  const handleError = (errorMessage, consoleError) => {
    console.error(consoleError);
    setError(errorMessage);
    setIsJoining(false); // Asegurarse de resetear isJoining si es un error al unirse
  };

  useEffect(() => {
    console.log('useEffect running', { roomCode, rtdb });
    const sessionRef = ref(rtdb, `liveSessions/${roomCode}`);
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log('JoinSession listener - status:', data.status); // Added console.log
        setSessionData(data); // Guardar todos los datos de la sesión
        setSessionStatus(data.status || 'waiting'); // Actualizar estado
      } else {
        // Si el nodo de la sesión desaparece, asumimos que terminó
        setSessionStatus('ended');
        setSessionData(null); // Limpiar datos de la sesión
      }
    }, (error) => { // Añadir manejo de errores al listener
      handleError("Hubo un error al cargar la sesión. Inténtalo de nuevo.", "Error fetching session data:");
      setSessionStatus('ended'); // Asumir que la sesión terminó o no es accesible
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode, rtdb]); // Dependencias del efecto

  // Listener separado para la pregunta actual
  useEffect(() => {
    if (roomCode && rtdb) {
      // Escuchar cambios en el nodo 'currentQuestion' dentro de la sesión solo si la sesión está iniciada
      const currentQuestionRef = ref(rtdb, `liveSessions/${roomCode}/currentQuestion`);
      const unsubscribeQuestion = onValue(currentQuestionRef, (snapshot) => {
        const questionData = snapshot.val();
        if (questionData) {
          setCurrentQuestion(questionData);
        } else {
          setCurrentQuestion(null); // No hay pregunta activa
        }
      }, (error) => { // Añadir manejo de errores al listener
        handleError("Hubo un error al cargar la pregunta actual.", "Error fetching current question:");
      });

      return () => {
        unsubscribeQuestion();
      };
    }
  }, [roomCode, rtdb]); // Dependencias del efecto

  const handleJoinSession = async (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    if (participantName.trim() === '' || joinCodeInput.trim() === '') {
        setError('Por favor, completa todos los campos requeridos.');
        return;
    }
    if (sessionStatus === 'started' || sessionStatus === 'ended') {
      alert('La sesión ya ha comenzado o terminado.');
      return;
    }
    setIsJoining(true);
    setError(''); // Limpiar errores anteriores
    try {
      // Obtener los datos de la sesión una vez para validar el join code
      const sessionSnapshot = await get(ref(rtdb, `liveSessions/${roomCode}`));
      const sessionData = sessionSnapshot.val();

      if (!sessionSnapshot.exists() || !sessionData) {
        setError('La sesión no existe.');
        setSessionStatus('ended'); // Asegurar que el estado cambie si la sesión no existe
        setIsJoining(false);
        return;
      }
      if (parseInt(joinCodeInput) === sessionData.joinCode) {
        const participantsRef = ref(rtdb, `liveSessions/${roomCode}/participants`);
        await push(participantsRef, {
          name: participantName.trim(), // Nombre del participante
          personnelCode: personnelCode.trim(), // Código del personal
        });
        console.log('Unido a la sala');
        // Considerar redirigir o cambiar estado para mostrar la sesión iniciada
      } else {
        setError('Código de acceso incorrecto.');
      }
    } catch (error) {
      handleError('Hubo un error al unirte a la sala. Inténtalo de nuevo.', 'Error al unirse a la sala:');
    }
    setIsJoining(false); // Asegurarse de resetear isJoining incluso en caso de error
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-black text-white font-sans p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md text-gray-800">
        <h1 className="text-3xl font-bold text-center text-purple-700 mb-6">Unirse a la Sesión</h1>
        {/* Ya no mostramos el roomCode aquí, ya que el usuario lo ingresará */}
        {/* <p className="text-center text-gray-600 mb-6">Código de Sala: <span className="font-mono text-lg font-semibold">{roomCode}</span></p> */}

        {sessionStatus === 'waiting' && (
          <form onSubmit={handleJoinSession} className="space-y-4">

            {/* Campo Código de Acceso */}
            <div>
              <label htmlFor="joinCode" className="block text-sm font-medium text-gray-700 mb-1">
                Código de Acceso:
              </label>
              <input
                type="number" // Usar tipo 'number' para el código numérico
                id="joinCode"
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                required // Hacer este campo obligatorio
                disabled={isJoining}
              />
            </div>

            {/* Campo Tu Nombre */}
            <div>
              <label htmlFor="participantName" className="block text-sm font-medium text-gray-700 mb-1">
                Tu Nombre:
              </label>
              <input
                type="text"
                id="participantName"
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-800"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                required // Hacer este campo obligatorio
                disabled={isJoining}
              />
            </div>

            {/* Campo Código de Personal */}
            <div>
              <label htmlFor="personnelCode" className="block text-sm font-medium text-gray-700 mb-1">
                Código de Personal (Opcional):
              </label>
              <input
                type="text" // O 'number' si es numérico y quieres restringir
                id="personnelCode"
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-gray-800"
                value={personnelCode}
                onChange={(e) => setPersonnelCode(e.target.value)}
                disabled={isJoining} // Deshabilitar mientras se une
             />
            </div>

            {/* Mensaje de error */}
            {error && <p className="text-red-500 text-center text-sm">{error}</p>}

            {/* Botón Unirse */}
            <button
              type="submit" // Cambiar a type="submit" para usar el form
              disabled={isJoining || participantName.trim() === '' || joinCodeInput.trim() === ''} // Deshabilitar si falta info o uniendo
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isJoining ? 'Uniéndose...' : 'Unirse'}
            </button>

            <p className="text-center text-gray-600 text-sm mt-4">Espera a que el anfitrión inicie la sesión.</p>
          </form>
        )}

        {/* Renderizar la pregunta actual */}
        {sessionStatus === 'started' && currentQuestion && (
          <div className="mt-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-purple-700">{currentQuestion.question}</h3>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                // Aquí podrías añadir lógica para seleccionar una respuesta
                // Por ahora, solo mostramos las opciones
                <button
                  key={index}
                  className="w-full text-left px-4 py-3 rounded-md shadow-sm border border-gray-300 bg-gray-100 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  // onClick={() => handleAnswer(index)} // Implementar función handleAnswer
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje cuando la sesión ha terminado */}
        {sessionStatus === 'ended' && (
          <p className="text-center text-red-500 text-lg font-semibold mt-8">La sesión ha terminado.</p>
        )}
      </div>
    </div>
  )

}
export default JoinSession;
