import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
// ELIMINADO: Ya no usamos useAuthState directamente aquí
// import { useAuthState } from 'react-firebase-hooks/auth'; 
// import { auth } from './firebase/config';
import { useAuth } from './context/AuthContext'; // <--- IMPORTAMOS useAuth

// Layout y Componentes principales
import Sidebar from './components/Sidebar';

// Páginas
import Login from './pages/Login';
import Register from './pages/Register';
import JoinLandingPage from './pages/JoinLandingPage';
import PersonnelCodeEntry from './pages/PersonnelCodeEntry';
import WaitingRoom from './pages/WaitingRoom';
import LiveSession from './pages/LiveSession';
import Dashboard from './pages/Dashboard';
import UsuariosAdmin from './pages/UsuariosAdmin';
import GestionarCuadrilla from './pages/GestionarCuadrilla';
import CapacitacionesDashboard from './pages/CapacitacionesDashboard';
import CreateCapacitacion from './pages/CreateCapacitacion';
import EditCapacitacion from './pages/EditCapacitacion';
import CapacitacionDetail from './pages/CapacitacionDetail';
import HorariosPorCapacitacion from './pages/HorariosPorCapacitacion';
import Asignaciones from './pages/Asignaciones';
import AsignacionAvanzada from './pages/AsignacionAvanzada';
import SeleccionTipoEvaluacion from './pages/SeleccionTipoEvaluacion';
import SettingsPage from './pages/SettingsPage';
import MyQuizzes from './pages/MyQuizzes';
import CreateQuiz from './pages/CreateQuiz';
import EditQuiz from './pages/EditQuiz';
import QuizDetail from './pages/QuizDetail';
import PreviewQuiz from './pages/PreviewQuiz';
import SessionsPage from './pages/SessionsPage';
import SessionReport from './pages/SessionReport';
import SessionStats from './components/SessionStats';

// --- Componente de Ruta Privada CORREGIDO ---
function PrivateRoute() {
  // Usamos nuestro contexto unificado como ÚNICA fuente de verdad.
  const { currentUser, loading } = useAuth(); 

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary text-text-primary">
        Cargando...
      </div>
    );
  }

  // Si no hay usuario, redirige a login. Si hay, muestra el contenido.
  return currentUser ? <Outlet /> : <Navigate to="/login" replace />;
}

// Componente de Diseño Principal
function AppLayout() {
  return (
    <div className="flex min-h-screen bg-primary">
      <Sidebar />
      <main className="flex-grow p-4 sm:p-6 lg:p-8 bg-primary text-text-primary">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/join" element={<JoinLandingPage />} />
        <Route path="/enter-code/:sessionId" element={<PersonnelCodeEntry />} />
        <Route path="/waiting/:sessionId" element={<WaitingRoom />} />

        {/* Rutas privadas (ahora usan el PrivateRoute corregido) */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/usuarios" element={<UsuariosAdmin />} />
            <Route path="/cuadrilla/:supervisorId" element={<GestionarCuadrilla />} />
            <Route path="/capacitaciones" element={<CapacitacionesDashboard />} />
            <Route path="/capacitaciones/nueva" element={<CreateCapacitacion />} />
            <Route path="/capacitaciones/:id/edit" element={<EditCapacitacion />} />
            <Route path="/capacitaciones/:id/detalle" element={<CapacitacionDetail />} />
            <Route path="/capacitaciones/:capacitacionId/horarios" element={<HorariosPorCapacitacion />} />
            <Route path="/asignaciones" element={<Asignaciones />} />
            <Route path="/asignaciones/avanzada/:capacitacionId" element={<AsignacionAvanzada />} />
            <Route path="/evaluacion/nueva" element={<SeleccionTipoEvaluacion />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/my-quizzes" element={<MyQuizzes />} />
            <Route path="/create-quiz" element={<CreateQuiz />} />
            <Route path="/edit-quiz/:id" element={<EditQuiz />} />
            <Route path="/quiz/:id" element={<QuizDetail />} />
            <Route path="/preview/:id" element={<PreviewQuiz />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/sessions/:sessionId/report" element={<SessionReport />} />
            <Route path="/sessions/:sessionId/stats" element={<SessionStats />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="/live/:quizId/:sessionId" element={<LiveSession />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
