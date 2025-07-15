// Script para actualizar importaciones automáticamente
const fs = require('fs');
const path = require('path');

// Mapeo de importaciones nuevas
const importMappings = {
  // Componentes compartidos
  "'../components/Sidebar'": "'../shared'",
  '"../components/Sidebar"': '"../shared"',
  "'../components/BackButton'": "'../shared'",
  '"../components/BackButton"': '"../shared"',
  
  // Páginas de asignaciones
  "'../pages/AsignacionAvanzada'": "'../modules/asignaciones'",
  "'../pages/Asignaciones'": "'../modules/asignaciones'",
  "'../pages/AsignacionIntuitiva'": "'../modules/asignaciones'",
  
  // Páginas de capacitaciones
  "'../pages/CapacitacionDetail'": "'../modules/capacitaciones'",
  "'../pages/CapacitacionesDashboard'": "'../modules/capacitaciones'",
  "'../pages/CreateCapacitacion'": "'../modules/capacitaciones'",
  "'../pages/EditCapacitacion'": "'../modules/capacitaciones'",
  "'../pages/HorariosPorCapacitacion'": "'../modules/capacitaciones'",
  
  // Páginas de usuarios
  "'../pages/UsuariosAdmin'": "'../modules/usuarios'",
  "'../pages/GestionarCuadrilla'": "'../modules/usuarios'",
  
  // Páginas de evaluaciones
  "'../pages/CreateQuiz'": "'../modules/evaluaciones'",
  "'../pages/EditQuiz'": "'../modules/evaluaciones'",
  "'../pages/MyQuizzes'": "'../modules/evaluaciones'",
  "'../pages/PreviewQuiz'": "'../modules/evaluaciones'",
  "'../pages/QuizDetail'": "'../modules/evaluaciones'",
  "'../pages/JoinSession'": "'../modules/evaluaciones'",
  "'../pages/LiveSession'": "'../modules/evaluaciones'",
  
  // Páginas de estadísticas
  "'../pages/EstadisticasTotales'": "'../modules/estadisticas'",
  "'../pages/SessionReport'": "'../modules/estadisticas'",
  "'../pages/SessionsPage'": "'../modules/estadisticas'",
  "'../pages/SessionStatsAdmin'": "'../modules/estadisticas'",
  
  // Páginas de auth
  "'../pages/Login'": "'../modules/auth'",
  "'../pages/Register'": "'../modules/auth'",
  
  // Dashboard
  "'../pages/Dashboard'": "'../modules/dashboard'",
  
  // Componentes
  "'../components/AsignarParticipantesModal'": "'../modules/asignaciones'",
  "'../components/HorarioCard'": "'../modules/capacitaciones'",
  "'../components/GestionarHorariosModal'": "'../modules/capacitaciones'",
  "'../components/EditarUsuarioModal'": "'../modules/usuarios'",
  "'../components/NuevoSupervisorModal'": "'../modules/usuarios'",
  "'../components/NuevoUsuarioModal'": "'../modules/usuarios'",
  "'../components/UsuarioCard'": "'../modules/usuarios'",
  "'../components/ImportarCuadrillaModal'": "'../modules/usuarios'",
  "'../components/ParticipanteItem'": "'../modules/usuarios'",
  "'../components/QuestionBuilder'": "'../modules/evaluaciones'",
  "'../components/QuestionCard'": "'../modules/evaluaciones'",
  "'../components/QuizForm'": "'../modules/evaluaciones'",
  "'../components/SeleccionTipoEvaluacion'": "'../modules/evaluaciones'",
  "'../components/StartLiveSessionButton'": "'../modules/evaluaciones'",
  "'../components/SessionStats'": "'../modules/estadisticas'",
  "'../components/ExportStatsModal'": "'../modules/estadisticas'",
};

function updateImportsInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Actualizar importaciones
  for (const [oldImport, newImport] of Object.entries(importMappings)) {
    if (content.includes(oldImport)) {
      content = content.replace(new RegExp(oldImport, 'g'), newImport);
      updated = true;
    }
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Actualizado: ${filePath}`);
  }
}

function updateImportsInDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      updateImportsInDirectory(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      updateImportsInFile(filePath);
    }
  }
}

// Ejecutar actualización
console.log('🔄 Actualizando importaciones...');
updateImportsInDirectory('./src');
console.log('✅ Actualización completada');
