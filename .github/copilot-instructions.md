## Copilot / AI agent instructions — quizizz-clone-react

Breve: este repo es una SPA React creada con Vite, organizada por *módulos feature-based* en `src/modules`. A continuación se enumeran las pautas prácticas y ejemplos que ayudan a un agente a ser productivo inmediatamente.

- **Arquitectura (alto nivel):** aplicación cliente React + Vite. Las features están en `src/modules/*` (cada módulo exporta páginas y componentes desde su `index.js`). La app arranca en `src/main.jsx` y monta `App`.

- **Flujos de datos y boundaries:** UI <-> Firebase (Firestore + Realtime DB) + Auth. La configuración de Firebase está en `src/firebase/config.js` (exporta `db`, `rtdb`, `auth`). Mantén las llamadas a datos dentro de hooks o módulos `hooks/` del feature.

- **Comandos dev / build:** usar scripts en `package.json`:
  - `npm run dev` — arranque con Vite (HMR).
  - `npm run build` — build de producción.
  - `npm run preview` — vista previa del build.

- **Dependencias claves:** `react`, `react-dom`, `react-router-dom@7`, `firebase` (está presente en uso), `tailwindcss` + `postcss`, `@vitejs/plugin-react`. Evita actualizar sin comprobar compatibilidad de `react-router-dom` v7.

- **Convenciones específicas del repo:**
  - Cada feature en `src/modules/<feature>/` tiene carpetas `components/`, `pages/`, `hooks/` y un `index.js` que re-exporta. Ej: `src/modules/capacitaciones/index.js`.
  - Componentes compartidos se encuentran en `src/shared/components` y `src/shared/contexts`.
  - Hay duplicación deliberada de algunas páginas bajo `src/pages/` y `src/modules/.../pages/` — prefer usar las exportaciones del módulo para navegación centralizada (`src/modules/index.js`).

- **Patrones de import/export:** centralizar exports en `src/modules/index.js` (usa `export * from './asignaciones'` etc.). Cuando añades un nuevo componente/página, actualiza el `index.js` del módulo y `src/modules/index.js` si es necesario.

- **Scripts de repo y utilidades locales:** hay scripts como `fix-imports.js` y `update-imports.js` en la raíz; úsalos si cambias rutas o mueves archivos para mantener imports coherentes.

- **Estilado:** Tailwind está configurado (`tailwind.config.js`, `postcss.config.js`). Los estilos globales están en `src/index.css` y `src/App.css`.

- **Rutas y navegación:** usan `react-router-dom`; la configuración de rutas está repartida por módulos y layouts (`src/shared/components/Layout.jsx`, `src/routes/`). Reexportar páginas desde el módulo facilita la integración en el enrutador.

- **Buenas prácticas detectables (hacer):**
  - Siga la estructura del módulo: colocar hooks en `hooks/`, componentes en `components/`, páginas en `pages/`.
  - Registrar cualquier cambio de API de Firebase en `src/firebase/config.js` y buscar usages con `grep` antes de cambiar.
  - Al cambiar exports de módulos, ejecutar los scripts de arreglos de import (`node fix-imports.js`) y confirmar `npm run dev` inicia sin errores.

- **Qué evitar:**
  - No romper la API pública de un módulo sin actualizar sus `index.js` y los puntos que lo importan.
  - No actualizar `react-router-dom` sin verificar migraciones (esta app usa v7).

- **Ejemplos concretos:**
  - Añadir página: crear `src/modules/miModulo/pages/Nueva.jsx`, exportar desde `src/modules/miModulo/index.js` y luego usar desde `src/modules/index.js`.
  - Acceso a datos: revisar `src/firebase/config.js` y usar `db`/`rtdb` en hooks dentro de `src/modules/<feature>/hooks`.

- **Checklist de PRs (útil para agentes que generan cambios):**
  1. Mantener estructura `modules/*` y actualizar `index.js` del módulo.
 2. Ejecutar `node fix-imports.js` si se mueven/renombrar archivos.
 3. Correr `npm run dev` y verificar consola por errores de importación.
 4. Probar rutas afectadas en la UI (navegación manual).

- **Dónde buscar más contexto:** `README.md` raíz (Vite), `src/modules/` (patrón principal), `src/firebase/config.js` (integración externa), `fix-imports.js` (herramientas del repo).

Si algo no queda claro o quieres que añada ejemplos de reglas de lint/PR más detalladas, dime qué sección expandir. Gracias.
