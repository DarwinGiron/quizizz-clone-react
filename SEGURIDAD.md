# Seguridad — Capacitaciones

Este documento explica cómo publicar las reglas de seguridad y cómo migrar a
los supervisores existentes al nuevo esquema de autenticación real.

## 0. Antes de publicar cualquier regla: verifica tu rol de admin

Las reglas nuevas (`firestore.rules`) deciden quién es administrador leyendo
**dos lugares posibles**: el documento `roles/{tu-uid}` (fuente principal,
ver sección 6) y, como respaldo, el campo `rol` del documento
`usuarios/{tu-uid}`. **Si ninguno de los dos existe con `rol: "admin"`,
quedarás bloqueado de tu propia base de datos en cuanto publiques las
reglas.**

Pasos para verificar/corregir esto ANTES de publicar:

1. Entra a la app con tu cuenta de admin y anota tu UID (Firebase Console →
   Authentication → Users, busca tu email y copia el "User UID").
2. Firebase Console → Firestore Database → colección `usuarios` → busca el
   documento cuyo ID sea ese UID.
   - Si no existe, créalo con al menos: `{ rol: "admin", nombre: "Tu nombre" }`.
   - Si existe, agrega/edita el campo `rol` a `"admin"` si no lo tiene.
3. Además, crea (si no existe) el documento `roles/{tu-uid}` con
   `{ rol: "admin" }` — es el que las reglas nuevas leen primero.
4. Recién entonces continúa con el paso 1 de abajo.

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

## 5. Registro: solo por invitación

Ya no existe la ruta pública `/register` ni el autoregistro. Todas las
cuentas (admin, supervisor) se crean desde el panel de **Usuarios** por
un administrador. Esto cierra dos cosas a la vez:

- Nadie con la URL puede crear una cuenta y ver los datos internos de la
  empresa (antes, cualquier visitante podía registrarse y entrar al
  Dashboard, Capacitaciones, etc. — las rutas no filtran por rol salvo
  "Mis Asignaciones").
- Se corrigió una vulnerabilidad real: la regla de Firestore que permitía
  el autoregistro dejaba que una cuenta recién creada escribiera su
  propio documento `usuarios/{uid}` **con cualquier `rol`, incluido
  `"admin"`** — es decir, cualquiera podía autoasignarse admin. Ahora
  `create`/`update` en `usuarios` son exclusivos del admin.

### Si más adelante quieres que el registro sea público de nuevo

No es solo "restaurar la página". Haría falta, como mínimo:

1. Volver a crear una ruta de registro y decidir con qué rol nace esa
   cuenta (nunca dejar que el cliente lo elija — la regla de Firestore
   debe forzar `rol == "usuario"` sin importar lo que mande la app).
2. Revisar qué debe poder ver un usuario auto-registrado: hoy casi
   ninguna ruta filtra por rol (`PrivateRoute` solo restringe
   `/mis-asignaciones`), así que un `rol: "usuario"` público vería el
   mismo Dashboard/Capacitaciones/Asignaciones que un admin. Para un
   producto público real, cada ruta debería declarar qué roles pueden
   entrar.
3. Firebase permite deshabilitar registro por email/password a nivel de
   proyecto (Authentication → Sign-in method) — si el registro vuelve a
   estar cerrado, verifica que ese método siga habilitado (lo necesitas
   también para crear supervisores desde el admin), pero ninguna
   configuración de Firebase distingue "solo mi app puede registrar
   gente" de "cualquiera puede llamar a la API pública" — esa barrera
   siempre depende de las reglas de Firestore, no de ocultar el botón.

## 6. Sistema de roles y permisos (colección `roles`)

Hay 4 roles: `admin`, `capacitador`, `supervisor`, `usuario`. Cada ruta de
la app y cada regla de Firestore valida el rol antes de dejar entrar o
escribir. El modal "Nuevo miembro del equipo" (antes "Nuevo Supervisor")
ahora deja elegir entre supervisor y capacitador.

### Por qué existe una colección `roles` separada de `usuarios`

Las reglas de seguridad de Firestore **no pueden hacer queries** (no hay
forma de escribir "dame el documento cuyo campo `authUid` sea tal uid").
El admin tiene su perfil en `usuarios/{uid}` (mismo id que su uid de Auth,
por eso las reglas viejas funcionaban), pero los supervisores y
capacitadores tienen su perfil en un documento con un **ID aleatorio**
(el uid de Auth vive en el campo `authUid` dentro de ese doc). Sin una
query, las reglas no pueden resolver esa relación.

La solución: cada vez que se crea o migra una cuenta, la app también
escribe un documento espejo `roles/{authUid} → { rol }`. Las reglas leen
`roles/{request.auth.uid}` directamente (sin query) para decidir permisos.

### Migrar cuentas que ya tenían acceso seguro ANTES de este cambio

Si migraste supervisores con "Activar acceso seguro" (sección 3) **antes**
de que existiera la colección `roles`, sus reglas de Firestore no van a
reconocerlos como supervisores hasta que les crees el documento manualmente:

1. Firebase Console → Firestore Database → colección `usuarios` → busca
   el documento del supervisor → copia su campo `authUid`.
2. Colección `roles` (créala si no existe) → nuevo documento → como ID
   pega ese `authUid` → agrega el campo `rol` con el valor `"supervisor"`
   (o `"capacitador"` si aplica).
3. Repite para cada cuenta migrada antes de este cambio. Las cuentas
   creadas o migradas DESPUÉS de este cambio ya no necesitan este paso —
   la app lo hace sola.

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
- El registro es solo por invitación: no hay ruta pública de registro;
  toda cuenta se crea desde el panel de Usuarios por un admin.
- Nace el rol `capacitador` (crea evaluaciones, lanza sesiones en vivo,
  ve reportes) y cada ruta de la app + regla de Firestore valida el rol
  del usuario (antes solo `/mis-asignaciones` estaba protegida).
- Colección `roles/{authUid} → { rol }` como espejo legible por las
  reglas de Firestore (ver sección 6) — necesaria porque las reglas no
  pueden resolver "el doc de usuarios cuyo authUid coincide con mi uid".
