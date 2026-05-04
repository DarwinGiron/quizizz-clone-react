/**
 * Guía de Integración del Sistema de Avatares
 * Pasos para integrar en tu aplicación
 */

// ============================================
// PASO 1: Envolver App con AvatarProvider
// ============================================
// En src/main.jsx o tu archivo principal:

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { AvatarProvider } from './shared/components/Avatar'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AvatarProvider>
      <App />
    </AvatarProvider>
  </React.StrictMode>,
)

// ============================================
// PASO 2: Usar en Componentes - Ejemplo Register
// ============================================
// Ya está implementado en src/modules/auth/pages/Register.jsx
// El flujo es:
// 1. Usuario ingresa email, contraseña, nombre
// 2. Pasa a siguiente paso
// 3. Personaliza avatar con AvatarCustomizer
// 4. Al registrar, guarda avatar en Firebase

// ============================================
// PASO 3: Guardar Avatar en Firebase
// ============================================
// Crear función en src/firebase/userService.js

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './config';

export const saveUserProfile = async (userId, profileData) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    return docSnap.exists() ? docSnap.data() : null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// ============================================
// PASO 4: Mostrar Avatar en Sesión En Vivo
// ============================================
// En componente de sesión (ej: SessionPage.jsx):

import { ParticipantLobby } from '@/shared/components/Avatar';

export default function SessionPage() {
  const [participants, setParticipants] = useState([]);

  useEffect(() => {
    // Escuchar cambios de participantes en tiempo real
    const unsubscribe = db.collection('sessions')
      .doc(sessionId)
      .collection('participants')
      .onSnapshot((snapshot) => {
        const participantsList = snapshot.docs.map(doc => ({
          userId: doc.id,
          ...doc.data(),
        }));
        setParticipants(participantsList);
      });

    return () => unsubscribe();
  }, [sessionId]);

  return (
    <ParticipantLobby 
      participants={participants}
      title={`Sesión: ${sessionTitle}`}
      maxColumns={4}
    />
  );
}

// ============================================
// PASO 5: Mostrar Avatar en Perfil de Usuario
// ============================================
// En componente UserProfile.jsx:

import { Avatar3D, useAvatar } from '@/shared/components/Avatar';

export default function UserProfile({ userId }) {
  const { getUserAvatar } = useAvatar();
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const profile = await getUserProfile(userId);
      setUserProfile(profile);
    };
    fetchProfile();
  }, [userId]);

  if (!userProfile) return <div>Cargando...</div>;

  return (
    <div className="flex flex-col items-center gap-6">
      <Avatar3D 
        config={userProfile.avatarConfig}
        animation="idle"
        size="lg"
        interactive={true}
      />
      <div>
        <h2>{userProfile.userName}</h2>
        <p>{userProfile.email}</p>
      </div>
    </div>
  );
}

// ============================================
// PASO 6: Estructura Firebase Firestore
// ============================================
/*
firestore
└── users/
    └── {userId}/
        ├── userName: "Juan García"
        ├── email: "juan@example.com"
        ├── avatarConfig: {
        │   ├── style: "casual"
        │   ├── skinColor: "#f4c2a0"
        │   ├── hairColor: "#8b4513"
        │   ├── clothesColor: "#4ecdc4"
        │   ├── shoesColor: "#333333"
        │   └── accessory: "glasses"
        ├── createdAt: timestamp
        └── updatedAt: timestamp

└── sessions/
    └── {sessionId}/
        ├── title: "Capacitación React"
        ├── createdAt: timestamp
        └── participants/
            └── {userId}/
                ├── userName: "Juan García"
                ├── avatarConfig: {...}
                ├── code: "W7K3"
                ├── score: 450
                ├── isActive: true
                └── joinedAt: timestamp
*/

// ============================================
// PASO 7: Eventos de Animación
// ============================================
// Cambiar animación cuando el usuario responde

import { useState } from 'react';
import { Avatar3D } from '@/shared/components/Avatar';

export default function ParticipantAnswer() {
  const [animation, setAnimation] = useState('idle');

  const handleCorrectAnswer = () => {
    setAnimation('celebrate');
    setTimeout(() => setAnimation('idle'), 2000);
  };

  const handleWrongAnswer = () => {
    setAnimation('thinking');
    setTimeout(() => setAnimation('idle'), 2000);
  };

  return (
    <div>
      <Avatar3D 
        config={userAvatarConfig}
        animation={animation}
        size="md"
      />
      <button onClick={handleCorrectAnswer}>✓ Correcto</button>
      <button onClick={handleWrongAnswer}>✗ Incorrecto</button>
    </div>
  );
}

// ============================================
// PASO 8: Rutas para Demo
// ============================================
// Agregar en src/App.jsx o router configuration:

import AvatarGallery from '@/modules/evaluaciones/pages/AvatarGallery';
import SessionLobbyDemo from '@/modules/evaluaciones/pages/SessionLobbyDemo';

const routes = [
  // ... otras rutas
  {
    path: '/avatar-gallery',
    element: <AvatarGallery />,
  },
  {
    path: '/session-lobby-demo',
    element: <SessionLobbyDemo />,
  },
];

// ============================================
// PASO 9: Actualizar Avatar en Perfil
// ============================================
// Componente para editar avatar

import { AvatarCustomizer } from '@/shared/components/Avatar';
import { saveUserProfile } from '@/firebase/userService';

export default function EditAvatarPage() {
  const [config, setConfig] = useState(currentAvatarConfig);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await saveUserProfile(userId, { avatarConfig: config });
      alert('Avatar actualizado');
    } catch (error) {
      alert('Error al guardar avatar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <AvatarCustomizer 
        initialConfig={config}
        onAvatarChange={setConfig}
      />
      <button 
        onClick={handleSave}
        disabled={isLoading}
      >
        {isLoading ? 'Guardando...' : 'Guardar Avatar'}
      </button>
    </div>
  );
}

// ============================================
// FUNCIONALIDADES AVANZADAS
// ============================================

// 1. Actualizar score en tiempo real
const updateParticipantScore = async (sessionId, userId, newScore) => {
  await db
    .collection('sessions')
    .doc(sessionId)
    .collection('participants')
    .doc(userId)
    .update({ score: newScore });
};

// 2. Cambiar animación de participante
const updateParticipantAnimation = async (sessionId, userId, animation) => {
  await db
    .collection('sessions')
    .doc(sessionId)
    .collection('participants')
    .doc(userId)
    .update({ animation });
};

// 3. Marcar participante como inactivo
const deactivateParticipant = async (sessionId, userId) => {
  await db
    .collection('sessions')
    .doc(sessionId)
    .collection('participants')
    .doc(userId)
    .update({ isActive: false });
};

// ============================================
// PRÓXIMOS PASOS
// ============================================
/*
1. ✅ Instalar dependencias
2. ✅ Crear componentes Avatar
3. ✅ Integrar en Register
4. ⭕ Probar en navegador
5. ⭕ Guardar en Firebase
6. ⭕ Mostrar en sesiones en vivo
7. ⭕ Agregar más animaciones
8. ⭕ Optimizar performance
*/
