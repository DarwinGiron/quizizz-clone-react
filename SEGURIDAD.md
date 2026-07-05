# Seguridad — Capacitaciones

Este documento explica cómo publicar las reglas de seguridad y cómo migrar a
los supervisores existentes al nuevo esquema de autenticación real.

## 0. Antes de publicar cualquier regla: verifica tu rol de admin

Las reglas nuevas (`firestore.rules`) deciden quién es administrador leyendo
el campo `rol` del documento `usuarios/{tu-uid}`. **Si tu propio documento no
tiene `rol: "admin"`, quedarás bloqueado de tu propia base de datos en cuanto
publiques las reglas.**

Pasos para verificar/corregir esto ANTES de publicar:

1. Entra a la app con tu cuenta de admin y anota tu UID (Firebase Console →
   Authentication → Users, busca tu email y copia el "User UID").
2. Firebase Console → Firestore Database → colección `usuarios` → busca el
   documento cuyo ID sea ese UID.
   - Si no existe, créalo con al menos: `{ rol: "admin", nombre: "Tu nombre" }`.
   - Si existe, agrega/edita el campo `rol` a `"admin"` si no lo tiene.
3. Recién entonces continúa con el paso 1 de abajo.

## 1. Publicar las reglas de Firestore

1. Firebase Console → tu proyecto (`capacitaciones-web-app`) → Firestore
   Database → pestaña **Reglas**.
2. Borra el contenido actual y pega el contenido completo del archivo
   `firestore.rules` (raíz del proyecto).
3. Clic en **Publicar**.
4. Prueba de inmediato: recarga la app logueado como admin y como un
   supervisor de prueba, confirma que Dashboard, Usuarios, Capacitaciones y
   Asignaciones cargan datos con normalidad.

## 2. Publicar las reglas de Realtime Database

1. Firebase Console → **Realtime Database** → pestaña **Reglas**.
2. Pega el contenido completo de `database.rules.json`.
3. Publicar.
4. Prueba: abre `/join` en una pestaña de incógnito (participante sin
   cuenta) y confirma que puede unirse a una sesión en vivo y responder.

### Limitación conocida de las reglas de RTDB

Los participantes de una sesión en vivo (ruta pública `/join`) **no inician
sesión** — no tienen token de Firebase Auth. Por diseño, esto significa que
`participants`, `answers`, `feedback` y `countdown` dentro de una
`liveSessions/{id}` quedan con escritura abierta (`.write: true`), con
validación mínima de estructura, no de identidad. Es el mismo nivel de
protección que tenía la app antes de este cambio, pero documentarlo es
importante: alguien con el link/código de una sesión activa podría enviar
datos falsos a esa sesión puntual. Endurecer esto requeriría migrar a
**Firebase Anonymous Auth** para los participantes (cada uno obtiene un uid
real sin registrarse), lo cual queda fuera del alcance de este cambio.

## 3. Migrar supervisores existentes ("Activar acceso seguro")

Antes de este cambio, los supervisores se guardaban con su contraseña en
texto plano en el documento `usuarios/{id}` (campo `contraseña`). Esos
documentos siguen existiendo tal cual hasta que el admin los migra.

1. Entra como admin → **Usuarios**.
2. En cada tarjeta de supervisor sin acceso seguro verás la etiqueta
   ⚠️ **"Sin acceso seguro"** y un botón **"Activar acceso seguro"**.
3. Clic en el botón → escribe una contraseña temporal (mínimo 6 caracteres)
   → **Activar**.
4. Esto crea una cuenta real de Firebase Auth para ese supervisor (con email
   interno `usuario@supervisores.app`) y borra el campo de contraseña en
   texto plano de Firestore.
5. **Comunícale la contraseña nueva al supervisor** por un canal seguro
   (no queda registrada en ningún otro lugar después de este paso).
6. El supervisor entra exactamente igual que antes: su usuario + su
   contraseña en el login normal.

Repite esto para cada supervisor legacy. Los supervisores creados desde hoy
en adelante (modal "Nuevo Supervisor") ya se crean con acceso seguro desde
el principio — no necesitan este paso.

## 4. Restablecer la contraseña de un supervisor

Si un supervisor ya migrado olvida su contraseña, **no hay una pantalla en
la app para esto** (crearla requeriría el Admin SDK de Firebase, que solo
puede correr en un backend, no en el navegador). El camino oficial:

1. Firebase Console → Authentication → Users.
2. Busca el email interno del supervisor: `<su-usuario>@supervisores.app`.
3. Menú de tres puntos → **Restablecer contraseña** (o elimina y vuelve a
   crear la cuenta y actualiza el campo `authUid` del doc en Firestore).
4. Comunícale la contraseña nueva al supervisor.

## Resumen de qué cambió

- Los supervisores ahora tienen cuentas reales de Firebase Auth (email
  sintético `usuario@supervisores.app`), no una comparación de contraseña
  en el cliente.
- El campo `contraseña`/`contrasena`/`password` ya no debe existir en
  ningún documento de `usuarios` — las reglas de Firestore lo prohíben
  activamente en `create`/`update`.
- El rol de administrador se decide por `usuarios/{uid}.rol == "admin"`,
  no por una lista de emails en el código (la lista de emails se conserva
  solo como respaldo temporal en `AuthContext.jsx`).
