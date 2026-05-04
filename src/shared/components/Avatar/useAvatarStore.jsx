import { useState, useCallback, useContext, createContext } from 'react';
import { DEFAULT_AVATAR_CONFIG } from './avatarPresets';

/**
 * Contexto y hook para manejar el estado del avatar globalmente
 */
const AvatarContext = createContext();

export const AvatarProvider = ({ children }) => {
  const [avatarConfig, setAvatarConfig] = useState(DEFAULT_AVATAR_CONFIG);
  const [userAvatars, setUserAvatars] = useState({});

  const updateAvatarConfig = useCallback((newConfig) => {
    setAvatarConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const saveUserAvatar = useCallback((userId, config) => {
    setUserAvatars((prev) => ({
      ...prev,
      [userId]: config,
    }));
  }, []);

  const getUserAvatar = useCallback((userId) => {
    return userAvatars[userId] || DEFAULT_AVATAR_CONFIG;
  }, [userAvatars]);

  const value = {
    avatarConfig,
    updateAvatarConfig,
    saveUserAvatar,
    getUserAvatar,
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
