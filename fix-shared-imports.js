const fs = require('fs');
const path = require('path');

function fixSharedImports() {
  console.log('🔧 Arreglando todas las importaciones de shared...');
  
  function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Arreglar todas las variantes de importaciones de shared
    const sharedImportPatterns = [
      { from: /import BackButton from ['"]\.\.\//g, to: "import { BackButton } from '../../../shared';" },
      { from: /import BackButton from ['"]\.\.\//g, to: "import { BackButton } from '../../../shared';" },
      { from: /import { BackButton } from ['"]\.\.\//g, to: "import { BackButton } from '../../../shared';" },
      { from: /import Sidebar from ['"]\.\.\//g, to: "import { Sidebar } from '../../../shared';" },
      { from: /import { Sidebar } from ['"]\.\.\//g, to: "import { Sidebar } from '../../../shared';" },
    ];
    
    // Arreglar importaciones específicas
    if (content.includes('import BackButton from "../shared"')) {
      content = content.replace(/import BackButton from "\.\.\/shared"/g, 'import { BackButton } from "../../../shared"');
      updated = true;
    }
    
    if (content.includes('import { BackButton } from "../shared"')) {
      content = content.replace(/import { BackButton } from "\.\.\/shared"/g, 'import { BackButton } from "../../../shared"');
      updated = true;
    }
    
    if (content.includes('import Sidebar from "../shared"')) {
      content = content.replace(/import Sidebar from "\.\.\/shared"/g, 'import { Sidebar } from "../../../shared"');
      updated = true;
    }
    
    if (content.includes('import { Sidebar } from "../shared"')) {
      content = content.replace(/import { Sidebar } from "\.\.\/shared"/g, 'import { Sidebar } from "../../../shared"');
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
  console.log('✅ Todas las importaciones de shared arregladas');
}

fixSharedImports();
