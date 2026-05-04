import React from 'react';
import { motion } from 'framer-motion';
import Avatar3D from './Avatar3D';

/**
 * Componente para mostrar avatar + código de participante en sesiones
 * Similar a Waygrow - código interactivo + avatar animado
 */
const ParticipantCard = ({
  userId,
  userName,
  avatarConfig,
  participantCode,
  score = 0,
  isActive = true,
  animation = 'idle',
}) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.3 },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
  };

  return (
    <motion.div
      className={`flex flex-col items-center gap-4 p-4 rounded-xl transition-all ${
        isActive
          ? 'bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg'
          : 'bg-gray-50 shadow'
      }`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Avatar */}
      <motion.div
        className={`relative ${isActive ? 'ring-2 ring-blue-400' : ''}`}
        variants={isActive ? pulseVariants : {}}
        animate={isActive ? 'animate' : 'initial'}
      >
        <Avatar3D
          config={avatarConfig}
          animation={animation}
          size="sm"
          interactive={false}
        />
      </motion.div>

      {/* Información del participante */}
      <div className="text-center w-full">
        {/* Nombre */}
        <h3 className="font-bold text-lg text-gray-800 truncate">
          {userName || 'Participante'}
        </h3>

        {/* Código de participante - Estilo interactivo */}
        <motion.div
          className="my-3 p-3 bg-white rounded-lg border-2 border-blue-400 cursor-pointer group"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="text-xs text-gray-600 font-medium mb-1">CÓDIGO</div>
          <div
            className="text-2xl font-mono font-bold text-blue-600 tracking-widest group-hover:text-blue-700 transition-colors"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {participantCode}
          </div>
        </motion.div>

        {/* Puntuación si existe */}
        {score > 0 && (
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-gray-600">Puntos:</span>
            <motion.span
              className="text-xl font-bold text-green-500"
              key={score}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {score}
            </motion.span>
          </div>
        )}
      </div>

      {/* Indicador de estado */}
      {isActive && (
        <motion.div
          className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          title="Participante activo"
        />
      )}
    </motion.div>
  );
};

export default ParticipantCard;
