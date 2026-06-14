import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { auth, db } from '../../../firebase/config';
import {
  AvatarCustomizer,
  DEFAULT_AVATAR_CONFIG,
} from '../../../shared/components/Avatar';

const traducirError = (code) => {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo.';
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.';
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil (mínimo 6 caracteres).';
    case 'auth/network-request-failed':
      return 'Error de conexión. Revisa tu internet e intenta de nuevo.';
    default:
      return 'No se pudo crear la cuenta. Intenta de nuevo.';
  }
};

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1: datos básicos, 2: avatar
  const [avatarConfig, setAvatarConfig] = useState(DEFAULT_AVATAR_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFirstStep = (e) => {
    e.preventDefault();
    if (!email || !password || !userName) {
      setError('Por favor completa todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setError(null);
    setStep(2);
  };

  const handleRegister = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Guardar el nombre en el perfil de Firebase Auth
      await updateProfile(user, { displayName: userName });

      // Persistir el perfil completo en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        email,
        userName,
        avatarConfig,
        rol: 'usuario',
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error('Error al registrar:', err);
      setError(traducirError(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 items-center justify-center p-12 overflow-hidden">
        <div className="absolute top-[-6rem] left-[-6rem] w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-8rem] right-[-4rem] w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />

        <motion.div
          className="relative z-10 text-white max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-white/20 backdrop-blur p-3 rounded-2xl">
              <GraduationCap className="w-8 h-8" />
            </div>
            <span className="text-2xl font-bold">Capacitaciones</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Crea tu cuenta y empieza a capacitar a tu equipo
          </h1>
          <p className="text-indigo-100 text-lg">
            Personaliza tu avatar, gestiona capacitaciones y haz seguimiento de
            cada participante desde un solo panel.
          </p>
        </motion.div>
      </div>

      {/* Panel derecho - formulario */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-indigo-50">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo móvil */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-xl text-white">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="text-xl font-bold text-gray-800">Capacitaciones</span>
          </div>

          {/* Step 1: Datos básicos */}
          {step === 1 && (
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-3xl font-bold mb-2 text-gray-800">
                Crear cuenta
              </h2>
              <p className="text-gray-500 mb-6">Paso 1 de 2 · Información básica</p>

              <form onSubmit={handleFirstStep} className="flex flex-col gap-5">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre de usuario
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Tu nombre completo"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      placeholder="tu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Al menos 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-11 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error}
                  </motion.div>
                )}

                {/* Botón siguiente */}
                <motion.button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-shadow"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Siguiente: Personalizar avatar
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                ¿Ya tienes una cuenta?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Inicia sesión
                </Link>
              </p>
            </motion.div>
          )}

          {/* Step 2: Avatar */}
          {step === 2 && !success && (
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="text-3xl font-bold mb-2 text-gray-800">Tu avatar</h2>
              <p className="text-gray-500 mb-6">
                Paso 2 de 2 · Personaliza tu avatar
              </p>

              <AvatarCustomizer
                initialConfig={avatarConfig}
                onAvatarChange={(newConfig) => setAvatarConfig(newConfig)}
              />

              {/* Error */}
              {error && (
                <motion.div
                  className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.div>
              )}

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Atrás
                </motion.button>
                <motion.button
                  onClick={handleRegister}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Completar registro'
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Success */}
          {success && (
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-8 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                className="flex justify-center mb-4"
              >
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                ¡Registro exitoso!
              </h3>
              <p className="text-gray-500 mb-4">Redirigiendo al dashboard...</p>
              <div className="flex justify-center gap-1">
                {[0, 0.1, 0.2].map((delay) => (
                  <motion.div
                    key={delay}
                    className="w-2 h-2 bg-indigo-500 rounded-full"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 0.6, delay, repeat: Infinity }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
