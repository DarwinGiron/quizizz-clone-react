# 🎭 Sistema de Avatares Interactivos - Documentación

## 📋 Descripción General

Sistema completo de avatares 3D animados para aplicaciones web con React. Incluye:

✅ **Avatares de cuerpo completo** - Figura humana completa personalizable
✅ **Animaciones interactivas** - Reposo, saludando, bailando, celebrando
✅ **Personalización visual** - Colores de piel, cabello, ropa, accesorios
✅ **Modo interactivo** - Los avatares responden a movimientos del mouse
✅ **Lobby de sesión** - Vista de todos los participantes con códigos (estilo Waygrow)
✅ **Totalmente animado** - Transiciones suaves con Framer Motion

---

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install three @react-three/fiber @react-three/drei framer-motion --legacy-peer-deps
```

### 2. Usar el Componente Avatar3D

```jsx
import { Avatar3D, DEFAULT_AVATAR_CONFIG } from '@/shared/components/Avatar';

export default function MyComponent() {
  return (
    <Avatar3D 
      config={DEFAULT_AVATAR_CONFIG}
      animation="idle"
      size="md"
      interactive={true}
    />
  );
}
```

### 3. Personalizar Avatar

```jsx
import { Avatar3D } from '@/shared/components/Avatar';

const customConfig = {
  skinColor: '#d4a574',
  hairColor: '#ff6b6b',
  clothesColor: '#4ecdc4',
  shoesColor: '#333333',
  accessory: 'glasses',
};

export default function CustomAvatar() {
  return (
    <Avatar3D 
      config={customConfig}
      animation="wave"
      size="lg"
    />
  );
}
```

---

## 📦 Componentes Disponibles

### Avatar3D
Componente principal que renderiza el avatar 3D.

**Props:**
- `config` (object) - Configuración del avatar
- `animation` (string) - Tipo de animación: `'idle'`, `'wave'`, `'dance'`, `'celebrate'`, `'thinking'`
- `size` (string) - Tamaño: `'sm'` (120x180), `'md'` (200x300), `'lg'` (300x450)
- `interactive` (boolean) - Habilitar efecto de seguimiento de mouse
- `onAnimationComplete` (function) - Callback cuando termina animación

```jsx
<Avatar3D 
  config={{...}}
  animation="dance"
  size="md"
  interactive={true}
/>
```

### AvatarCustomizer
Interfaz completa para personalizar avatares con tabs y selector de colores.

**Props:**
- `initialConfig` (object) - Configuración inicial
- `onAvatarChange` (function) - Callback cuando cambia avatar

```jsx
<AvatarCustomizer 
  initialConfig={DEFAULT_AVATAR_CONFIG}
  onAvatarChange={(config) => console.log(config)}
/>
```

### ParticipantCard
Muestra un participante con avatar, nombre, código y puntuación.

**Props:**
- `userId` (string) - ID único del participante
- `userName` (string) - Nombre del participante
- `avatarConfig` (object) - Configuración del avatar
- `participantCode` (string) - Código de acceso (ej: "W7K3")
- `score` (number) - Puntuación actual
- `isActive` (boolean) - Si está activo en la sesión
- `animation` (string) - Tipo de animación

```jsx
<ParticipantCard
  userId="user123"
  userName="Juan García"
  avatarConfig={avatarConfig}
  participantCode="W7K3"
  score={450}
  isActive={true}
  animation="idle"
/>
```

### ParticipantLobby
Vista de lobby con grid de todos los participantes.

**Props:**
- `participants` (array) - Array de objetos de participantes
- `title` (string) - Título de la sesión
- `maxColumns` (number) - Máximo de columnas en la grid

```jsx
<ParticipantLobby
  participants={[
    {
      userId: '1',
      userName: 'María',
      avatarConfig: {...},
      code: 'A1B2',
      score: 500,
      isActive: true,
    }
  ]}
  title="Sesión en vivo"
  maxColumns={4}
/>
```

---

## 🎨 Estilos Predefinidos

### AVATAR_STYLES
Contiene 5 estilos de avatar predefinidos:

1. **CASUAL** - Ropa casual cómoda
   - Colores: Turquesa, Negro, Piel clara
   
2. **FORMAL** - Traje profesional
   - Colores: Gris oscuro, Negro, Piel media
   
3. **SPORT** - Ropa deportiva
   - Colores: Rojo, Blanco, Piel oscura
   
4. **TECH** - Estilo tecnológico futurista
   - Colores: Negro, Azul, Piel clara
   
5. **CREATIVE** - Estilo artístico colorido
   - Colores: Morado, Dorado, Piel media

```jsx
import { AVATAR_STYLES } from '@/shared/components/Avatar';

const casualStyle = AVATAR_STYLES.CASUAL;
// { id: 'casual', name: 'Casual', description: '...', colors: {...} }
```

---

## 🎨 Personalización de Colores

### AVATAR_COLORS
Paleta de colores disponibles:

```jsx
import { AVATAR_COLORS } from '@/shared/components/Avatar';

// Colores de piel disponibles
AVATAR_COLORS.skin
// ['#f4c2a0', '#d4a574', '#a67c52', '#704214', '#8d5a3a']

// Colores de cabello
AVATAR_COLORS.hair
// ['#1a1a1a', '#8b4513', '#daa520', '#ff6b6b', '#9370db', '#4169e1']

// Colores de ropa
AVATAR_COLORS.clothes
// ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9']
```

---

## ✨ Accesorios

### AVATAR_ACCESSORIES
5 accesorios disponibles:

- `'none'` - Sin accesorios
- `'glasses'` - Gafas (👓)
- `'hat'` - Sombrero (🎩)
- `'headphones'` - Auriculares (🎧)
- `'beard'` - Barba (🧔)

```jsx
const config = {
  ...DEFAULT_AVATAR_CONFIG,
  accessory: 'glasses'
};
```

---

## 🎬 Animaciones

### Tipos de Animaciones

| Animación | Efecto | Duración |
|-----------|--------|----------|
| `idle` | Balanceo suave y respiración | 3s |
| `wave` | Saludando con la mano | 1.5s |
| `dance` | Movimientos de baile | 2s |
| `celebrate` | Saltando de celebración | 2s |
| `thinking` | Pensando con mano en barbilla | 2s |

```jsx
// Cambiar animación
const [animation, setAnimation] = useState('idle');

// Hacer que baile
setTimeout(() => setAnimation('dance'), 1000);
```

---

## 🔧 Hook: useAvatar

Hook para manejar estado global de avatares.

```jsx
import { useAvatar } from '@/shared/components/Avatar';

export default function Component() {
  const { 
    avatarConfig,           // Config actual
    updateAvatarConfig,     // Actualizar config
    saveUserAvatar,         // Guardar avatar de usuario
    getUserAvatar           // Obtener avatar de usuario
  } = useAvatar();

  // Actualizar configuración
  updateAvatarConfig({
    hairColor: '#ff6b6b',
    accessory: 'hat'
  });

  // Guardar avatar de usuario
  saveUserAvatar('user123', avatarConfig);

  // Obtener avatar de usuario
  const userAvatar = getUserAvatar('user123');
}
```

### AvatarProvider

Envuelve tu aplicación para habilitar el hook:

```jsx
import { AvatarProvider } from '@/shared/components/Avatar';

export default function App() {
  return (
    <AvatarProvider>
      <YourApp />
    </AvatarProvider>
  );
}
```

---

## 📋 Estructura de Datos

### DEFAULT_AVATAR_CONFIG
```javascript
{
  style: 'casual',              // Estilo predefinido
  skinColor: '#f4c2a0',        // Color de piel (hex)
  hairColor: '#1a1a1a',        // Color de cabello (hex)
  clothesColor: '#4ecdc4',     // Color de ropa (hex)
  shoesColor: '#333333',       // Color de zapatos (hex)
  accessory: 'none',           // Accesorio
  animation: 'idle'            // Animación actual
}
```

### Objeto Participante
```javascript
{
  userId: 'string',            // ID único
  userName: 'string',          // Nombre mostrado
  avatarConfig: {...},         // Config del avatar
  code: 'string',              // Código de sesión (ej: "W7K3")
  score: number,               // Puntuación actual
  isActive: boolean,           // Estado en sesión
  animation: 'string'          // Animación actual
}
```

---

## 🎯 Casos de Uso

### 1. Registro con Avatar Personalizado
```jsx
// En Register.jsx
import { AvatarCustomizer } from '@/shared/components/Avatar';

<AvatarCustomizer 
  onAvatarChange={(config) => {
    // Guardar en Firebase
    saveUserProfile(user.uid, { avatarConfig: config });
  }}
/>
```

### 2. Sesión en Vivo con Participantes
```jsx
import { ParticipantLobby } from '@/shared/components/Avatar';

<ParticipantLobby 
  participants={participantsList}
  title="Capacitación React 2026"
  maxColumns={4}
/>
```

### 3. Galería de Avatares
```jsx
// Ver AvatarGallery.jsx para implementación completa
import AvatarGallery from '@/modules/evaluaciones/pages/AvatarGallery';

<AvatarGallery />
```

### 4. Perfil de Usuario
```jsx
<Avatar3D 
  config={userAvatarConfig}
  size="lg"
  animation="idle"
  interactive={true}
/>
```

---

## 🌐 Integración con Firebase

### Guardar Avatar de Usuario
```javascript
// En Firestore
db.collection('users').doc(userId).set({
  userName: 'Juan García',
  avatarConfig: {
    style: 'casual',
    skinColor: '#f4c2a0',
    hairColor: '#8b4513',
    clothesColor: '#4ecdc4',
    shoesColor: '#333333',
    accessory: 'glasses'
  },
  email: 'juan@example.com'
});
```

### Cargar Avatar de Usuario
```javascript
const userDoc = await db.collection('users').doc(userId).get();
const avatarConfig = userDoc.data().avatarConfig;
<Avatar3D config={avatarConfig} />;
```

---

## 🎯 Estructura de Carpetas

```
src/shared/components/Avatar/
├── Avatar3D.jsx                  # Componente principal SVG
├── AvatarCustomizer.jsx          # Selector personalización
├── ParticipantCard.jsx           # Tarjeta participante
├── ParticipantLobby.jsx          # Vista lobby
├── useAvatarStore.js             # Hook estado global
├── avatarPresets.js              # Constantes y estilos
└── index.js                      # Exportaciones
```

---

## 💡 Tips y Buenas Prácticas

✅ **Usar DEFAULT_AVATAR_CONFIG** como base y sobrescribir propiedades
✅ **AvatarProvider en App.jsx** para acceso global
✅ **Tamaño 'md'** para la mayoría de usos
✅ **Guardar avatarConfig en Firestore** bajo el documento del usuario
✅ **Usar animaciones diferentes** para participantes activos
✅ **Interactive={true}** solo en avatares que el usuario puede ver

---

## 🚀 Próximas Mejoras

- [ ] Exportar/importar configuraciones de avatar
- [ ] Editor visual avanzado con preview en tiempo real
- [ ] Integración con Three.js para avatares 3D reales
- [ ] Animaciones personalizadas
- [ ] Compatibilidad con WebGL
- [ ] Sistema de insignias y decoraciones

---

## 📧 Soporte

Para preguntas o sugerencias sobre el sistema de avatares, contacta al equipo de desarrollo.

**Última actualización:** Mayo 2026
