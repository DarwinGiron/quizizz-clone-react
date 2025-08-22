const fs = require('fs');
const path = require('path');

function fixBadImports() {
  console.log('🔧 Arreglando importaciones incorrectas...');
  
  function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Arreglar importaciones como: from '../modules/evaluaciones'
    if (content.includes("from '../modules/evaluaciones'")) {
      content = content.replace(/from '\.\.\/modules\/evaluaciones'/g, "from '../components'");
      updated = true;
    }
    
    // Arreglar importaciones como: from '../modules/asignaciones'
    if (content.includes("from '../modules/asignaciones'")) {
      content = content.replace(/from '\.\.\/modules\/asignaciones'/g, "from '../components'");
      updated = true;
    }
    
    // Arreglar importaciones como: from '../modules/usuarios'
    if (content.includes("from '../modules/usuarios'")) {
      content = content.replace(/from '\.\.\/modules\/usuarios'/g, "from '../components'");
      updated = true;
    }
    
    // Arreglar importaciones como: from '../modules/capacitaciones'
    if (content.includes("from '../modules/capacitaciones'")) {
      content = content.replace(/from '\.\.\/modules\/capacitaciones'/g, "from '../components'");
      updated = true;
    }
    
    // Arreglar importaciones como: from '../modules/estadisticas'
    if (content.includes("from '../modules/estadisticas'")) {
      content = content.replace(/from '\.\.\/modules\/estadisticas'/g, "from '../components'");
      updated = true;
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
  console.log('✅ Importaciones incorrectas arregladas');
}

fixBadImports();
