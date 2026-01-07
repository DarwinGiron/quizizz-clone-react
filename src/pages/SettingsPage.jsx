import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Check } from 'lucide-react';

// Un componente pequeño para visualizar la paleta
const ColorChip = ({ colorValue, name, isActive, onClick }) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 w-full"
    style={{
      borderColor: isActive ? `var(--accent-color)` : 'var(--border-primary)',
      backgroundColor: isActive ? `var(--accent-soft-bg)`: 'transparent'
    }}
  >
    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colorValue }}>
      {isActive && <Check size={20} style={{ color: 'var(--accent-text)' }}/>}
    </div>
    <span className="font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>{name}</span>
  </button>
);

const SettingsPage = () => {
  const { theme, setTheme, color, setColor, colors } = useTheme();
  const baseButtonClasses = "flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition-all duration-200 border-2";

  const colorMap = {
    purple: '#8b5cf6',
    blue: '#3b82f6',
    green: '#10b981',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto text-text-primary">
      <h1 className="text-3xl font-bold mb-8">Ajustes de Apariencia</h1>

      {/* --- SECCIÓN DE TEMA (MODO) --- */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold mb-4">Modo de Interfaz</h2>
        <div className="inline-flex gap-2">
          <button 
            onClick={() => setTheme('light')}
            className={`${baseButtonClasses} ${theme === 'light' 
              ? 'bg-accent-soft-bg border-accent text-accent-strong' 
              : 'border-transparent text-text-muted hover:bg-hover'}`}>
            <Sun size={18}/>
            Claro
          </button>
          <button 
            onClick={() => setTheme('dark')}
            className={`${baseButtonClasses} ${theme === 'dark' 
              ? 'bg-accent-soft-bg border-accent text-accent-strong' 
              : 'border-transparent text-text-muted hover:bg-hover'}`}>
            <Moon size={18}/>
            Oscuro
          </button>
        </div>
      </div>

      {/* --- SECCIÓN DE COLOR DE ACENTO --- */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Color de Acento</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {colors.map(colorName => (
            <ColorChip 
              key={colorName}
              colorValue={colorMap[colorName]}
              name={colorName}
              isActive={color === colorName}
              onClick={() => setColor(colorName)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
