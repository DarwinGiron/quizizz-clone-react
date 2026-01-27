import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import './WaitingRoomParticipant.css'; // Importar el nuevo archivo CSS

const WaitingRoomParticipant = () => {
    const { sessionId, participantId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [participantName, setParticipantName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!sessionId) {
            setError('No se proporcionó un ID de sesión.');
            setLoading(false);
            return;
        }

        const sessionDocRef = doc(db, 'liveSessions', sessionId);

        const unsubscribe = onSnapshot(sessionDocRef, (doc) => {
            if (doc.exists()) {
                const sessionData = doc.data();
                setSession(sessionData);

                const currentParticipant = sessionData.participants?.find(p => p.id === participantId);
                if (currentParticipant) {
                    setParticipantName(currentParticipant.name);
                }

                if (sessionData.status === 'started') {
                    navigate(`/quiz-player/${sessionId}`);
                }
                setError('');
            } else {
                setError('La sesión ya no está disponible.');
                setSession(null);
            }
            setLoading(false);
        }, (err) => {
            console.error("Error al escuchar la sesión:", err);
            setError('No se pudo conectar a la sesión.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [sessionId, participantId, navigate]);

    if (loading) {
        return <div className="loading-container"><p>Uniéndote a la partida...</p></div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button onClick={() => navigate('/join')} className="retry-button">Volver a intentar</button>
            </div>
        );
    }

    return (
        <div className="participant-waiting-container">
            <div className="welcome-box">
                <h1>¡Estás dentro!</h1>
                <p>Bienvenido, <span style={{fontWeight: 'bold'}}>{participantName}</span></p>
            </div>
            <div className="instructions">
                <h2>Verás las preguntas en la pantalla del anfitrión.</h2>
                <p>Prepárate para jugar...</p>
            </div>
            <div className="loading-animation">
                 <div className="loading-circle"></div>
            </div>
        </div>
    );
};

export default WaitingRoomParticipant;
