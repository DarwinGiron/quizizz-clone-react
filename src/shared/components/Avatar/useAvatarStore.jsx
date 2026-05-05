import { useState, useCallback, useContext, createContext } from 'react';
import { ref, set, get, update } from 'firebase/database';
// ✅ CORRECCIÓN: config.js exporta "rtdb" (Realtime Database), no "db"
// "db" en config.js es Firestore. Para avatares en tiempo real usamos rtdb.
import { rtdb } from '../../../firebase/config';
import { DEFAULT_AVATAR_CONFIG } from './avatarPresets';

/**
 * Contexto y hook para manejar el estado del avatar globalmente
 * Incluye sincronización con Firebase Realtime Database
 */
const AvatarContext = createContext();

export const AvatarProvider = ({ children }) => {
  const [avatarConfig, setAvatarConfig] = useState(DEFAULT_AVATAR_CONFIG);
  const [userAvatars, setUserAvatars] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const updateAvatarConfig = useCallback((newConfig) => {
    setAvatarConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  // Guardar avatar en Firebase
  const saveUserAvatarToFirebase = useCallback(async (userId, config) => {
    try {
      setIsLoading(true);
      const avatarRef = ref(rtdb, `avatars/${userId}`);
      await set(avatarRef, {
        ...config,
        savedAt: new Date().toISOString(),
      });
      setUserAvatars((prev) => ({ ...prev, [userId]: config }));
      return true;
    } catch (error) {
      console.error('Error al guardar avatar en Firebase:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar avatar desde Firebase
  const loadUserAvatarFromFirebase = useCallback(async (userId) => {
    try {
      setIsLoading(true);
      const avatarRef = ref(rtdb, `avatars/${userId}`);
      const snapshot = await get(avatarRef);
      if (snapshot.exists()) {
        const config = snapshot.val();
        setUserAvatars((prev) => ({ ...prev, [userId]: config }));
        return config;
      }
      return null;
    } catch (error) {
      console.error('Error al cargar avatar de Firebase:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Guardar avatar localmente (sin Firebase)
  const saveUserAvatar = useCallback((userId, config) => {
    setUserAvatars((prev) => ({ ...prev, [userId]: config }));
  }, []);

  // Obtener avatar de un usuario
  const getUserAvatar = useCallback(
    (userId) => userAvatars[userId] || DEFAULT_AVATAR_CONFIG,
    [userAvatars]
  );

  // Actualizar campos específicos del avatar en Firebase
  const updateUserAvatarInFirebase = useCallback(async (userId, updates) => {
    try {
      setIsLoading(true);
      const avatarRef = ref(rtdb, `avatars/${userId}`);
      await update(avatarRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      setUserAvatars((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], ...updates },
      }));
      return true;
    } catch (error) {
      console.error('Error al actualizar avatar en Firebase:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = {
    avatarConfig,
    updateAvatarConfig,
    saveUserAvatar,
    getUserAvatar,
    saveUserAvatarToFirebase,
    loadUserAvatarFromFirebase,
    updateUserAvatarInFirebase,
    isLoading,
  };

  return (
    <AvatarContext.Provider value={value}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('useAvatar debe ser usado dentro de AvatarProvider');
  }
  return context;
};
