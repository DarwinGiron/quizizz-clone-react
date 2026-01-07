import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // El estado que necesitamos

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // AÑADIMOS `loading` AL VALOR DEL CONTEXTO
  const value = {
    currentUser,
    loading, // <--- Exponer el estado de carga
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Ya no es necesario condicionar el renderizado aquí, lo hará la ruta privada */}
      {children}
    </AuthContext.Provider>
  );
};
