import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { FaClipboardList } from 'react-icons/fa';

const SessionsPage = () => {
  const { id } = useParams(); // quiz ID
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchQuiz = async () => {
      const docRef = doc(db, 'quizzes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setQuiz({ id: docSnap.id, ...docSnap.data() });
      }
    };

    // Aquí podrías llamar a Firebase para obtener sesiones reales
    const simulatedSessions = [
      {
        id: 'session1',
        title: 'Capacitación 13 jun',
        date: '13 jun',
        precision: 96,
        participants: 12,
        createdBy: 'Sig Cogusa',
      },
      {
        id: 'session2',
        title: 'Capacitación 05 jun',
        date: '05 jun',
        precision: 90,
        participants: 8,
        createdBy: 'Sig Cogusa',
      },
    ];

    fetchQuiz();
    setSessions(simulatedSessions);
  }, [id]);

  if (!quiz) return <p className="text-center mt-10">Cargando sesiones...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">📅 Sesiones de: {quiz.title}</h2>

      {sessions.map((session) => (
        <div
          key={session.id}
          className="bg-white rounded shadow p-4 mb-4 hover:bg-gray-50 transition cursor-pointer"
          onClick={() => navigate(`/sessions/${session.id}`)}
        >
          <div className="flex justify-between items-center">
            <div>
              <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full mb-1">
                En vivo
              </span>
              <h3 className="font-semibold text-lg">{session.title}</h3>
              <p className="text-sm text-gray-500">
                🎯 {session.precision}% precisión • 👥 {session.participants} participantes
              </p>
              <p className="text-sm text-gray-400 mt-1">Organizado por {session.createdBy}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/sessions/${session.id}/report`);
              }}
              className="text-sm bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 flex items-center gap-2"
            >
              <FaClipboardList /> Ver informe completo
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SessionsPage;
