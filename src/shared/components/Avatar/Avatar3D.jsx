import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Componente Avatar3D animado
 * Renderiza un avatar de cuerpo completo interactivo con animaciones suaves
 */
const Avatar3D = ({
  config = {},
  animation = 'idle',
  interactive = true,
  size = 'md',
  onAnimationComplete = null,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState(0);

  // Configuración del tamaño
  const sizes = {
    sm: { width: 120, height: 180, scale: 0.8 },
    md: { width: 200, height: 300, scale: 1 },
    lg: { width: 300, height: 450, scale: 1.2 },
  };

  const sizeConfig = sizes[size];
  const {
    skinColor = '#f4c2a0',
    hairColor = '#1a1a1a',
    clothesColor = '#4ecdc4',
    shoesColor = '#333333',
    accessory = 'none',
  } = config;

  // Animaciones de movimiento
  const animationVariants = {
    idle: {
      y: [0, -10, 0],
      rotate: [0, 1, 0, -1, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    wave: {
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
    dance: {
      y: [0, -15, 0],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    celebrate: {
      y: [0, -20, -10, -20, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const handleMouseMove = (e) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const angle = (x / rect.width - 0.5) * 30;
    setRotation(angle);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setRotation(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      className="flex items-center justify-center"
      variants={animationVariants[animation] || animationVariants.idle}
      animate={animation}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      style={{
        width: sizeConfig.width,
        height: sizeConfig.height,
        perspective: '1000px',
        cursor: interactive ? 'pointer' : 'default',
      }}
    >
      <svg
        viewBox="0 0 100 150"
        width={sizeConfig.width}
        height={sizeConfig.height}
        style={{
          transform: `rotateY(${rotation}deg)`,
          transition: 'transform 0.3s ease-out',
          filter: isHovered ? 'drop-shadow(0 10px 20px rgba(0,0,0,0.2))' : 'none',
        }}
      >
        {/* Sombra */}
        <ellipse cx="50" cy="145" rx="30" ry="8" fill="rgba(0,0,0,0.1)" />

        {/* Cabeza */}
        <circle cx="50" cy="30" r="15" fill={skinColor} />

        {/* Cabello */}
        <path
          d="M 35 30 Q 35 15 50 15 Q 65 15 65 30"
          fill={hairColor}
          stroke={hairColor}
          strokeWidth="0.5"
        />

        {/* Accesorios - Gafas */}
        {accessory === 'glasses' && (
          <>
            <circle cx="42" cy="28" r="4" fill="none" stroke="#333" strokeWidth="1" />
            <circle cx="58" cy="28" r="4" fill="none" stroke="#333" strokeWidth="1" />
            <line x1="46" y1="28" x2="54" y2="28" stroke="#333" strokeWidth="1" />
          </>
        )}

        {/* Accesorios - Sombrero */}
        {accessory === 'hat' && (
          <path
            d="M 35 18 Q 50 5 65 18 L 64 20 Q 50 12 36 20 Z"
            fill="#8b4513"
            stroke="#654321"
            strokeWidth="0.5"
          />
        )}

        {/* Accesorios - Barba */}
        {accessory === 'beard' && (
          <path
            d="M 40 35 Q 50 38 60 35"
            fill={hairColor}
            stroke={hairColor}
            strokeWidth="1"
            opacity="0.6"
          />
        )}

        {/* Accesorios - Auriculares */}
        {accessory === 'headphones' && (
          <>
            <path
              d="M 35 28 Q 35 20 50 20 Q 65 20 65 28"
              fill="none"
              stroke="#666"
              strokeWidth="2"
            />
            <circle cx="35" cy="30" r="2" fill="#666" />
            <circle cx="65" cy="30" r="2" fill="#666" />
          </>
        )}

        {/* Ojos */}
        <circle cx="45" cy="27" r="1.5" fill="#000" />
        <circle cx="55" cy="27" r="1.5" fill="#000" />

        {/* Sonrisa */}
        <path
          d="M 45 32 Q 50 34 55 32"
          fill="none"
          stroke="#000"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Cuello */}
        <rect x="48" y="42" width="4" height="5" fill={skinColor} />

        {/* Cuerpo - Camisa/Ropa */}
        <path
          d="M 35 47 L 30 75 L 70 75 L 65 47 Z"
          fill={clothesColor}
          stroke="#ccc"
          strokeWidth="0.5"
        />

        {/* Detalles de ropa */}
        <line x1="50" y1="47" x2="50" y2="75" stroke="#fff" strokeWidth="0.5" opacity="0.5" />
        <circle cx="50" cy="55" r="1" fill="#000" opacity="0.3" />

        {/* Brazos */}
        {/* Brazo izquierdo */}
        <g id="arm-left">
          <line x1="35" y1="52" x2="20" y2="65" stroke={skinColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="20" cy="65" r="2" fill={skinColor} />
          <path d="M 20 65 L 15 70" stroke={clothesColor} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* Brazo derecho */}
        <g id="arm-right">
          <line x1="65" y1="52" x2="80" y2="65" stroke={skinColor} strokeWidth="3" strokeLinecap="round" />
          <circle cx="80" cy="65" r="2" fill={skinColor} />
          <path d="M 80 65 L 85 70" stroke={clothesColor} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
        </g>

        {/* Piernas */}
        {/* Pierna izquierda */}
        <line x1="40" y1="75" x2="38" y2="110" stroke={skinColor} strokeWidth="3" strokeLinecap="round" />
        <rect x="36" y="110" width="4" height="8" fill={shoesColor} rx="1" />

        {/* Pierna derecha */}
        <line x1="60" y1="75" x2="62" y2="110" stroke={skinColor} strokeWidth="3" strokeLinecap="round" />
        <rect x="60" y="110" width="4" height="8" fill={shoesColor} rx="1" />

        {/* Destellos interactivos */}
        {isHovered && (
          <motion.circle
            cx="45"
            cy="25"
            r="1"
            fill="#fff"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </svg>
    </motion.div>
  );
};

export default Avatar3D;
