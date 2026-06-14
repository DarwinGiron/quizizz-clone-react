import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/**
 * Componente Avatar3D animado - VERSIÓN CORREGIDA
 *
 * PROBLEMAS CORREGIDOS:
 * 1. transformOrigin en SVG ahora usa "50% 50%" con transformBox:"fill-box"
 *    para que la rotación sea desde el centro del elemento, no desde el viewport.
 * 2. Curvas de animación usan spring/anticipation para movimientos naturales.
 * 3. Brazos: keyframes sincronizados con repeatType:"mirror" para que no salten.
 * 4. Piernas animadas con movimiento pendular opuesto (caminata en idle).
 * 5. Respiración separada del balanceo para que se combinen naturalmente.
 * 6. Eliminado rotate fijo en cuerpo durante animate — causaba sacudidas.
 */
const Avatar3D = ({
  config = {},
  animation = 'idle',
  expression = 'happy',
  interactive = true,
  size = 'md',
  onAnimationComplete = null,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [eyeState, setEyeState] = useState('open');

  // Parpadeo automático con intervalo aleatorio
  useEffect(() => {
    const blink = () => {
      setEyeState('closed');
      setTimeout(() => setEyeState('open'), 120);
    };
    const scheduleNextBlink = () => {
      const delay = 2500 + Math.random() * 3000;
      return setTimeout(() => {
        blink();
        timeoutRef.current = scheduleNextBlink();
      }, delay);
    };
    const timeoutRef = { current: scheduleNextBlink() };
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const sizes = {
    sm: { width: 120, height: 180 },
    md: { width: 200, height: 300 },
    lg: { width: 300, height: 450 },
  };

  const sizeConfig = sizes[size] || sizes.md;
  const {
    skinColor = '#f4c2a0',
    hairColor = '#1a1a1a',
    clothesColor = '#4ecdc4',
    shoesColor = '#333333',
    accessory = 'none',
  } = config;

  // ─────────────────────────────────────────────────────────
  // ANIMACIONES DEL CUERPO PRINCIPAL
  // Separar el eje Y (respiración/rebote) del rotate (balanceo)
  // para que no interfieran entre sí y se vean naturales.
  // ─────────────────────────────────────────────────────────
  const bodyVariants = {
    idle: {
      y: 0,
      rotate: [0, 0.6, 0, -0.6, 0],
      transition: {
        rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
      },
    },
    wave: {
      y: [0, -5, 0],
      rotate: [0, 0.5, 0],
      transition: {
        y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
        rotate: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
      },
    },
    dance: {
      y: [0, -12, -4, -12, 0],
      rotate: [0, 3, 0, -3, 0],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: [0.36, 0.07, 0.19, 0.97], // rebote rítmico
        times: [0, 0.25, 0.5, 0.75, 1],
      },
    },
    celebrate: {
      y: [0, -22, -8, -22, 0],
      rotate: [0, 2, 0, -2, 0],
      transition: {
        duration: 0.7,
        repeat: Infinity,
        ease: [0.215, 0.61, 0.355, 1],
        times: [0, 0.3, 0.5, 0.7, 1],
      },
    },
    thinking: {
      y: [0, -3, 0],
      rotate: [0, 1.5, 1.5, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
        times: [0, 0.4, 0.6, 1],
      },
    },
    impressed: {
      y: [0, -10, -6, -10, 0],
      rotate: [0, 0, 0],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    shocked: {
      y: [0, -14, 0],
      rotate: [0, -1, 1, 0],
      transition: {
        duration: 0.4,
        repeat: Infinity,
        repeatDelay: 1.5,
        ease: [0.36, 0.07, 0.19, 0.97],
      },
    },
    scratch: {
      y: 0,
      rotate: [0, 1.2, 0, 1.2, 0],
      transition: {
        rotate: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
      },
    },
    jump: {
      y: [0, -32, -8, 0],
      rotate: 0,
      transition: {
        y: { duration: 0.7, repeat: Infinity, repeatDelay: 0.5, ease: [0.215, 0.61, 0.355, 1], times: [0, 0.4, 0.7, 1] },
      },
    },
    laugh: {
      y: [0, -4, 0, -4, 0],
      rotate: [0, 2.5, 0, -2.5, 0],
      transition: {
        duration: 0.35,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  // ─────────────────────────────────────────────────────────
  // TRANSICIONES DE LAS ARTICULACIONES
  // Se definen por separado para poder reutilizarlas.
  // repeatType:"mirror" evita el salto brusco al reiniciar.
  // ─────────────────────────────────────────────────────────
  const jointTransition = (duration, delay = 0, repeatDelay = 0) => ({
    duration,
    repeat: Infinity,
    repeatType: 'mirror', // ← CLAVE: evita salto al hacer loop
    ease: 'easeInOut',
    delay,
    repeatDelay,
  });

  // ─────────────────────────────────────────────────────────
  // ANIMACIONES DE BRAZOS ARTICULADOS
  // Cada brazo tiene: hombro → codo (sin muñeca separada)
  // Los brazos cuelgan ~22° desde la vertical en reposo.
  // El transformOrigin funciona con transformBox:"fill-box"
  // ─────────────────────────────────────────────────────────
  const armAnimations = {
    idle: {
      shoulderLeft: { rotate: 3, transition: jointTransition(3.5) },
      elbowLeft:    { rotate: 2, transition: jointTransition(3.5, 0.2) },
      shoulderRight: { rotate: -3, transition: jointTransition(3.5) },
      elbowRight:   { rotate: -2, transition: jointTransition(3.5, 0.2) },
    },
    wave: {
      // Brazo izquierdo levantado saludando (oscila ~65° desde vertical)
      shoulderLeft: { rotate: -65, transition: jointTransition(0.5) },
      elbowLeft:    { rotate: -42, transition: jointTransition(0.5, 0.05) },
      // Brazo derecho relajado
      shoulderRight: { rotate: 4, transition: jointTransition(2.5) },
      elbowRight:   { rotate: 2, transition: jointTransition(2.5, 0.1) },
    },
    dance: {
      // Brazos levantados ~45° a cada lado, codos doblados hacia arriba
      shoulderLeft: { rotate: -20, transition: jointTransition(0.4) },
      elbowLeft:    { rotate: -32, transition: jointTransition(0.4, 0.05) },
      shoulderRight: { rotate: 20, transition: jointTransition(0.4) },
      elbowRight:   { rotate: 32, transition: jointTransition(0.4, 0.05) },
    },
    celebrate: {
      // Ambos brazos rectos hacia arriba
      shoulderLeft: { rotate: -88, transition: jointTransition(0.35) },
      elbowLeft:    { rotate: -8, transition: jointTransition(0.35, 0.05) },
      shoulderRight: { rotate: 88, transition: jointTransition(0.35) },
      elbowRight:   { rotate: 8, transition: jointTransition(0.35, 0.05) },
    },
    thinking: {
      // Brazo izquierdo: hombro a 42°, codo muy doblado (mano cerca de mentón)
      shoulderLeft: { rotate: -42, transition: jointTransition(3) },
      elbowLeft:    { rotate: -68, transition: jointTransition(3, 0.1) },
      // Brazo derecho: cruzado bajo el pecho
      shoulderRight: { rotate: 12, transition: jointTransition(3) },
      elbowRight:   { rotate: 8, transition: jointTransition(3, 0.1) },
    },
    impressed: {
      // Brazos semi-abiertos, expresión de sorpresa
      shoulderLeft: { rotate: -50, transition: jointTransition(1.2) },
      elbowLeft:    { rotate: -28, transition: jointTransition(1.2, 0.05) },
      shoulderRight: { rotate: 50, transition: jointTransition(1.2) },
      elbowRight:   { rotate: 28, transition: jointTransition(1.2, 0.05) },
    },
    shocked: {
      // Brazos casi horizontales, impacto
      shoulderLeft: { rotate: -85, transition: { ...jointTransition(0.3), repeatDelay: 1.5 } },
      elbowLeft:    { rotate: -6,  transition: { ...jointTransition(0.3), repeatDelay: 1.5 } },
      shoulderRight: { rotate: 85, transition: { ...jointTransition(0.3), repeatDelay: 1.5 } },
      elbowRight:   { rotate: 6,   transition: { ...jointTransition(0.3), repeatDelay: 1.5 } },
    },
    scratch: {
      // Brazo derecho levantado hasta la cabeza, codo oscila rápido (rascarse)
      shoulderLeft: { rotate: 3, transition: jointTransition(3) },
      elbowLeft:    { rotate: 2, transition: jointTransition(3) },
      shoulderRight: { rotate: -70, transition: jointTransition(2) },
      elbowRight:   { rotate: -35, transition: { duration: 0.18, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } },
    },
    jump: {
      // Brazos levantados y abiertos al saltar
      shoulderLeft: { rotate: -52, transition: jointTransition(0.7) },
      elbowLeft:    { rotate: -18, transition: jointTransition(0.7, 0.05) },
      shoulderRight: { rotate: 52, transition: jointTransition(0.7) },
      elbowRight:   { rotate: 18, transition: jointTransition(0.7, 0.05) },
    },
    laugh: {
      // Brazos doblados, manos al abdomen (riéndose)
      shoulderLeft: { rotate: -18, transition: jointTransition(0.35) },
      elbowLeft:    { rotate: -52, transition: jointTransition(0.35, 0.05) },
      shoulderRight: { rotate: 18, transition: jointTransition(0.35) },
      elbowRight:   { rotate: 52, transition: jointTransition(0.35, 0.05) },
    },
  };

  // ─────────────────────────────────────────────────────────
  // ANIMACIONES DE PIERNAS
  // Movimiento pendular opuesto entre pierna izquierda y derecha
  // para simular balanceo/marcha natural.
  // ─────────────────────────────────────────────────────────
  const legAnimations = {
    idle: {
      legLeft: { rotate: 3, transition: jointTransition(3.5) },
      legRight: { rotate: -3, transition: jointTransition(3.5) },
    },
    wave: {
      legLeft: { rotate: 2, transition: jointTransition(3) },
      legRight: { rotate: -2, transition: jointTransition(3) },
    },
    dance: {
      legLeft: { rotate: 12, transition: jointTransition(0.4) },
      legRight: { rotate: -12, transition: jointTransition(0.4) },
    },
    celebrate: {
      legLeft: { rotate: 10, transition: jointTransition(0.35) },
      legRight: { rotate: -10, transition: jointTransition(0.35) },
    },
    thinking: {
      legLeft: { rotate: 2, transition: jointTransition(4) },
      legRight: { rotate: -2, transition: jointTransition(4) },
    },
    impressed: {
      legLeft: { rotate: 5, transition: jointTransition(1.2) },
      legRight: { rotate: -5, transition: jointTransition(1.2) },
    },
    shocked: {
      legLeft: { rotate: 8, transition: { ...jointTransition(0.3), repeatDelay: 1.5 } },
      legRight: { rotate: -8, transition: { ...jointTransition(0.3), repeatDelay: 1.5 } },
    },
    scratch: {
      legLeft: { rotate: 2, transition: jointTransition(3) },
      legRight: { rotate: -2, transition: jointTransition(3) },
    },
    jump: {
      legLeft: { rotate: 15, transition: jointTransition(0.7) },
      legRight: { rotate: -15, transition: jointTransition(0.7) },
    },
    laugh: {
      legLeft: { rotate: 5, transition: jointTransition(0.35) },
      legRight: { rotate: -5, transition: jointTransition(0.35) },
    },
  };

  // Expresiones faciales
  const expressionVariants = {
    happy: { mouth: 'M 44 33 Q 50 37 56 33', browLeft: 'M 42 24 Q 45 22.5 48 24', browRight: 'M 52 24 Q 55 22.5 58 24' },
    thinking: { mouth: 'M 45 33 L 55 33', browLeft: 'M 42 24 Q 45 22.5 48 24', browRight: 'M 52 23 Q 55 21.5 58 23' },
    impressed: { mouth: 'M 42 32 Q 50 38 58 32', browLeft: 'M 42 23 Q 45 21 48 23', browRight: 'M 52 23 Q 55 21 58 23' },
    shocked: { mouth: 'M 47 33 Q 50 36 53 33', browLeft: 'M 42 23 Q 45 21 48 23', browRight: 'M 52 23 Q 55 21 58 23' },
  };

  const currentExpression = expressionVariants[expression] || expressionVariants.happy;
  const currentArm = armAnimations[animation] || armAnimations.idle;
  const currentLeg = legAnimations[animation] || legAnimations.idle;

  const handleMouseMove = (e) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const angle = (x / rect.width - 0.5) * 28;
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
      variants={bodyVariants}
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
        viewBox="0 0 100 160"
        width={sizeConfig.width}
        height={sizeConfig.height}
        style={{
          transform: `rotateY(${rotation}deg)`,
          transition: 'transform 0.25s ease-out',
          filter: isHovered
            ? 'drop-shadow(0 12px 24px rgba(0,0,0,0.22))'
            : 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))',
          overflow: 'visible',
        }}
      >
        {/* Sombra en el suelo */}
        <ellipse cx="50" cy="152" rx="22" ry="5" fill="rgba(0,0,0,0.08)" />

        {/* ── CABEZA ── */}
        <circle cx="50" cy="28" r="15" fill={skinColor} />

        {/* Cabello */}
        <path
          d="M 34 28 Q 34 13 50 13 Q 66 13 66 28 Q 63 14 50 14 Q 37 14 34 28"
          fill={hairColor}
        />

        {/* Accesorio: Gafas */}
        {accessory === 'glasses' && (
          <>
            <circle cx="43" cy="27" r="4" fill="none" stroke="#444" strokeWidth="0.9" />
            <circle cx="57" cy="27" r="4" fill="none" stroke="#444" strokeWidth="0.9" />
            <line x1="47" y1="27" x2="53" y2="27" stroke="#444" strokeWidth="0.9" />
            <line x1="34" y1="27" x2="39" y2="27" stroke="#444" strokeWidth="0.9" />
            <line x1="61" y1="27" x2="66" y2="27" stroke="#444" strokeWidth="0.9" />
          </>
        )}

        {/* Accesorio: Sombrero */}
        {accessory === 'hat' && (
          <>
            <path d="M 33 18 L 67 18 L 64 8 L 36 8 Z" fill="#5a3510" />
            <rect x="30" y="18" width="40" height="3" fill="#8b4513" rx="1" />
          </>
        )}

        {/* Accesorio: Barba */}
        {accessory === 'beard' && (
          <path
            d="M 40 35 Q 44 40 50 41 Q 56 40 60 35 Q 58 38 50 39 Q 42 38 40 35"
            fill={hairColor}
            opacity="0.75"
          />
        )}

        {/* Accesorio: Auriculares */}
        {accessory === 'headphones' && (
          <>
            <path d="M 34 26 Q 34 13 50 13 Q 66 13 66 26" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round" />
            <rect x="30" y="25" width="5" height="7" rx="2" fill="#555" />
            <rect x="65" y="25" width="5" height="7" rx="2" fill="#555" />
          </>
        )}

        {/* Ojos */}
        {eyeState === 'open' ? (
          <>
            <circle cx="44" cy="27" r="2" fill="#fff" />
            <circle cx="56" cy="27" r="2" fill="#fff" />
            <circle cx="44.6" cy="27.3" r="1.2" fill="#222" />
            <circle cx="56.6" cy="27.3" r="1.2" fill="#222" />
            <circle cx="44.2" cy="26.6" r="0.5" fill="#fff" opacity="0.9" />
            <circle cx="56.2" cy="26.6" r="0.5" fill="#fff" opacity="0.9" />
          </>
        ) : (
          <>
            <path d="M 42 27 Q 44 28.5 46 27" fill="none" stroke="#555" strokeWidth="0.9" strokeLinecap="round" />
            <path d="M 54 27 Q 56 28.5 58 27" fill="none" stroke="#555" strokeWidth="0.9" strokeLinecap="round" />
          </>
        )}

        {/* Cejas animadas */}
        <motion.path
          d={currentExpression.browLeft}
          fill="none"
          stroke={hairColor}
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ d: currentExpression.browLeft }}
          transition={{ duration: 0.25 }}
        />
        <motion.path
          d={currentExpression.browRight}
          fill="none"
          stroke={hairColor}
          strokeWidth="1"
          strokeLinecap="round"
          animate={{ d: currentExpression.browRight }}
          transition={{ duration: 0.25 }}
        />

        {/* Boca animada */}
        <motion.path
          d={currentExpression.mouth}
          fill="none"
          stroke="#555"
          strokeWidth="0.9"
          strokeLinecap="round"
          animate={{ d: currentExpression.mouth }}
          transition={{ duration: 0.25 }}
        />

        {/* ── CUELLO ── */}
        <rect x="46" y="42" width="8" height="8" rx="3" fill={skinColor} />
        {/* Pin cuello-cabeza: une la base de la cabeza con el cuello */}
        <circle cx="50" cy="43" r="4" fill={skinColor} />

        {/* ── CUERPO ── */}
        <path d="M 34 48 L 29 80 L 71 80 L 66 48 Z" fill={clothesColor} />
        {/* Detalle camisa: cuello en V */}
        <path d="M 44 48 L 50 56 L 56 48" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        {/* Detalle: botones */}
        <circle cx="50" cy="62" r="1" fill="rgba(0,0,0,0.2)" />
        <circle cx="50" cy="68" r="1" fill="rgba(0,0,0,0.2)" />
        <circle cx="50" cy="74" r="1" fill="rgba(0,0,0,0.2)" />

        {/* ══ TÉCNICA "PIN JOINT" ══
             En animación 2D profesional cada articulación tiene un círculo
             del mismo color que cubre el hueco entre segmentos, haciendo que
             el personaje parezca UNA SOLA PIEZA continua sin importar el ángulo.
             Se usa un círculo en CADA grupo (hombro y codo) para tapar
             tanto el final del segmento anterior como el inicio del siguiente. */}

        {/* ── BRAZO IZQUIERDO ── */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '100% 0%' }}
          animate={{ rotate: currentArm.shoulderLeft.rotate }}
          transition={currentArm.shoulderLeft.transition}
        >
          {/* Brazo superior */}
          <line x1="34" y1="50" x2="27" y2="66" stroke={skinColor} strokeWidth="5.5" strokeLinecap="round" />
          {/* Manguilla — cubre hombro */}
          <line x1="34" y1="50" x2="31" y2="58" stroke={clothesColor} strokeWidth="7" strokeLinecap="round" />
          {/* Pin de codo (lado hombro) — tapa el extremo del brazo superior */}
          <circle cx="27" cy="66" r="3.2" fill={skinColor} />

          {/* Codo izquierdo */}
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
            animate={{ rotate: currentArm.elbowLeft.rotate }}
            transition={currentArm.elbowLeft.transition}
          >
            {/* Pin de codo (lado antebrazo) — tapa el inicio del antebrazo */}
            <circle cx="27" cy="66" r="3.2" fill={skinColor} />
            {/* Antebrazo */}
            <line x1="27" y1="66" x2="23" y2="80" stroke={skinColor} strokeWidth="4.5" strokeLinecap="round" />
            {/* Mano */}
            <circle cx="23" cy="81" r="4.2" fill={skinColor} />
          </motion.g>
        </motion.g>

        {/* ── BRAZO DERECHO ── */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '0% 0%' }}
          animate={{ rotate: currentArm.shoulderRight.rotate }}
          transition={currentArm.shoulderRight.transition}
        >
          {/* Brazo superior */}
          <line x1="66" y1="50" x2="73" y2="66" stroke={skinColor} strokeWidth="5.5" strokeLinecap="round" />
          {/* Manguilla */}
          <line x1="66" y1="50" x2="69" y2="58" stroke={clothesColor} strokeWidth="7" strokeLinecap="round" />
          {/* Pin de codo (lado hombro) */}
          <circle cx="73" cy="66" r="3.2" fill={skinColor} />

          {/* Codo derecho */}
          <motion.g
            style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
            animate={{ rotate: currentArm.elbowRight.rotate }}
            transition={currentArm.elbowRight.transition}
          >
            {/* Pin de codo (lado antebrazo) */}
            <circle cx="73" cy="66" r="3.2" fill={skinColor} />
            {/* Antebrazo */}
            <line x1="73" y1="66" x2="77" y2="80" stroke={skinColor} strokeWidth="4.5" strokeLinecap="round" />
            {/* Mano */}
            <circle cx="77" cy="81" r="4.2" fill={skinColor} />
          </motion.g>
        </motion.g>

        {/* Pins de hombro FIJOS — van encima de ambos brazos, tapan la unión camisa↔brazo */}
        <circle cx="34" cy="50" r="4.5" fill={clothesColor} />
        <circle cx="66" cy="50" r="4.5" fill={clothesColor} />

        {/* ── PIERNAS ──
             Se renderizan ANTES de la calzoneta para que la calzoneta
             las cubra visualmente (las piernas quedan "dentro"). */}

        {/* Pierna izquierda */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
          animate={{ rotate: currentLeg.legLeft.rotate }}
          transition={currentLeg.legLeft.transition}
        >
          <line x1="41" y1="80" x2="39" y2="116" stroke={skinColor} strokeWidth="5.5" strokeLinecap="round" />
          {/* Pin de tobillo — une pierna con zapato */}
          <circle cx="39" cy="116" r="3" fill={skinColor} />
          {/* Zapato izquierdo */}
          <ellipse cx="38" cy="120" rx="7" ry="4" fill={shoesColor} />
          <ellipse cx="34.5" cy="119" rx="3.5" ry="3.5" fill={shoesColor} />
        </motion.g>

        {/* Pierna derecha */}
        <motion.g
          style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
          animate={{ rotate: currentLeg.legRight.rotate }}
          transition={currentLeg.legRight.transition}
        >
          <line x1="59" y1="80" x2="61" y2="116" stroke={skinColor} strokeWidth="5.5" strokeLinecap="round" />
          {/* Pin de tobillo */}
          <circle cx="61" cy="116" r="3" fill={skinColor} />
          {/* Zapato derecho */}
          <ellipse cx="62" cy="120" rx="7" ry="4" fill={shoesColor} />
          <ellipse cx="65.5" cy="119" rx="3.5" ry="3.5" fill={shoesColor} />
        </motion.g>

        {/* Cadera / calzoneta — va encima de las piernas para que queden "dentro" */}
        <rect x="35" y="75" width="15" height="10" rx="2" fill={clothesColor} />
        <rect x="50" y="75" width="15" height="10" rx="2" fill={clothesColor} />
        {/* Pins de cadera FIJOS — tapan la unión calzoneta↔pierna */}
        <circle cx="41" cy="80" r="3.5" fill={clothesColor} />
        <circle cx="59" cy="80" r="3.5" fill={clothesColor} />

        {/* Destello al hacer hover */}
        {isHovered && (
          <motion.circle
            cx="44"
            cy="22"
            r="1.2"
            fill="#fff"
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        )}
      </svg>
    </motion.div>
  );
};

export default Avatar3D;
