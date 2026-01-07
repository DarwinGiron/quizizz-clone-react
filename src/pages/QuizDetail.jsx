import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { CheckCircle, XCircle, Users, Clock, Download } from 'lucide-react';

const QuizDetail = () => {
  const { id: quizId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('questions'); // questions, sessions, reports

  useEffect(() => {
    const fetchQuizAndSessions = async () => {
      if (!quizId) return;
      setLoading(true);
      try {
        const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
        if (quizDoc.exists()) {
          setQuiz({ id: quizDoc.id, ...quizDoc.data() });
        } else {
          throw new Error('La evaluación no fue encontrada.');
        }

        const sessionsQuery = query(collection(db, 'sessions'), where('quizId', '==', quizId));
        const sessionsSnapshot = await getDocs(sessionsQuery);
        setSessions(sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizAndSessions();
  }, [quizId]);

  const aggregatedReport = useMemo(() => {
    if (!quiz || sessions.length === 0) {
      return { totalParticipants: 0, averageScore: 0, questionPerformance: [] };
    }

    let totalParticipants = 0;
    let totalPercentageSum = 0;
    const questionStats = quiz.questions.map(() => ({ correct: 0, total: 0 }));
    const totalPossiblePoints = quiz.questions.reduce((sum, q) => sum + (q.puntos || 1), 0);

    sessions.forEach(session => {
      const participants = session.participants || {};
      Object.values(participants).forEach(p => {
        totalParticipants++;
        let userScore = 0;
        quiz.questions.forEach((q, qIdx) => {
          const answer = p.answers?.[qIdx];
          if (answer !== undefined) {
            questionStats[qIdx].total++;
            if (answer === q.correctAnswer) {
              questionStats[qIdx].correct++;
              userScore += q.puntos || 1;
            }
          }
        });
        if(totalPossiblePoints > 0) totalPercentageSum += (userScore / totalPossiblePoints) * 100;
      });
    });

    const averageScore = totalParticipants > 0 ? totalPercentageSum / totalParticipants : 0;
    const questionPerformance = quiz.questions.map((q, qIdx) => ({
      question: q.question,
      performance: questionStats[qIdx].total > 0 ? (questionStats[qIdx].correct / questionStats[qIdx].total) * 100 : 0,
    }));

    return { totalParticipants, averageScore, questionPerformance };
  }, [quiz, sessions]);

  const handleDownloadAggregatedCSV = () => {
    const headers = ['Pregunta', 'Porcentaje de Acierto (%)'];
    const rows = aggregatedReport.questionPerformance.map(q => {
      const escapedQuestion = q.question.replace(/"/g, '""'); // CORRECTO: Escapa comillas dobles para CSV
      return `"${escapedQuestion}",${q.performance.toFixed(2)}`;
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([ "\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `informe_agregado_${quiz.title.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const TabButton = ({ tabName, label, count }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 ${ 
        activeTab === tabName 
        ? 'border-b-2 border-accent text-accent' 
        : 'text-text-muted hover:text-text-primary'
      }`}>
      {label} {count !== undefined ? `(${count})` : ''}
    </button>
  );

  if (loading) return <div className="text-center p-10 text-text-muted">Cargando detalles...</div>;
  if (error) return <div className="text-center p-10 text-red-500">Error: {error}</div>;
  if (!quiz) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 text-text-primary">
      <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
      <p className="text-text-muted mb-6">ID: {quiz.id}</p>

      <div className="border-b border-border-secondary mb-6">
        <TabButton tabName="questions" label="Preguntas" count={quiz.questions?.length || 0} />
        <TabButton tabName="sessions" label="Sesiones" count={sessions.length} />
        <TabButton tabName="reports" label="Informes" />
      </div>

      <div>
        {activeTab === 'questions' && (
          <div className="space-y-6">
            {quiz.questions.map((q, qIdx) => (
              <div key={qIdx} className="bg-secondary border border-border rounded-lg p-5">
                <p className="font-bold text-lg mb-4">{qIdx + 1}. {q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className={`flex items-center gap-3 p-3 rounded-lg border-2 ${q.correctAnswer === oIdx ? 'border-green-500/50 bg-green-500/10' : 'border-transparent'}`}>
                      {q.correctAnswer === oIdx ? <CheckCircle className="text-green-500" /> : <XCircle className="text-gray-400" />}
                      <span className="flex-1">{opt}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sessions' && (
           <div className="space-y-4">
            {sessions.length > 0 ? (
              sessions.map(session => (
                <div key={session.id} className="bg-secondary border border-border rounded-lg p-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold">Sesión del {new Date(session.startTime.seconds * 1000).toLocaleString()}</p>
                     <div className="flex items-center gap-4 text-sm text-text-muted mt-1">
                        <span className="flex items-center gap-1.5"><Users size={14}/> {Object.keys(session.participants || {}).length} Participantes</span>
                        <span className="flex items-center gap-1.5"><Clock size={14}/> {session.status}</span>
                    </div>
                  </div>
                  <Link to={`/session-report/${session.id}`} className="bg-accent text-accent-text font-bold py-2 px-4 rounded-lg hover:bg-accent-strong transition-colors">
                    Ver Informe
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-10 px-6 bg-secondary rounded-lg border-dashed border-border">
                  <h3 className="text-lg font-semibold">No hay sesiones</h3>
                  <p className="text-text-muted mt-1">Aún no se ha realizado ninguna sesión en vivo con esta evaluación.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
            <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
                    <div className="bg-secondary p-4 rounded-lg border border-border"><p className="text-2xl font-bold">{sessions.length}</p><p className="text-sm text-text-muted">Sesiones Totales</p></div>
                    <div className="bg-secondary p-4 rounded-lg border border-border"><p className="text-2xl font-bold">{aggregatedReport.totalParticipants}</p><p className="text-sm text-text-muted">Participaciones Totales</p></div>
                    <div className="bg-secondary p-4 rounded-lg border border-border"><p className="text-2xl font-bold">{aggregatedReport.averageScore.toFixed(2)}%</p><p className="text-sm text-text-muted">Nota Promedio General</p></div>
                </div>

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Rendimiento por Pregunta</h2>
                    <button onClick={handleDownloadAggregatedCSV} disabled={aggregatedReport.questionPerformance.length === 0} className="flex items-center gap-2 text-sm bg-accent text-accent-text font-bold py-2 px-3 rounded-lg hover:bg-accent-strong transition-colors disabled:opacity-50"><Download size={16}/>Descargar CSV</button>
                </div>
                
                <div className="bg-secondary border border-border rounded-xl p-4 space-y-3">
                {aggregatedReport.questionPerformance.length > 0 ? aggregatedReport.questionPerformance.map((q, index) => (
                    <div key={index}>
                        <div className="flex justify-between items-center mb-1">
                            <p className="text-sm font-medium text-text-secondary truncate pr-4">{index + 1}. {q.question}</p>
                            <p className="text-sm font-bold">{q.performance.toFixed(1)}%</p>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5"><div className="bg-accent h-2.5 rounded-full" style={{ width: `${q.performance}%` }}></div></div>
                    </div>
                )) : <p className="text-center text-text-muted py-6">No hay datos suficientes para generar un informe.</p>}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default QuizDetail;
