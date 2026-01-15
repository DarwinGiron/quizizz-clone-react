import React from 'react';
import { useTheme } from '../context/ThemeContext'; // Corregido: Usar el hook personalizado
import { Sun, Moon } from 'lucide-react';

const Ajustes = () => {
  // Usamos el hook que nos da acceso al estado y a la función para cambiarlo
  const { theme, setTheme } = useTheme();

  // Creamos la función para alternar el tema aquí mismo
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-6">Ajustes</h1>
      
      <div className="max-w-md mx-auto bg-secondary p-6 rounded-xl border border-border-secondary">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Apariencia</h2>
        
        <div className="flex items-center justify-between">
          <p className="text-text-muted">Tema de la aplicación</p>
          <button 
            onClick={toggleTheme} // Ahora esto funciona
            className="flex items-center gap-2 bg-primary px-4 py-2 rounded-lg border border-border hover:bg-hover transition-colors"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span className="font-semibold">{theme === 'light' ? 'Oscuro' : 'Claro'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Ajustes;
