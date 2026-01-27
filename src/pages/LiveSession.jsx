import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import './LiveSession.css';

// Componente para la barra de resultados
const ResultBar = ({ option, count, total, index }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    // Corregido: Plantilla literal para la clase de color
    const barClassName = `result-bar color-${index}`;
    return (
        <div className="result-bar-wrapper">
             <span className="font-bold text-lg">{count}</span>
            <div className={barClassName} style={{ height: `${percentage}%` }}></div>
            <div className="option-label">{option.text}</div>
        </div>
    );
};

const LiveSession = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();

    const [session, setSession] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const sessionDocRef = doc(db, 'liveSessions', sessionId);
        const unsubscribe = onSnapshot(sessionDocRef, async (sessionSnap) => {
            if (!sessionSnap.exists()) {
                setError('La sesión no fue encontrada.');
                setLoading(false);
                return;
            }
            const sessionData = sessionSnap.data();
            setSession(sessionData);

            if (!quiz && sessionData.quizId) {
                const quizDocRef = doc(db, 'quizzes', sessionData.quizId);
                const quizSnap = await getDoc(quizDocRef);
                if (quizSnap.exists()) {
                    setQuiz(quizSnap.data());
                } else {
                    setError('No se pudo cargar el cuestionario.');
                }
            }
            setLoading(false);
        }, (err) => {
            console.error(err);
            setError('Error al cargar la sesión.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [sessionId, quiz]);

    const handleNextQuestion = async () => {
        if (!session || !quiz) return;
        const nextIndex = (session.currentQuestionIndex ?? -1) + 1;
        if (nextIndex < quiz.questions.length) {
            await updateDoc(doc(db, 'liveSessions', sessionId), {
                currentQuestionIndex: nextIndex
            });
        }
    };

    const handleEndQuiz = async () => {
        await updateDoc(doc(db, 'liveSessions', sessionId), {
            status: 'finished'
        });
        navigate(`/session-report/${sessionId}`);
    };

    // Memoizar el cálculo de los resultados para evitar recálculos innecesarios
    const currentQuestionResults = useMemo(() => {
        if (!session || !quiz || session.currentQuestionIndex < 0) {
            return { counts: [], total: 0 };
        }
        const question = quiz.questions[session.currentQuestionIndex];
        if (!question) return { counts: [], total: 0 };

        const counts = question.options.map((_, optionIndex) => {
            return session.responses?.filter(r => 
                r.questionIndex === session.currentQuestionIndex && r.answerIndex === optionIndex
            ).length || 0;
        });

        const total = counts.reduce((sum, count) => sum + count, 0);

        return { counts, total };
    }, [session, quiz]);

    if (loading) {
        return <div className="loading-container">Cargando sesión...</div>;
    }

    if (error) {
        return <div className="error-container">{error}</div>;
    }

    const currentQuestionIndex = session?.currentQuestionIndex ?? -1;
    const question = quiz?.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz?.questions.length - 1;

    return (
        <div className="live-session-container">
            <aside className="live-session-sidebar">
                <div className="sidebar-header">
                    <h1>{quiz?.title || 'Cargando Quiz...'}</h1>
                    {currentQuestionIndex >= 0 && (
                         <p className="text-gray-500">Pregunta {currentQuestionIndex + 1} de {quiz?.questions.length}</p>
                    )}
                </div>

                <div className="session-controls">
                     <button 
                        onClick={handleNextQuestion}
                        className="control-button next-q-button"
                        disabled={isLastQuestion || currentQuestionIndex < -1}
                    >
                        <ArrowRight size={20} />
                        {currentQuestionIndex === -1 ? 'Empezar Quiz' : 'Siguiente Pregunta'}
                    </button>
                    <button 
                        onClick={handleEndQuiz}
                        className="control-button end-q-button"
                    >
                        {isLastQuestion ? <CheckCircle size={20}/> : <XCircle size={20}/>}
                        {isLastQuestion ? 'Finalizar y ver reporte' : 'Terminar Quiz'}
                    </button>
                </div>

                <div className="participants-section">
                    <h2 className="font-bold">Participantes ({session?.participants?.length || 0})</h2>
                    <div className="participants-list">
                        {session?.participants.map(p => <div key={p.id}>{p.name}</div>)}
                    </div>
                </div>
            </aside>

            <main className="live-session-main">
                {currentQuestionIndex === -1 ? (
                    <div className="initial-prompt">
                        <h2>¡Todo listo!</h2>
                        <p>Los participantes están esperando. Haz clic en "Empezar Quiz" para lanzar la primera pregunta.</p>
                    </div>
                ) : (
                    <div className="question-display">
                        <h2 className="question-text">{question?.question}</h2>
                        <div className="results-chart">
                          {question?.options.map((option, index) => (
                              <ResultBar 
                                key={index} 
                                option={option} 
                                count={currentQuestionResults.counts[index]} 
                                total={currentQuestionResults.total} 
                                index={index} 
                              />
                          ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LiveSession;
