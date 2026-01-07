import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Nombres de los temas y colores que usaremos
const THEMES = ['light', 'dark'];
const COLORS = ['purple', 'blue', 'green'];

export const ThemeProvider = ({ children }) => {
  // Intenta leer las preferencias guardadas, o usa los valores por defecto
  const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');
  const [color, setColor] = useState(() => localStorage.getItem('app-color') || 'purple');

  // Efecto para aplicar las clases al elemento <html>
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Limpia clases de temas y colores anteriores
    root.classList.remove(...THEMES);
    root.classList.remove(...COLORS.map(c => `theme-${c}`));

    // Añade las clases actuales
    root.classList.add(theme); // 'light' o 'dark'
    root.classList.add(`theme-${color}`); // 'theme-purple', 'theme-blue', etc.

    // Guarda las preferencias en localStorage
    localStorage.setItem('app-theme', theme);
    localStorage.setItem('app-color', color);

  }, [theme, color]); // Se ejecuta cada vez que el tema o el color cambian

  return (
    <ThemeContext.Provider value={{ theme, setTheme, color, setColor, themes: THEMES, colors: COLORS }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook personalizado para acceder fácilmente al contexto del tema
export const useTheme = () => useContext(ThemeContext);
