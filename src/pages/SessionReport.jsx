import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Download, Award, Percent, User, Hash } from 'lucide-react';

const SessionReport = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- 1. CARGA DE DATOS ---
  useEffect(() => {
    const fetchReportData = async () => {
      if (!sessionId) {
        setError('ID de sesión no proporcionado.');
        setLoading(false);
        return;
      }
      try {
        // Cargar datos de la sesión
        const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
        if (!sessionDoc.exists()) throw new Error('Sesión no encontrada.');
        const sessionData = sessionDoc.data();
        setSession(sessionData);

        // Cargar datos del quiz asociado
        const quizDoc = await getDoc(doc(db, 'quizzes', sessionData.quizId));
        if (!quizDoc.exists()) throw new Error('Evaluación asociada no encontrada.');
        setQuiz(quizDoc.data());

      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [sessionId]);

  // --- 2. CÁLCULO DE RESULTADOS ---
  const participantResults = useMemo(() => {
    if (!session || !quiz) return [];

    const totalPossiblePoints = quiz.questions.reduce((sum, q) => sum + (q.puntos || 1), 0);
    if (totalPossiblePoints === 0) return []; // Evita división por cero

    const participants = session.participants || {};

    return Object.entries(participants)
      .map(([userId, participantData]) => {
        let score = 0;
        quiz.questions.forEach((question, qIdx) => {
          const participantAnswer = participantData.answers?.[qIdx];
          if (participantAnswer !== undefined && participantAnswer === question.correctAnswer) {
            score += question.puntos || 1; // Suma los puntos de la pregunta
          }
        });

        const percentage = (score / totalPossiblePoints) * 100;

        return {
          id: userId,
          name: participantData.name || `Usuario ${userId.substring(0, 5)}...`, // Usa nombre o ID corto
          score,
          percentage: Math.round(percentage * 100) / 100, // Redondea a 2 decimales
        };
      })
      .sort((a, b) => b.score - a.score); // --- 3. ORDEN DESCENDENTE ---

  }, [session, quiz]);

  // --- 4. DESCARGA CSV ---
  const handleDownloadCSV = () => {
    const headers = ['ID de Usuario', 'Nombre', 'Puntaje', 'Nota (%)'];
    const rows = participantResults.map(p => 
      [p.id, p.name, p.score, p.percentage.toFixed(2)].join(',')
    );
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `informe_sesion_${sessionId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- RENDERIZADO ---
  if (loading) return <div className="text-center p-10 text-text-muted">Generando informe...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  if (!session || !quiz) return <div className="text-center p-10">No hay datos para mostrar.</div>;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 text-text-primary">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <p className="text-sm text-text-muted">Informe de Resultados</p>
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          <p className="text-sm text-text-muted mt-1">Sesión del: {new Date(session.startTime.seconds * 1000).toLocaleString()}</p>
        </div>
        <button 
          onClick={handleDownloadCSV} 
          disabled={participantResults.length === 0}
          className="flex items-center gap-2 bg-accent text-accent-text font-bold py-2 px-4 rounded-lg hover:bg-accent-strong transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          <Download size={18}/>
          Descargar Informe (CSV)
        </button>
      </div>

      {/* --- TABLA DE RESULTADOS --- */}
      <div className="bg-secondary border border-border rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-secondary bg-primary">
                <th className="p-4 text-sm font-semibold text-text-muted uppercase flex items-center gap-2"><Hash size={14}/> Rango</th>
                <th className="p-4 text-sm font-semibold text-text-muted uppercase flex items-center gap-2"><User size={14}/> Participante</th>
                <th className="p-4 text-sm font-semibold text-text-muted uppercase flex items-center gap-2"><Award size={14}/> Puntaje</th>
                <th className="p-4 text-sm font-semibold text-text-muted uppercase flex items-center gap-2"><Percent size={14}/> Nota Final</th>
              </tr>
            </thead>
            <tbody>
              {participantResults.length > 0 ? (
                participantResults.map((p, index) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-hover">
                    <td className="p-4 font-medium text-center">{index + 1}</td>
                    <td className="p-4 font-medium text-text-primary">{p.name}</td>
                    <td className="p-4 font-bold text-accent text-lg">{p.score}</td>
                    <td className="p-4">
                      <div className="font-bold text-lg">{p.percentage.toFixed(2)}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                         <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${p.percentage}%` }}></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center p-10 text-text-muted">
                    Aún no hay participantes en esta sesión.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SessionReport;
