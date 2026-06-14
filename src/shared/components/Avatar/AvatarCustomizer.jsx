import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Avatar3D from './Avatar3D';
import { useAvatar } from './useAvatarStore';
import {
  AVATAR_STYLES,
  AVATAR_COLORS,
  AVATAR_ACCESSORIES,
  DEFAULT_AVATAR_CONFIG,
} from './avatarPresets';

/**
 * Componente para personalizar avatar
 * Permite seleccionar estilo, colores, accesorios y animaciones
 */
const AvatarCustomizer = ({ onAvatarChange, initialConfig = DEFAULT_AVATAR_CONFIG, userId = null }) => {
  const [config, setConfig] = useState(initialConfig);
  const [activeTab, setActiveTab] = useState('style');
  const [previewAnimation, setPreviewAnimation] = useState('idle');
  const [previewExpression, setPreviewExpression] = useState('happy');
  const { saveUserAvatarToFirebase, isLoading } = useAvatar();

  const handleStyleChange = (styleId) => {
    const style = AVATAR_STYLES[styleId.toUpperCase()];
    const newConfig = {
      ...config,
      style: styleId,
      skinColor: style.colors.skin,
      hairColor: style.colors.hair,
      clothesColor: style.colors.clothes,
      shoesColor: style.colors.shoes,
    };
    setConfig(newConfig);
    onAvatarChange?.(newConfig);
  };

  const handleColorChange = (colorType, color) => {
    const newConfig = {
      ...config,
      [`${colorType}Color`]: color,
    };
    setConfig(newConfig);
    onAvatarChange?.(newConfig);
  };

  const handleAccessoryChange = (accessoryId) => {
    const newConfig = {
      ...config,
      accessory: accessoryId,
    };
    setConfig(newConfig);
    onAvatarChange?.(newConfig);
  };

  // Guardar avatar en Firebase
  const handleSaveToFirebase = async () => {
    if (!userId) {
      console.warn('userId no proporcionado, no se puede guardar en Firebase');
      return;
    }
    
    const success = await saveUserAvatarToFirebase(userId, config);
    if (success) {
      console.log('Avatar guardado en Firebase exitosamente');
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="flex flex-col gap-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Vista previa del avatar */}
      <motion.div
        className="flex flex-col gap-4 bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
        variants={itemVariants}
      >
        {/* Avatar principal */}
        <div className="flex justify-center items-center">
          <Avatar3D 
            config={config} 
            animation={previewAnimation} 
            expression={previewExpression}
            size="md" 
            interactive={true} 
          />
        </div>
        
        {/* Controles de animaciones */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['idle', 'wave', 'dance', 'celebrate', 'thinking', 'impressed', 'shocked'].map((anim) => (
            <motion.button
              key={anim}
              onClick={() => setPreviewAnimation(anim)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                previewAnimation === anim
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {anim === 'idle' && '😐'}
              {anim === 'wave' && '👋'}
              {anim === 'dance' && '🕺'}
              {anim === 'celebrate' && '🎉'}
              {anim === 'thinking' && '🤔'}
              {anim === 'impressed' && '😲'}
              {anim === 'shocked' && '😱'}
            </motion.button>
          ))}
        </div>

        {/* Controles de expresiones */}
        <div className="flex flex-wrap gap-2 justify-center">
          {['happy', 'thinking', 'impressed', 'shocked'].map((expr) => (
            <motion.button
              key={expr}
              onClick={() => setPreviewExpression(expr)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                previewExpression === expr
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {expr === 'happy' && '😊'}
              {expr === 'thinking' && '🤔'}
              {expr === 'impressed' && '😲'}
              {expr === 'shocked' && '😮'}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Tabs de personalización */}
      <motion.div className="flex gap-2 border-b border-gray-300" variants={itemVariants}>
        {['style', 'colors', 'accessories'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab === 'style' && '👕 Estilo'}
            {tab === 'colors' && '🎨 Colores'}
            {tab === 'accessories' && '✨ Accesorios'}
          </button>
        ))}
      </motion.div>

      {/* Tab: Estilos */}
      {activeTab === 'style' && (
        <motion.div className="grid grid-cols-2 gap-3" variants={itemVariants}>
          {Object.values(AVATAR_STYLES).map((style) => (
            <motion.button
              key={style.id}
              onClick={() => handleStyleChange(style.id)}
              className={`p-3 rounded-lg transition-all transform ${
                config.style === style.id
                  ? 'bg-blue-500 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 shadow hover:shadow-md'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="font-semibold">{style.name}</div>
              <div className="text-xs opacity-75">{style.description}</div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Tab: Colores */}
      {activeTab === 'colors' && (
        <motion.div className="space-y-4" variants={itemVariants}>
          {/* Piel */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tono de piel
            </label>
            <div className="flex gap-2">
              {AVATAR_COLORS.skin.map((color) => (
                <motion.button
                  key={`skin-${color}`}
                  onClick={() => handleColorChange('skin', color)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor:
                      config.skinColor === color ? '#2563eb' : 'transparent',
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>

          {/* Cabello */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Color de cabello
            </label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.hair.map((color) => (
                <motion.button
                  key={`hair-${color}`}
                  onClick={() => handleColorChange('hair', color)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor:
                      config.hairColor === color ? '#2563eb' : 'transparent',
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>

          {/* Ropa */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Color de ropa
            </label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.clothes.map((color) => (
                <motion.button
                  key={`clothes-${color}`}
                  onClick={() => handleColorChange('clothes', color)}
                  className="w-8 h-8 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor:
                      config.clothesColor === color ? '#2563eb' : 'transparent',
                  }}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab: Accesorios */}
      {activeTab === 'accessories' && (
        <motion.div className="grid grid-cols-3 gap-2" variants={itemVariants}>
          {AVATAR_ACCESSORIES.map((acc) => (
            <motion.button
              key={acc.id}
              onClick={() => handleAccessoryChange(acc.id)}
              className={`p-3 rounded-lg transition-all ${
                config.accessory === acc.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 shadow hover:shadow-md'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="text-2xl mb-1">{acc.icon}</div>
              <div className="text-xs font-medium">{acc.name}</div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Información de configuración actual */}
      <motion.div
        className="text-xs text-gray-500 text-center p-3 bg-white rounded border border-gray-200"
        variants={itemVariants}
      >
        <p>Tu avatar está personalizado y listo para usar</p>
      </motion.div>

      {/* Botón de guardar en Firebase */}
      {userId && (
        <motion.button
          onClick={handleSaveToFirebase}
          disabled={isLoading}
          className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          variants={itemVariants}
        >
          {isLoading ? 'Guardando...' : '💾 Guardar Avatar en Firebase'}
        </motion.button>
      )}
    </motion.div>
  );
};

export default AvatarCustomizer;
