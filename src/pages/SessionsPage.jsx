import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import { db, rtdb } from '../firebase/config';
import { Zap, Users, ShieldQuestion, DoorOpen } from 'lucide-react';

const ActiveSessionCard = ({ session, navigate }) => {
  const accentColor = 'green'; // Verde para indicar "activo"

  // Salvaguarda: No renderizar si la sesión no tiene un ID de sesión válido.
  if (!session || !session.sessionId) return null;

  return (
    <div
      key={session.sessionId}
      className={`bg-gray-900 rounded-xl p-5 transition-all duration-300 border border-gray-700/50 hover:border-${accentColor}-500/80 hover:shadow-lg hover:shadow-${accentColor}-500/10`}
    >
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`flex items-center gap-2 text-xs font-medium text-${accentColor}-400 bg-${accentColor}-900/50 rounded-full px-3 py-1`}>
              <Zap size={14} /> EN VIVO
            </span>
          </div>
          <h2 className={`text-xl font-bold text-white`}>{session.quizTitle || 'Cargando título...'}</h2>
          <p className="text-sm text-gray-400 mt-1 flex items-center gap-2">
             <ShieldQuestion size={14} /> 
             ID de la sesión: <span className='font-mono text-gray-300'>{session.accessCode}</span>
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 mt-4 sm:mt-0">
            <div className="text-center">
                <p className="text-3xl font-bold text-white">{session.participantCount || 0}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Participantes</p>
            </div>
            <button 
                className={`bg-${accentColor}-600 hover:bg-${accentColor}-700 transition-colors text-white font-bold py-3 px-5 rounded-lg flex items-center gap-2 shadow-lg shadow-${accentColor}-600/20`}
                // Acción actualizada para llevar a la sala de control
                onClick={() => navigate(`/live/${session.quizId}/${session.sessionId}`)}
            >
                <DoorOpen size={16}/>
                Administrar
            </button>
        </div>
      </div>
    </div>
  );
};

const SessionsPage = () => {
  const navigate = useNavigate();
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Apunta solo a las sesiones en vivo
    const sessionsRef = ref(rtdb, 'liveSessions');

    const unsubscribe = onValue(sessionsRef, async (snapshot) => {
      setLoading(true);
      if (!snapshot.exists()) {
        setActiveSessions([]);
        setLoading(false);
        return;
      }

      const sessionsData = snapshot.val();
      const sessionIds = Object.keys(sessionsData);

      try {
        const enrichedSessions = await Promise.all(sessionIds.map(async (sessionId) => {
          const session = sessionsData[sessionId];
          // Salvaguarda para sesiones malformadas
          if (!session || !session.quizId) return null;

          const quizDocRef = doc(db, 'quizzes', session.quizId);
          const quizDocSnap = await getDoc(quizDocRef);

          if (quizDocSnap.exists()) {
            return {
              ...session,
              sessionId: sessionId,
              quizTitle: quizDocSnap.data().title || 'Quiz sin título',
              participantCount: session.participants ? Object.keys(session.participants).length : 0,
            };
          } else {
            // Si el quiz no existe, lo marcamos para no renderizarlo
            return null;
          }
        }));

        // Filtramos cualquier sesión nula para prevenir errores de renderizado
        const validSessions = enrichedSessions.filter(Boolean);
        setActiveSessions(validSessions);

      } catch (err) {
        console.error("Error al procesar sesiones activas:", err);
        setError("No se pudieron procesar las sesiones.");
      } finally {
        setLoading(false);
      }
    }, (err) => {
        console.error("Error de Firebase RTDB:", err);
        setError("No se pudo conectar para obtener las sesiones activas.");
        setLoading(false);
    });

    // Limpieza del listener al desmontar el componente
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="text-white">Buscando sesiones activas...</div></div>;
  }

  if (error) {
    return <div className="text-center text-red-400 p-10 bg-red-900/20 rounded-lg">{error}</div>;
  }

  return (
    <div className="text-white">
      <div className="flex items-center gap-3 mb-8">
        <Zap size={36} className="text-green-400"/>
        <h1 className="text-3xl font-bold">Sesiones Activas</h1>
      </div>

      {activeSessions.length === 0 ? (
        <div className="text-center py-16 px-8 bg-gray-900 rounded-xl border border-dashed border-gray-700">
            <h3 className="text-xl font-semibold text-white">No hay sesiones en vivo en este momento</h3>
            <p className="text-gray-400 mt-2">Cuando inicies un quiz, aparecerá aquí para que puedas administrarlo.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Salvaguarda: Asegurarnos que el map no falle si activeSessions no es un array */}
          {Array.isArray(activeSessions) && activeSessions.map((session) => (
            <ActiveSessionCard key={session.sessionId} session={session} navigate={navigate} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SessionsPage;
