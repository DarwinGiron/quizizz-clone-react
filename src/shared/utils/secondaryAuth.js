import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from '../../firebase/config';

const SECONDARY_APP_NAME = 'secondary-supervisor-auth';

// Crea una cuenta de Firebase Auth SIN cerrar la sesión del admin actual.
// Usa una instancia secundaria y aislada de la app de Firebase que se
// destruye al terminar, para no interferir con la app principal.
export async function crearCuentaAuth(email, password) {
  const existente = getApps().find((a) => a.name === SECONDARY_APP_NAME);
  const secondaryApp = existente || initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    return cred.user.uid;
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
}
