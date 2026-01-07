/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Aquí extendemos la configuración de Tailwind para que entienda nuestras variables CSS.
      // Esto nos permite usar clases como `bg-primary` o `text-accent`.
      colors: {
        // Colores de fondo basados en variables CSS
        primary: 'var(--background-primary)',
        secondary: 'var(--background-secondary)',
        tertiary: 'var(--background-tertiary)',
        hover: 'var(--background-hover)',
        
        // Colores de borde basados en variables CSS
        border: {
          DEFAULT: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
        },

        // Colores de texto basados en variables CSS
        text: {
          DEFAULT: 'var(--text-primary)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverted: 'var(--text-inverted)',
        },

        // Colores de acento basados en variables CSS
        accent: {
          DEFAULT: 'var(--accent-color)',
          strong: 'var(--accent-color-strong)',
          hover: 'var(--accent-color-hover)',
          text: 'var(--accent-text)',
          soft: 'var(--accent-soft-bg)',
        },
      },
    },
  },
  plugins: [],
}
