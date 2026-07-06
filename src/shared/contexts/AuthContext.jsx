import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

// Dominio sintético usado para dar a cada supervisor una cuenta real de
// Firebase Auth sin necesidad de un correo verdadero (ver src/shared/utils/secondaryAuth.js).
export const SUPERVISOR_EMAIL_DOMAIN = 'supervisores.app';

// Los valores legacy del campo `usuario` son texto libre (nombres con
// espacios/acentos, ej. "Darwin Girón"), no identificadores listos para email.
// Se normaliza a un local-part válido: sin acentos, sin espacios, solo
// caracteres permitidos en un email.
export const usuarioToEmail = (usuario) => {
  const limpio = (usuario || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos/diacriticos (marcas combinantes tras normalize NFD)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '.') // cualquier caracter no válido -> punto
    .replace(/\.{2,}/g, '.') // colapsa puntos repetidos
    .replace(/^\.+|\.+$/g, ''); // quita puntos al inicio/fin
  return `${limpio}@${SUPERVISOR_EMAIL_DOMAIN}`;
};

// Fallback temporal: la fuente de verdad del rol es usuarios/{uid}.rol.
// Se conserva por si algún documento de administrador aún no tiene el campo `rol` migrado.
const ADMIN_EMAILS = ['admin@admin.com', 'darwingirn@gmail.com'];

// Ruta a la que debe aterrizar cada rol tras iniciar sesión (y a la que se
// redirige si intenta entrar a una ruta que no le corresponde).
export const rutaInicial = (rol) =>
  rol === 'supervisor' ? '/mis-asignaciones' : '/dashboard';

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
  const [authLoading, setAuthLoading] = useState(true);

  // Única fuente de sesión: Firebase Auth. Los supervisores también son
  // cuentas Auth reales (con email sintético), así que ya no hace falta
  // una sesión custom en localStorage.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setFirebaseUser(u);
      if (u) {
        try {
          // El doc del perfil puede vivir en usuarios/{uid} (admin / autoregistrado)
          // o en un doc con otro id que referencia authUid (supervisores migrados).
          let perfil = null;
          const snapByUid = await getDoc(doc(db, 'usuarios', u.uid));
          if (snapByUid.exists()) {
            perfil = { id: snapByUid.id, ...snapByUid.data() };
          } else {
            const q = query(collection(db, 'usuarios'), where('authUid', '==', u.uid));
            const snap = await getDocs(q);
            if (!snap.empty) {
              const d = snap.docs[0];
              perfil = { id: d.id, ...d.data() };
            }
          }
          setFirebaseProfile(perfil);
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

  // Login de supervisor: ahora es una cuenta real de Firebase Auth con
  // email sintético (usuario@supervisores.app). Cero comparación de
  // contraseñas en el cliente — Firebase valida en su servidor.
  const loginSupervisor = useCallback(async (usuario, contrasena) => {
    const limpio = (usuario || '').trim();
    if (!limpio || !contrasena) {
      return { ok: false, error: 'Ingresa usuario y contraseña.' };
    }

    try {
      await signInWithEmailAndPassword(auth, usuarioToEmail(limpio), contrasena);
      return { ok: true };
    } catch (err) {
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-email'
      ) {
        return { ok: false, error: 'Usuario o contraseña incorrectos.' };
      }
      return { ok: false, error: 'No se pudo iniciar sesión. Intenta de nuevo.' };
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  // Identidad unificada, derivada solo de Firebase Auth + el perfil de Firestore.
  let user = null;
  if (firebaseUser) {
    const email = firebaseUser.email || '';
    const isAdminByEmail = ADMIN_EMAILS.includes(email);
    const rol = firebaseProfile?.rol || (isAdminByEmail ? 'admin' : 'usuario');
    user = {
      uid: firebaseUser.uid,
      supervisorId: firebaseProfile?.id || firebaseUser.uid,
      nombre:
        firebaseProfile?.nombre ||
        firebaseProfile?.userName ||
        firebaseUser.displayName ||
        email,
      email,
      usuario: firebaseProfile?.usuario || email,
      codigo: firebaseProfile?.codigo || null,
      rol,
    };
  }

  const value = {
    user,
    rol: user?.rol || null,
    isAdmin: user?.rol === 'admin',
    isCapacitador: user?.rol === 'capacitador',
    isSupervisor: user?.rol === 'supervisor',
    supervisorId: user?.supervisorId || null,
    loading: authLoading,
    loginSupervisor,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
