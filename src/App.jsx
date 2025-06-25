import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';

import { auth } from './firebase/config';
import MainLayout from './layouts/MainLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateQuiz from './pages/CreateQuiz';
import MyQuizzes from './pages/MyQuizzes';
import QuizDetail from './pages/QuizDetail';
import PreviewQuiz from './pages/PreviewQuiz';
import EditQuiz from './pages/EditQuiz';
import LiveSession from './pages/LiveSession';
import SessionsPage from './pages/SessionsPage';
import SessionReport from './pages/SessionReport';
import SessionStats from './components/SessionStats';
import EditCapacitacion from './pages/EditCapacitacion';
import CapacitacionDetail from './pages/CapacitacionDetail';
import SeleccionTipoEvaluacion from './components/SeleccionTipoEvaluacion';
import Asignaciones from './pages/Asignaciones';
import CapacitacionesDashboard from './pages/CapacitacionesDashboard';
import CreateCapacitacion from './pages/CreateCapacitacion';
import UsuariosAdmin from './pages/UsuariosAdmin';
import GestionarCuadrilla from './pages/GestionarCuadrilla';
import HorariosPorCapacitacion from './pages/HorariosPorCapacitacion';
import AsignacionAvanzada from './pages/AsignacionAvanzada';

function PrivateRoute({ children }) {
  const [user, loading] = useAuthState(auth);
  if (loading) return <div className="p-10">Cargando...</div>;
  return user ? children : <Navigate to="/login" />;
}

function App() {
  const [user] = useAuthState(auth);

  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rutas protegidas con layout */}
        <Route path="/dashboard" element={<PrivateRoute><MainLayout><Dashboard /></MainLayout></PrivateRoute>} />
        <Route path="/create" element={<PrivateRoute><MainLayout><CreateQuiz /></MainLayout></PrivateRoute>} />
        <Route path="/myquizzes" element={<PrivateRoute><MainLayout><MyQuizzes /></MainLayout></PrivateRoute>} />
        <Route path="/quiz/:id" element={<PrivateRoute><MainLayout><QuizDetail /></MainLayout></PrivateRoute>} />
        <Route path="/edit/:id" element={<PrivateRoute><MainLayout><EditQuiz /></MainLayout></PrivateRoute>} />
        <Route path="/preview/:id" element={<PrivateRoute><MainLayout><PreviewQuiz /></MainLayout></PrivateRoute>} />
        <Route path="/live/:id" element={<PrivateRoute><MainLayout><LiveSession /></MainLayout></PrivateRoute>} />
        <Route path="/sessions/:sessionId" element={<PrivateRoute><MainLayout><SessionsPage /></MainLayout></PrivateRoute>} />
        <Route path="/sessions/:sessionId/report" element={<PrivateRoute><MainLayout><SessionReport /></MainLayout></PrivateRoute>} />
        <Route path="/sessions/:sessionId/stats" element={<PrivateRoute><MainLayout><SessionStats /></MainLayout></PrivateRoute>} />
        <Route path="/capacitaciones/:capacitacionId/horarios" element={<HorariosPorCapacitacion />} />
        {/* Capacitaciones (también protegidas y con layout) */}
        <Route path="/capacitaciones" element={<PrivateRoute><MainLayout><CapacitacionesDashboard /></MainLayout></PrivateRoute>} />
        <Route path="/capacitaciones/nueva" element={<PrivateRoute><MainLayout><CreateCapacitacion /></MainLayout></PrivateRoute>} />
        <Route path="/capacitaciones/:id/edit"element={<PrivateRoute><MainLayout><EditCapacitacion /></MainLayout></PrivateRoute>}/>
        <Route path="/capacitaciones/:id/detalle"element={<PrivateRoute><MainLayout><CapacitacionDetail /></MainLayout></PrivateRoute>}/>
        <Route path="/capacitaciones/:capacitacionId/horarios" element={<HorariosPorCapacitacion />}/>
        <Route path="/usuarios" element={<PrivateRoute><MainLayout><UsuariosAdmin /></MainLayout></PrivateRoute>}/>
        <Route path="/cuadrilla/:supervisorId"element={<PrivateRoute><MainLayout><GestionarCuadrilla /></MainLayout></PrivateRoute>}/>
        <Route path="/evaluacion/nueva" element={<PrivateRoute><MainLayout><SeleccionTipoEvaluacion /></MainLayout></PrivateRoute>}/>
        <Route path="/asignaciones" element={<Asignaciones />} />
        <Route path="/asignaciones/avanzada/:capacitacionId" element={<AsignacionAvanzada />} />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
