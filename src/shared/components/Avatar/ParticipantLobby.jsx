import React from 'react';
import { motion } from 'framer-motion';
import ParticipantCard from './ParticipantCard';

/**
 * Vista de lobby/participantes
 * Muestra todos los participantes con avatares y códigos
 */
const ParticipantLobby = ({
  participants = [],
  title = 'Participantes en sesión',
  maxColumns = 4,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
  };

  return (
    <motion.div
      className="w-full h-full flex flex-col gap-6 p-6 bg-gradient-to-b from-slate-900 to-slate-800"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-300">
          {participants.length} participante{participants.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Grid de participantes */}
      {participants.length > 0 ? (
        <motion.div
          className={`grid ${gridColsClass[maxColumns]} gap-4 auto-rows-max`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {participants.map((participant) => (
            <ParticipantCard
              key={participant.userId}
              userId={participant.userId}
              userName={participant.userName}
              avatarConfig={participant.avatarConfig}
              participantCode={participant.code}
              score={participant.score}
              isActive={participant.isActive}
              animation={participant.animation || 'idle'}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="flex items-center justify-center min-h-96"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="text-center">
            <p className="text-gray-300 text-lg mb-2">Esperando participantes...</p>
            <motion.div
              className="inline-flex gap-1"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default ParticipantLobby;
