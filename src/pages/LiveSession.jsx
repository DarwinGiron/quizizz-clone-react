// LiveSession.jsx actualizado con Realtime Database y Firestore para cargar preguntas
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Importar useNavigate
import { ref, onValue, set } from 'firebase/database'; // Importar set
import { rtdb, db } from '../firebase/config'; // Asegúrate de exportar tu RTDB y db (Firestore) en config.js
import { doc, getDoc } from 'firebase/firestore'; // Importar doc y getDoc
import { QRCodeCanvas } from 'qrcode.react'; // Asegúrate de tener qrcode.react instalado


const LiveSession = () => {
  const { quizId, sessionId } = useParams();
  const navigate = useNavigate(); // Inicializar useNavigate
  const [participants, setParticipants] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('waiting'); // Estado de la sesión
  const [sessionJoinCode, setSessionJoinCode] = useState(null); // Estado para el código de unión de la sesión
  const [quizQuestions, setQuizQuestions] = useState([]); // Estado para las preguntas del quiz

  const joinLink = `${window.location.origin}/join/${sessionId}`;

  useEffect(() => {
    // Listener para participantes
    const participantsRef = ref(rtdb, `liveSessions/${sessionId}/participants`);
    const unsubscribeParticipants = onValue(participantsRef, (snapshot) => {
      const data = snapshot.val();
      const list = data ? Object.values(data) : [];
      setParticipants(list);
    });

    // Listener para el estado general de la sesión y el joinCode
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    const unsubscribeSession = onValue(sessionRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setSessionStatus(data.status || 'waiting'); // Default to waiting if status is not set
        setSessionJoinCode(data.joinCode || null); // Store the joinCode
      }
    });


    return () => {
      unsubscribeParticipants();
      unsubscribeSession(); // Limpiar también el listener de la sesión
    };
  }, [sessionId]);

  const startSession = async () => { // Hacer la función async
    if (sessionStatus === 'waiting') {
       // Generar el joinCode aquí si no se hizo al crear la sesión RTDB
       // const generatedJoinCode = Math.floor(100000 + Math.random() * 900000);

      // 1. Cambiar el estado de la sesión en Realtime Database
      // Asumimos que el joinCode ya fue guardado en RTDB al crear la sesión por StartLiveSessionButton
      const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
      await set(sessionRef, { // Usar set para establecer la estructura inicial si no existe
         status: 'started',
         quizId: quizId, // Guardar quizId en la sesión RTDB
         // Otros datos iniciales de la sesión
      });

      // 2. Cargar las preguntas del quiz desde Firestore
      const quizDocRef = doc(db, 'quizzes', quizId);
      const quizDocSnap = await getDoc(quizDocRef);

      if (quizDocSnap.exists() && quizDocSnap.data().questions) {
        setQuizQuestions(quizDocSnap.data().questions);
        console.log('Quiz questions loaded:', quizDocSnap.data().questions.length);
         // Aquí podrías también guardar las preguntas en RTDB si es necesario para JoinSession
         // await set(ref(rtdb, `liveSessions/${sessionId}/questions`), quizDocSnap.data().questions);

      } else {
        console.error('Quiz document not found or has no questions.');
        // Manejar error o notificar al usuario
      }

       // setSessionStatus('started'); // Esto ya lo hace el listener de la sesión al actualizar RTDB
    }
  };

  const handleCancelSession = async () => {
    // Cambiar estado a cancelado en RTDB
    const sessionRef = ref(rtdb, `liveSessions/${sessionId}`);
    await set(sessionRef, {
      status: 'cancelled',
      quizId: quizId,
    });
    navigate(-1);
  };


  return (
    <div className="h-screen w-full bg-gradient-to-br from-purple-800 to-black text-white font-sans relative overflow-hidden">
      {/* Botón Regresar en la esquina superior izquierda */}
      <button
        onClick={handleCancelSession}
        className="absolute top-4 left-4 px-4 py-2 border border-white text-white rounded-md bg-white bg-opacity-10 hover:bg-opacity-20 transition z-10"
      >
        Regresar
      </button>


      <div className="max-w-4xl mx-auto pt-12 px-6">
        {/* Encabezado de la sesión (instrucciones, código, QR) */}
        <div className="border border-purple-600 rounded-lg p-6 flex flex-col sm:flex-row justify-between items-center bg-black bg-opacity-30 backdrop-blur-md shadow-xl">
          {/* Instrucciones + Código */}
          <div className="space-y-3 text-center sm:text-left">
            <p className="uppercase text-xs text-gray-400">1. ÚNETE USANDO CUALQUIER DISPOSITIVO</p>
            <p className="font-semibold text-white text-md">{joinLink}</p>
            <p className="uppercase text-xs text-gray-400">2. INTRODUCE EL CÓDIGO DE UNIÓN</p>
            <p className="text-4xl font-bold tracking-widest">{sessionJoinCode !== null ? sessionJoinCode : 'Cargando...'}</p>
          </div>

          {/* QR */}
          <div className="flex flex-col items-center mt-6 sm:mt-0 gap-3">
            <div onClick={() => setShowQR(true)} className="cursor-pointer">
              <QRCodeCanvas
                value={`https://join.myquiz.com/${sessionId}`} // Usar el link de unión
                size={100}
                bgColor="#FFFFFF"
                fgColor="#000000"
                className="cursor-pointer hover:scale-105 transition"
                onClick={() => setShowQR(true)}
              />
              <p className="text-xs text-center mt-1">Share via QR</p>
            </div>
          </div>
        </div>

        {sessionStatus === 'waiting' && (
          <div className="flex flex-col items-center mt-6">
            {/* Botón EMPEZAR */}
            <button
              onClick={startSession}
              disabled={participants.length === 0} // Deshabilitar si no hay participantes
              className={`bg-purple-600 hover:bg-purple-700 text-white w-full max-w-md py-3 rounded-full text-lg font-semibold shadow transition-all
                ${participants.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`
              }
            >
              EMPEZAR
            </button>

            {/* Lista de participantes */}
            <div className="mt-8 w-full text-center"> {/* Ajustar estilos según sea necesario */}
               <p className="text-sm text-gray-400 mb-2">
                 👥 Esperando a los participantes...
               </p>
               <div className="flex flex-wrap justify-center gap-2">
                 {participants.map((p, i) => (
                   <div key={i} className="bg-purple-700 px-3 py-1 rounded-full text-xs text-white">
                     {p.name || `Participante ${i + 1}`}
                     {p.personnelCode && (
                       <span className="ml-2 text-purple-200">({p.personnelCode})</span>
                     )}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}


         {/* Visualización de preguntas (placeholder) */}
         {sessionStatus === 'started' && quizQuestions.length > 0 && (
            <div className="mt-8 text-center">
                <h3 className="text-2xl font-bold mb-4">¡Quiz Iniciado!</h3>
                <p>Total de preguntas cargadas: {quizQuestions.length}</p>
                 {/* Aquí iría la lógica para mostrar la pregunta actual */}
                 {/* Por ahora, solo confirmamos que se cargaron */}
            </div>
         )}


      </div>


      {/* Modal QR grande */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
          <div className="relative bg-white p-4 rounded-lg shadow-lg">
            <button
              onClick={() => setShowQR(false)}
              className="absolute top-2 right-2 text-gray-700 hover:text-black text-lg"
            >
              ✖
            </button>
            <QRCodeCanvas
              value={`https://join.myquiz.com/${sessionId}`} // Usar el link de unión
              size={300}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
             <p className="text-center text-gray-600 text-sm mt-2">{joinLink}</p> {/* Mostrar link en el modal */}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSession;
