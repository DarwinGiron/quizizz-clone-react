// Módulo de Estadísticas
// Páginas
export { default as EstadisticasTotales } from './pages/EstadisticasTotales';
export { default as SessionReport } from './pages/SessionReport';
export { default as SessionsPage } from './pages/SessionsPage';
export { default as SessionStatsAdmin } from './pages/SessionStatsAdmin';

// Componentes
export { default as SessionStats } from './components/SessionStats';

// Hooks
export { default as useSessionStats } from './hooks/useSessionStats';
export { default as useSessionReport, processSessionData, fetchSessionFeedback } from './hooks/useSessionReport';

// Utils
export * from './utils/exportReport';
export * from './utils/finalizeSession';
