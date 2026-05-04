import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar3D, AVATAR_STYLES } from '../../../shared/components/Avatar';

/**
 * Galería de demostración de avatares
 * Muestra todas las combinaciones disponibles de avatares
 */
const AvatarGallery = () => {
  const [selectedAnimation, setSelectedAnimation] = useState('idle');

  const animations = ['idle', 'wave', 'dance', 'celebrate', 'thinking'];

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

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <motion.div
        className="max-w-7xl mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h1 className="text-5xl font-bold text-white mb-3">Galería de Avatares</h1>
          <p className="text-xl text-gray-300">
            Explora todas las combinaciones disponibles de avatares personalizados
          </p>
        </motion.div>

        {/* Controles de animación */}
        <motion.div className="flex justify-center gap-3 mb-12 flex-wrap" variants={itemVariants}>
          {animations.map((anim) => (
            <motion.button
              key={anim}
              onClick={() => setSelectedAnimation(anim)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                selectedAnimation === anim
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {anim === 'idle' && '🧍'}
              {anim === 'wave' && '👋'}
              {anim === 'dance' && '🕺'}
              {anim === 'celebrate' && '🎉'}
              {anim === 'thinking' && '🤔'}
              {' '}
              {anim.charAt(0).toUpperCase() + anim.slice(1)}
            </motion.button>
          ))}
        </motion.div>

        {/* Grid de avatares por estilo */}
        <motion.div className="space-y-12" variants={containerVariants}>
          {Object.values(AVATAR_STYLES).map((style) => (
            <motion.div key={style.id} variants={itemVariants} className="space-y-4">
              {/* Título de sección */}
              <div className="flex items-center gap-4">
                <div className="h-1 flex-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded" />
                <h2 className="text-2xl font-bold text-white whitespace-nowrap">
                  {style.name}
                </h2>
                <div className="h-1 flex-1 bg-gradient-to-l from-purple-500 to-pink-500 rounded" />
              </div>
              <p className="text-gray-400 text-center italic">{style.description}</p>

              {/* Grid de variantes de colores */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Variantes de cabello */}
                {[
                  { hair: '#1a1a1a', label: 'Negro' },
                  { hair: '#8b4513', label: 'Marrón' },
                  { hair: '#daa520', label: 'Dorado' },
                  { hair: '#ff6b6b', label: 'Rojo' },
                  { hair: '#4169e1', label: 'Azul' },
                ].map((hairOption, idx) => (
                  <motion.div
                    key={`${style.id}-${idx}`}
                    className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700 transition-colors border border-gray-600 hover:border-purple-500"
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <div className="flex justify-center mb-2">
                      <Avatar3D
                        config={{
                          ...style.colors,
                          hairColor: hairOption.hair,
                          accessory: ['none', 'glasses', 'hat', 'headphones', 'beard'][idx % 5],
                        }}
                        animation={selectedAnimation}
                        size="sm"
                        interactive={true}
                      />
                    </div>
                    <div className="text-xs text-gray-300 text-center font-mono">
                      {hairOption.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer con información */}
        <motion.div
          className="mt-16 text-center text-gray-400"
          variants={itemVariants}
        >
          <p className="text-sm">
            💡 Los avatares son totalmente interactivos. Mueve el mouse sobre ellos para ver el efecto 3D
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AvatarGallery;
