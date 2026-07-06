# Capacitaciones

App de gestión de capacitaciones: React 18 + Vite + Tailwind, Firebase
(Firestore, Realtime Database y Auth).

## Desarrollo

```bash
npm install
npm run dev
```

## Build de producción

```bash
npm run build
```

## Desplegar a Firebase Hosting

Requiere [Firebase CLI](https://firebase.google.com/docs/cli) instalado
(`npm install -g firebase-tools`) y haber iniciado sesión (`firebase login`).

```bash
npm run build
firebase deploy --only hosting
```

`firebase.json` ya incluye el rewrite necesario para que las rutas de la
SPA (`/dashboard`, `/join/:id`, etc.) funcionen al recargar o entrar por
link directo, en vez de dar 404.

Antes de publicar las reglas de Firestore/Realtime Database, lee
[SEGURIDAD.md](SEGURIDAD.md) — incluye un paso crítico para no bloquearte
a ti mismo como admin.

```bash
firebase deploy --only firestore:rules,database
```
