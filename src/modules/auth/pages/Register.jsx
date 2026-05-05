
import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { motion } from 'framer-motion';
import { auth } from '../../../firebase/config';
import { AvatarCustomizer, DEFAULT_AVATAR_CONFIG } from '../../../shared/components/Avatar';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState(1); // 1: datos básicos, 2: avatar
  const [avatarConfig, setAvatarConfig] = useState(DEFAULT_AVATAR_CONFIG);
  const [isLoading, setIsLoading] = useState(false);
  const [userUid, setUserUid] = useState(null);

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

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Guardar el uid para usarlo en el AvatarCustomizer
      setUserUid(user.uid);

      // Aquí guardarías el nombre en Firestore
      // await saveUserProfile(user.uid, {
      //   userName,
      //   email,
      // });

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="w-full max-w-2xl">
        {/* Step 1: Datos básicos */}
        {step === 1 && (
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Crear Cuenta</h2>
            <p className="text-gray-600 mb-6">Paso 1 de 2: Información básica</p>

            <form onSubmit={handleFirstStep} className="flex flex-col gap-4">
              {/* Nombre de usuario */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre de usuario
                </label>
                <motion.input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  whileFocus={{ scale: 1.02 }}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <motion.input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  whileFocus={{ scale: 1.02 }}
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña
                </label>
                <motion.input
                  type="password"
                  placeholder="Al menos 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                  whileFocus={{ scale: 1.02 }}
                />
              </div>

              {/* Mensaje de error */}
              {error && (
                <motion.div
                  className="p-4 bg-red-50 border-2 border-red-300 rounded-lg text-red-700 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {error}
                </motion.div>
              )}

              {/* Botón siguiente */}
              <motion.button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-shadow"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Siguiente: Personalizar Avatar →
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Step 2: Personalizar Avatar */}
        {step === 2 && !success && (
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-8"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Tu Avatar</h2>
            <p className="text-gray-600 mb-6">Paso 2 de 2: Personaliza tu avatar</p>

            <AvatarCustomizer
              initialConfig={avatarConfig}
              onAvatarChange={(newConfig) => setAvatarConfig(newConfig)}
              userId={userUid}
            />

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <motion.button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ← Atrás
              </motion.button>
              <motion.button
                onClick={handleRegister}
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? 'Registrando...' : '✓ Completar Registro'}
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Success message */}
        {success && (
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">¡Registro Exitoso!</h3>
            <p className="text-gray-600 mb-4">Redirigiendo al dashboard...</p>
            <div className="flex justify-center gap-1">
              <motion.div
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              />
              <motion.div
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, delay: 0.1, repeat: Infinity }}
              />
              <motion.div
                className="w-2 h-2 bg-blue-500 rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 0.6, delay: 0.2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Register;
