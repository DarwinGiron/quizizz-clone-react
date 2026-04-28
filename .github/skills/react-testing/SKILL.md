---
name: react-testing
user-invocable: true
description: '**WORKFLOW SKILL** — Especializado en testing de aplicaciones React. Enfocado en unit tests, integration tests y testing de componentes con Jest y React Testing Library. Para proyectos como Quizizz clone con Firebase, sesiones en vivo y UI escalable. USE FOR: escribir tests para componentes React, hooks personalizados, lógica de estado, integración con Firebase. DO NOT USE FOR: general coding questions; runtime debugging; testing no relacionado con React.'
---

# React Testing

## Especialización
- Unit tests para componentes y hooks
- Integration tests para flujos completos
- Testing de estado y efectos secundarios
- Mocking de Firebase y APIs
- Cobertura de código con Jest

## Contexto del Proyecto
- Aplicación React con Firebase Realtime Database
- Componentes reutilizables para quizzes y capacitaciones
- Sesiones en vivo, participantes, estadísticas

## Reglas
- Usar Jest y React Testing Library
- Tests enfocados en comportamiento, no implementación
- Mockear dependencias externas (Firebase)
- Mantener tests simples y legibles
- Ejecutar tests después de cambios para validar

## Workflow
1. Analizar el componente/hook a testear
2. Escribir tests unitarios para funciones puras y efectos
3. Crear tests de integración para interacciones UI
4. Mockear Firebase listeners y datos
5. Ejecutar tests y verificar cobertura
6. Refactorizar si es necesario para testabilidad