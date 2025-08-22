# 🏗️ Arquitectura Modular del Proyecto

## 📁 Estructura de Módulos

El proyecto ha sido reestructurado siguiendo una arquitectura modular basada en características (feature-based architecture) para mejorar la mantenibilidad y escalabilidad.

### 📋 Estructura General

```
src/
├── modules/
│   ├── asignaciones/          # Módulo de Asignaciones
│   ├── capacitaciones/        # Módulo de Capacitaciones
│   ├── usuarios/             # Módulo de Gestión de Usuarios
│   ├── evaluaciones/         # Módulo de Evaluaciones/Quizzes
│   ├── estadisticas/         # Módulo de Estadísticas y Reportes
│   ├── auth/                 # Módulo de Autenticación
│   ├── dashboard/            # Módulo de Dashboard Principal
│   └── index.js              # Exportaciones centralizadas
├── shared/                   # Componentes compartidos
│   ├── components/           # Componentes reutilizables
│   ├── layouts/              # Layouts del sistema
│   ├── hooks/                # Hooks personalizados
│   └── utils/                # Utilidades generales
├── firebase/                 # Configuración de Firebase
└── styles/                   # Estilos globales
```

## 🎯 Módulos Principales

### 1. **Asignaciones** (`/modules/asignaciones/`)
- **Páginas**: AsignacionAvanzada, Asignaciones, AsignacionIntuitiva
- **Componentes**: AsignarParticipantesModal
- **Funcionalidad**: Gestión de asignaciones de personal a capacitaciones

### 2. **Capacitaciones** (`/modules/capacitaciones/`)
- **Páginas**: CapacitacionDetail, CapacitacionesDashboard, CreateCapacitacion, EditCapacitacion, HorariosPorCapacitacion
- **Componentes**: HorarioCard, GestionarHorariosModal
- **Funcionalidad**: Gestión completa de capacitaciones y horarios

### 3. **Usuarios** (`/modules/usuarios/`)
- **Páginas**: UsuariosAdmin, GestionarCuadrilla
- **Componentes**: EditarUsuarioModal, NuevoSupervisorModal, NuevoUsuarioModal, UsuarioCard, ImportarCuadrillaModal, ParticipanteItem
- **Funcionalidad**: Administración de usuarios y cuadrillas

### 4. **Evaluaciones** (`/modules/evaluaciones/`)
- **Páginas**: CreateQuiz, EditQuiz, MyQuizzes, PreviewQuiz, QuizDetail, JoinSession, LiveSession
- **Componentes**: QuestionBuilder, QuestionCard, QuizForm, SeleccionTipoEvaluacion, StartLiveSessionButton
- **Funcionalidad**: Creación y gestión de evaluaciones/quizzes

### 5. **Estadísticas** (`/modules/estadisticas/`)
- **Páginas**: EstadisticasTotales, SessionReport, SessionsPage, SessionStatsAdmin
- **Componentes**: SessionStats, ExportStatsModal
- **Funcionalidad**: Reportes y análisis estadísticos

### 6. **Autenticación** (`/modules/auth/`)
- **Páginas**: Login, Register
- **Funcionalidad**: Sistema de autenticación y registro

### 7. **Dashboard** (`/modules/dashboard/`)
- **Páginas**: Dashboard
- **Funcionalidad**: Panel principal del sistema

## 📝 Cómo Usar la Nueva Estructura

### Importaciones Centralizadas
```javascript
// Desde cualquier archivo, puedes importar así:
import { 
  AsignacionIntuitiva, 
  CapacitacionesDashboard, 
  UsuariosAdmin 
} from '../modules';

// O específicamente desde un módulo:
import { AsignacionIntuitiva } from '../modules/asignaciones';
```

### Agregar Nuevos Componentes
1. Coloca el componente en la carpeta correspondiente del módulo
2. Actualiza el `index.js` del módulo para exportarlo
3. El componente estará disponible automáticamente desde `../modules`

### Estructura de Cada Módulo
```
modulo/
├── components/     # Componentes específicos del módulo
├── pages/          # Páginas del módulo
├── hooks/          # Hooks personalizados del módulo
└── index.js        # Exportaciones del módulo
```

## 🔧 Beneficios de Esta Estructura

1. **Organización Clara**: Cada funcionalidad está agrupada lógicamente
2. **Mantenibilidad**: Fácil localizar y modificar código relacionado
3. **Escalabilidad**: Agregar nuevas funcionalidades es más sencillo
4. **Reutilización**: Componentes organizados por contexto
5. **Importaciones Limpias**: Sistema de importaciones centralizado

## 🚀 Próximos Pasos

1. Actualizar todas las importaciones en los archivos existentes
2. Agregar hooks personalizados a cada módulo según sea necesario
3. Crear componentes compartidos en la carpeta `shared/`
4. Implementar lazy loading para optimizar el rendimiento

---

*Esta estructura modular facilita el desarrollo colaborativo y el mantenimiento a largo plazo del sistema.*
