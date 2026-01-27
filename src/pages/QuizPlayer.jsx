import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/config';
import './QuizPlayer.css';

const QuizPlayer = () => {
    const { sessionId, participantId } = useParams(); // Capturar participantId
    const [session, setSession] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [answerSubmitted, setAnswerSubmitted] = useState(false);

    useEffect(() => {
        const sessionDocRef = doc(db, 'liveSessions', sessionId);

        const unsubscribe = onSnapshot(sessionDocRef, (doc) => {
            if (!doc.exists()) {
                setError('La sesión no existe o ha terminado.');
                setLoading(false);
                return;
            }

            const sessionData = doc.data();
            setSession(sessionData);

            if (currentQuestion && sessionData.currentQuestionIndex !== currentQuestion.index) {
                setSelectedAnswer(null);
                setAnswerSubmitted(false);
            }

            if (!quiz && sessionData.quizId) {
                const quizDocRef = doc(db, 'quizzes', sessionData.quizId);
                onSnapshot(quizDocRef, (quizDoc) => {
                    if (quizDoc.exists()) {
                        setQuiz(quizDoc.data());
                    } else {
                        setError('No se pudo encontrar el cuestionario asociado.');
                    }
                });
            }

            setLoading(false);
        }, (err) => {
            console.error("Error al obtener la sesión:", err);
            setError('No se pudo cargar la sesión.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [sessionId, quiz, currentQuestion]);

    useEffect(() => {
        if (session && quiz) {
            const questionIndex = session.currentQuestionIndex;
            if (questionIndex >= 0 && questionIndex < quiz.questions.length) {
                setCurrentQuestion({ ...quiz.questions[questionIndex], index: questionIndex });
            } else if (session.status === 'finished') {
                // TODO: Navegar a la página de resultados para el participante
                console.log("El quiz ha terminado");
            }
        }
    }, [session, quiz]);

    const handleAnswerSelect = async (answerIndex) => {
        if (answerSubmitted || !currentQuestion) return;

        setSelectedAnswer(answerIndex);
        setAnswerSubmitted(true);

        const sessionDocRef = doc(db, 'liveSessions', sessionId);
        const response = {
            participantId: participantId,
            answerIndex: answerIndex,
            questionIndex: currentQuestion.index,
            timestamp: new Date()
        };

        try {
             // Usamos un campo `responses` que es un array de objetos
            await updateDoc(sessionDocRef, {
                responses: arrayUnion(response)
            });
        } catch (error) {
            console.error("Error al enviar la respuesta:", error);
            // Opcional: manejar el error, permitir al usuario reintentar
        }
    };

    if (loading) {
        return <div className="player-loading">Conectando al juego...</div>;
    }

    if (error) {
        return <div className="player-error">{error}</div>;
    }
    
    if (!currentQuestion) {
        return (
            <div className="player-waiting">
                <h2>¡Prepárate!</h2>
                <p>Esperando a que el anfitrión inicie la siguiente pregunta...</p>
            </div>
        );
    }

    return (
        <div className="quiz-player-container">
            <div className="question-header">
                <p>{currentQuestion.question}</p>
            </div>

            <div className="answers-grid">
                {currentQuestion.options.map((option, index) => (
                    <button 
                        key={index} 
                        className={`answer-button shape-${index} ${selectedAnswer === index ? 'selected' : ''}`}
                        onClick={() => handleAnswerSelect(index)}
                        disabled={answerSubmitted}
                    >
                        {option.text}
                    </button>
                ))}
            </div>

            {answerSubmitted && (
                <div className="submission-feedback">
                    <p>¡Respuesta enviada! Esperando al resto...</p>
                </div>
            )}
        </div>
    );
};

export default QuizPlayer;
