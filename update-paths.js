// Script completo para actualizar todas las rutas
const fs = require('fs');
const path = require('path');

function updateFirebaseConfigPaths(dirPath) {
  if (!fs.existsSync(dirPath)) return;
  
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      updateFirebaseConfigPaths(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      updateFirebaseConfigInFile(filePath);
    }
  }
}

function updateFirebaseConfigInFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Calcular niveles de profundidad para firebase config
  const depth = filePath.split(path.sep).length - 3; // Restar 3 para llegar a src
  const backPath = '../'.repeat(depth);
  const firebasePath = `${backPath}firebase/config`;
  
  // Actualizar rutas de firebase config
  if (content.includes("'../firebase/config'")) {
    content = content.replace(/'\.\.\/firebase\/config'/g, `'${firebasePath}'`);
    updated = true;
  }
  
  if (content.includes('"../firebase/config"')) {
    content = content.replace(/"\.\.\/firebase\/config"/g, `"${firebasePath}"`);
    updated = true;
  }
  
  // Actualizar rutas de layouts
  if (content.includes("'../layouts/MainLayout'")) {
    const layoutPath = `${backPath}layouts/MainLayout`;
    content = content.replace(/'\.\.\/layouts\/MainLayout'/g, `'${layoutPath}'`);
    updated = true;
  }
  
  // Actualizar rutas de utils
  if (content.includes("'../utils/")) {
    content = content.replace(/'\.\.\/utils\//g, `'${backPath}utils/`);
    updated = true;
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Actualizado rutas: ${filePath}`);
  }
}

// Ejecutar actualización
console.log('🔄 Actualizando rutas de Firebase y otros imports...');
updateFirebaseConfigPaths('./src/modules');
console.log('✅ Actualización de rutas completada');
