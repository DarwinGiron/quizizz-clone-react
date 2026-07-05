import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

// Correos que se consideran administradores del sistema.
const ADMIN_EMAILS = ['admin@admin.com', 'darwingirn@gmail.com'];

// Clave para persistir la sesión custom de supervisor (no es Firebase Auth).
const SUPERVISOR_STORAGE_KEY = 'supervisor_session';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [firebaseProfile, setFirebaseProfile] = useState(null);
  const [supervisorSession, setSupervisorSession] = useState(() => {
    try {
      const raw = localStorage.getItem(SUPERVISOR_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(true);

  // Sincroniza con Firebase Auth (admin / usuarios autoregistrados).
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'usuarios', u.uid));
          setFirebaseProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null);
        } catch {
          setFirebaseProfile(null);
        }
      } else {
        setFirebaseProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Login custom de supervisor: valida contra la colección `usuarios`.
  const loginSupervisor = useCallback(async (usuario, contrasena) => {
    const limpio = (usuario || '').trim();
    if (!limpio || !contrasena) {
      return { ok: false, error: 'Ingresa usuario y contraseña.' };
    }

    const q = query(collection(db, 'usuarios'), where('usuario', '==', limpio));
    const snap = await getDocs(q);
    if (snap.empty) {
      return { ok: false, error: 'Usuario o contraseña incorrectos.' };
    }

    // La contraseña se compara en cliente (soporta el campo con o sin ñ).
    const docu = snap.docs.find((d) => {
      const data = d.data();
      const pass = data['contraseña'] ?? data.contrasena ?? data.password;
      return pass === contrasena;
    });

    if (!docu) {
      return { ok: false, error: 'Usuario o contraseña incorrectos.' };
    }

    const data = docu.data();
    if (data.rol !== 'supervisor') {
      return { ok: false, error: 'Esta cuenta no tiene acceso de supervisor.' };
    }

    const session = {
      source: 'custom',
      id: docu.id,
      supervisorId: docu.id,
      nombre: data.nombre || data.usuario,
      usuario: data.usuario,
      codigo: data.codigo || null,
      rol: 'supervisor',
    };

    localStorage.setItem(SUPERVISOR_STORAGE_KEY, JSON.stringify(session));
    setSupervisorSession(session);
    return { ok: true, session };
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(SUPERVISOR_STORAGE_KEY);
    setSupervisorSession(null);
    if (auth.currentUser) {
      try {
        await signOut(auth);
      } catch {
        /* noop */
      }
    }
  }, []);

  // Identidad unificada. La sesión custom de supervisor tiene prioridad.
  let user = null;
  if (supervisorSession) {
    user = supervisorSession;
  } else if (firebaseUser) {
    const email = firebaseUser.email || '';
    const isAdmin = ADMIN_EMAILS.includes(email);
    const rol = isAdmin ? 'admin' : firebaseProfile?.rol || 'usuario';
    user = {
      source: 'firebase',
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      supervisorId: firebaseProfile?.id || firebaseUser.uid,
      nombre:
        firebaseProfile?.userName ||
        firebaseProfile?.nombre ||
        firebaseUser.displayName ||
        email,
      email,
      usuario: email,
      codigo: firebaseProfile?.codigo || null,
      rol,
    };
  }

  const value = {
    user,
    rol: user?.rol || null,
    isAdmin: user?.rol === 'admin',
    isSupervisor: user?.rol === 'supervisor',
    supervisorId: user?.supervisorId || null,
    // Si ya hay sesión de supervisor en localStorage, no esperamos a Firebase.
    loading: authLoading && !supervisorSession,
    loginSupervisor,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
