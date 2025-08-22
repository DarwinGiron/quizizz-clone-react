const fs = require('fs');
const path = require('path');

function fixInterModuleImports() {
  console.log('🔧 Arreglando importaciones entre módulos...');
  
  // Mapeo de componentes que se movieron a otros módulos
  const interModuleImports = {
    'AsignarParticipantesModal': '../../asignaciones',
    'SessionStats': '../../estadisticas',
    'ExportStatsModal': '../../estadisticas',
    'SeleccionTipoEvaluacion': '../../evaluaciones',
    'QuestionBuilder': '../../evaluaciones',
    'QuizForm': '../../evaluaciones',
    'EditarUsuarioModal': '../../usuarios',
    'NuevoUsuarioModal': '../../usuarios',
    'UsuarioCard': '../../usuarios',
    'ParticipanteItem': '../../usuarios',
  };
  
  function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Buscar importaciones que necesitan ser arregladas
    for (const [componentName, newPath] of Object.entries(interModuleImports)) {
      // Arreglar importaciones como: import ComponentName from './ComponentName';
      const oldImportPattern = new RegExp(`import ${componentName} from ['"]\\.\\/${componentName}['"];`, 'g');
      if (content.match(oldImportPattern)) {
        content = content.replace(oldImportPattern, `import { ${componentName} } from '${newPath}';`);
        updated = true;
      }
      
      // Arreglar importaciones como: import ComponentName from '../components/ComponentName';
      const oldImportPattern2 = new RegExp(`import ${componentName} from ['"]\\.\\.\\/components\\/${componentName}['"];`, 'g');
      if (content.match(oldImportPattern2)) {
        content = content.replace(oldImportPattern2, `import { ${componentName} } from '${newPath}';`);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Arreglado: ${filePath}`);
    }
  }
  
  // Procesar todos los archivos recursivamente
  function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        processDirectory(fullPath);
      } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
        processFile(fullPath);
      }
    }
  }
  
  processDirectory('./src/modules');
  console.log('✅ Importaciones entre módulos arregladas');
}

fixInterModuleImports();
