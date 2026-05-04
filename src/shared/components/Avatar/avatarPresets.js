/**
 * Presets de avatares predefinidos
 * Cada preset contiene configuración de apariencia, ropa, accesorios
 */

export const AVATAR_COLORS = {
  skin: [
    '#f4c2a0', // Piel clara
    '#d4a574', // Piel media clara
    '#a67c52', // Piel media
    '#704214', // Piel oscura
    '#8d5a3a', // Piel media oscura
  ],
  hair: [
    '#1a1a1a', // Negro
    '#8b4513', // Marrón
    '#daa520', // Dorado
    '#ff6b6b', // Rojo
    '#9370db', // Morado
    '#4169e1', // Azul
  ],
  clothes: [
    '#ff6b6b', // Rojo
    '#4ecdc4', // Turquesa
    '#45b7d1', // Azul claro
    '#96ceb4', // Verde
    '#ffeaa7', // Amarillo
    '#dfe6e9', // Gris
  ],
};

export const AVATAR_STYLES = {
  CASUAL: {
    id: 'casual',
    name: 'Casual',
    description: 'Ropa casual cómoda',
    colors: {
      skin: '#f4c2a0',
      hair: '#1a1a1a',
      clothes: '#4ecdc4',
      shoes: '#333333',
    },
  },
  FORMAL: {
    id: 'formal',
    name: 'Formal',
    description: 'Traje profesional',
    colors: {
      skin: '#d4a574',
      hair: '#1a1a1a',
      clothes: '#2c3e50',
      shoes: '#000000',
    },
  },
  SPORT: {
    id: 'sport',
    name: 'Deportivo',
    description: 'Ropa deportiva',
    colors: {
      skin: '#a67c52',
      hair: '#8b4513',
      clothes: '#ff6b6b',
      shoes: '#ffffff',
    },
  },
  TECH: {
    id: 'tech',
    name: 'Tech',
    description: 'Estilo tecnológico futurista',
    colors: {
      skin: '#f4c2a0',
      hair: '#4169e1',
      clothes: '#0a0e27',
      shoes: '#4169e1',
    },
  },
  CREATIVE: {
    id: 'creative',
    name: 'Creativo',
    description: 'Estilo artístico colorido',
    colors: {
      skin: '#d4a574',
      hair: '#ff6b6b',
      clothes: '#9370db',
      shoes: '#daa520',
    },
  },
};

export const AVATAR_ACCESSORIES = [
  { id: 'none', name: 'Sin accesorios', icon: '✕' },
  { id: 'glasses', name: 'Gafas', icon: '👓' },
  { id: 'hat', name: 'Sombrero', icon: '🎩' },
  { id: 'headphones', name: 'Auriculares', icon: '🎧' },
  { id: 'beard', name: 'Barba', icon: '🧔' },
];

export const DEFAULT_AVATAR_CONFIG = {
  style: 'casual',
  skinColor: '#f4c2a0',
  hairColor: '#1a1a1a',
  clothesColor: '#4ecdc4',
  shoesColor: '#333333',
  accessory: 'none',
  animation: 'idle',
};

export const AVATAR_ANIMATIONS = {
  idle: {
    name: 'Reposo',
    duration: 3,
    movements: ['sway', 'breathe'],
  },
  wave: {
    name: 'Saludando',
    duration: 1.5,
    movements: ['waveHand'],
  },
  dance: {
    name: 'Bailando',
    duration: 2,
    movements: ['hipBounce', 'armSwing'],
  },
  celebrate: {
    name: 'Celebrando',
    duration: 2,
    movements: ['jumpWithCheer'],
  },
  thinking: {
    name: 'Pensando',
    duration: 2,
    movements: ['headTilt', 'handOnChin'],
  },
};
