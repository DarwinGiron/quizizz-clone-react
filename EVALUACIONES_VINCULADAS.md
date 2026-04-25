# Nueva Funcionalidad: Evaluaciones Vinculadas a Capacitaciones

## Resumen
Se ha implementado una nueva funcionalidad que permite vincular evaluaciones a capacitaciones existentes, lo que permite obtener insights valiosos sobre el comportamiento de los participantes.

## Características Implementadas

### 1. Modal de Selección de Tipo de Evaluación
- **Ubicación**: Se activa al hacer clic en "Crear nueva evaluación" en MyQuizzes
- **Opciones**:
  - **Vincular a Capacitación Existente**: Permite seleccionar una capacitación y obtener análisis avanzados
  - **Evento Aislado**: Evaluación independiente tradicional

### 2. Evaluaciones Vinculadas
- **Información almacenada**: 
  - Referencia a la capacitación
  - Tipo de evaluación
  - Datos de la capacitación vinculada
- **Visualización**: Las evaluaciones vinculadas se muestran con un badge especial "Vinculada"

### 3. Estadísticas Avanzadas de Capacitación
- **Análisis de Participación**:
  - Total de participantes
  - Participantes asignados vs. fuera de horario
  - Porcentaje de participantes fuera de horario asignado
  - Total de sesiones realizadas

- **Análisis de Horarios**:
  - Horarios más concurridos
  - Horarios menos concurridos
  - Participación por fecha
  - Patrones de asistencia

- **Insights Automatizados**:
  - Identificación de horarios pico
  - Detección de patrones anómalos
  - Recomendaciones para optimización

## Beneficios para el Análisis

### 1. Optimización de Horarios
- Identificar qué horarios tienen mayor demanda
- Detectar bloques subutilizados
- Optimizar la programación de futuras capacitaciones

### 2. Gestión de Participantes
- Monitorear cumplimiento de horarios asignados
- Detectar participantes que llegan fuera de su horario
- Mejorar la planificación de cupos

### 3. Insights de Comportamiento
- Patrones de asistencia por fecha
- Preferencias de horarios
- Tendencias de participación

## Uso de la Funcionalidad

### Para Crear una Evaluación Vinculada:
1. Ir a "Mis Quizzes"
2. Hacer clic en "Crear nueva evaluación"
3. Seleccionar "Vincular a Capacitación Existente"
4. Elegir la capacitación deseada
5. Crear la evaluación normalmente

### Para Ver Estadísticas Avanzadas:
1. En la lista de evaluaciones, buscar aquellas con el badge "Vinculada"
2. Hacer clic en el botón de estadísticas
3. Revisar los análisis detallados

## Archivos Modificados/Creados

### Nuevos Componentes:
- `TipoEvaluacionModal.jsx`: Modal para seleccionar tipo de evaluación
- `EstadisticasCapacitacionModal.jsx`: Modal con estadísticas avanzadas

### Componentes Modificados:
- `MyQuizzes.jsx`: Integración del modal y visualización de evaluaciones vinculadas
- `CreateQuiz.jsx`: Soporte para parámetros de capacitación vinculada
- `QuizForm.jsx`: Almacenamiento de información de capacitación vinculada
- `index.js`: Exportación de nuevos componentes

## Datos Almacenados

### En la colección `quizzes`:
```javascript
{
  title: "Nombre de la evaluación",
  questions: [...],
  createdAt: Date,
  linkedCapId: "id_capacitacion", // Compatibilidad hacia atrás
  tipoEvaluacion: "capacitacion" | "evento",
  capacitacionVinculada: {
    id: "id_capacitacion",
    titulo: "Título de la capacitación",
    categoria: "Categoría",
    fechaInicio: "2025-01-15",
    instructor: "Nombre del instructor",
    // ... otros campos de la capacitación
  }
}
```

## Próximas Mejoras Sugeridas

1. **Dashboard de Análisis**: Crear un dashboard dedicado para análisis de todas las evaluaciones vinculadas
2. **Reportes Exportables**: Generar reportes en PDF/Excel con las estadísticas
3. **Alertas Automáticas**: Notificaciones cuando hay muchos participantes fuera de horario
4. **Comparativas**: Comparar el rendimiento entre diferentes capacitaciones
5. **Predicciones**: Usar datos históricos para predecir demanda de horarios

Esta funcionalidad proporciona una base sólida para el análisis de comportamiento de participantes y la optimización de capacitaciones futuras.
