import React, { useState, useEffect } from 'react';
import { ParticipantLobby, DEFAULT_AVATAR_CONFIG } from '../../../shared/components/Avatar';

/**
 * Componente de ejemplo para mostrar la funcionalidad de avatares en sesión en vivo
 * Similar a Waygrow - código interactivo + avatares animados
 */
const SessionLobbyDemo = () => {
  // Datos de ejemplo - en producción vendrían de Firebase
  const [participants, setParticipants] = useState([
    {
      userId: '1',
      userName: 'Juan García',
      code: 'W7K3',
      avatarConfig: {
        ...DEFAULT_AVATAR_CONFIG,
        style: 'casual',
        hairColor: '#8b4513',
        clothesColor: '#ff6b6b',
        accessory: 'glasses',
      },
      score: 450,
      isActive: true,
      animation: 'idle',
    },
    {
      userId: '2',
      userName: 'María López',
      code: 'P2N8',
      avatarConfig: {
        ...DEFAULT_AVATAR_CONFIG,
        style: 'creative',
        skinColor: '#d4a574',
        hairColor: '#ff6b6b',
        clothesColor: '#9370db',
        accessory: 'headphones',
      },
      score: 580,
      isActive: true,
      animation: 'idle',
    },
    {
      userId: '3',
      userName: 'Carlos Mendez',
      code: 'X9M1',
      avatarConfig: {
        ...DEFAULT_AVATAR_CONFIG,
        style: 'formal',
        hairColor: '#1a1a1a',
        clothesColor: '#2c3e50',
        accessory: 'hat',
      },
      score: 320,
      isActive: true,
      animation: 'idle',
    },
    {
      userId: '4',
      userName: 'Sofia Rodríguez',
      code: 'L5Y6',
      avatarConfig: {
        ...DEFAULT_AVATAR_CONFIG,
        style: 'tech',
        hairColor: '#4169e1',
        clothesColor: '#0a0e27',
        accessory: 'none',
      },
      score: 0,
      isActive: false,
      animation: 'idle',
    },
  ]);

  // Simular actualización de scores
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipants((prev) =>
        prev.map((p) => ({
          ...p,
          score: p.isActive ? p.score + Math.floor(Math.random() * 10) : p.score,
          animation: ['idle', 'wave', 'celebrate'][Math.floor(Math.random() * 3)],
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-screen">
      <ParticipantLobby
        participants={participants}
        title="Sesión en vivo: Capacitación React 2026"
        maxColumns={4}
      />
    </div>
  );
};

export default SessionLobbyDemo;
