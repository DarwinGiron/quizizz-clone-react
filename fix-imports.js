const fs = require('fs');
const path = require('path');

function fixAllImports() {
  console.log('🔧 Arreglando todas las importaciones...');
  
  // Directorio de módulos
  const modulesDir = './src/modules';
  
  // Función para procesar archivos
  function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Arreglar importaciones de shared
    if (content.includes('import Sidebar from \'../../shared\'')) {
      content = content.replace(/import Sidebar from '\.\.\/\.\.\/shared'/g, "import { Sidebar } from '../../../shared'");
      updated = true;
    }
    
    if (content.includes('import { BackButton } from \'../../shared\'')) {
      content = content.replace(/import { BackButton } from '\.\.\/\.\.\/shared'/g, "import { BackButton } from '../../../shared'");
      updated = true;
    }
    
    if (content.includes('import BackButton from \'../../shared\'')) {
      content = content.replace(/import BackButton from '\.\.\/\.\.\/shared'/g, "import { BackButton } from '../../../shared'");
      updated = true;
    }
    
    // Arreglar importaciones de Firebase
    if (content.includes("'../../firebase/config'")) {
      content = content.replace(/'\.\.\/\.\.\/firebase\/config'/g, "'../../../firebase/config'");
      updated = true;
    }
    
    if (content.includes('"../../firebase/config"')) {
      content = content.replace(/"\.\.\/\.\.\/firebase\/config"/g, '"../../../firebase/config"');
      updated = true;
    }
    
    // Arreglar importaciones de layouts
    if (content.includes("'../../layouts/MainLayout'")) {
      content = content.replace(/'\.\.\/\.\.\/layouts\/MainLayout'/g, "'../../../layouts/MainLayout'");
      updated = true;
    }
    
    // Arreglar importaciones de utils
    if (content.includes("'../../utils/")) {
      content = content.replace(/'\.\.\/\.\.\/utils\//g, "'../../../utils/");
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
  
  processDirectory(modulesDir);
  console.log('✅ Todas las importaciones arregladas');
}

fixAllImports();
