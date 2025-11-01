# ViveMedellín – Front-End (Next.js)

Migración del front de la Feature 4 (Creación y Gestión de Grupos/Comunidades) a **Next.js 15** con Tailwind 4 y componentes shadcn/ui. Este paquete reemplaza la app Vite original y mantiene la misma lógica de autenticación mock, formularios y flujos de grupos.

## Requisitos

- Node.js 18.18+ (recomendado 20 LTS)
- npm (o pnpm/yarn/bun). El proyecto usa npm por defecto.

## Scripts principales

```bash
npm install         # instala dependencias
npm run dev         # modo desarrollo (Next + Turbopack)
npx next build      # build de producción (usa bundler estable)
npm run build       # build rápido con --turbopack (puede requerir macOS permissions)
npm run lint        # eslint
npm start           # servir el build (tras npx next build)
```

> **Tip:** Si el build con `npm run build` falla por restricciones del SO, ejecuta `npx next build` que usa el bundler estable.

## Rutas clave

- `/` – landing “ViveMedellín”.
- `/login` – formulario de inicio de sesión (detecta `?from=` para toasts accesibles).
- `/register` – registro de usuarias.
- `/grupos` – exploración de grupos públicos/propios.
- `/grupos/crear` – formulario protegido para crear grupos.
- `/grupos/[slug]` – detalle del grupo (join público, estados de miembro/admin).
- `/test-api` – demo de la API mock (registro/login rápido y vista de usuarios en `localStorage`).

## Mock de autenticación

Los usuarios se guardan en `localStorage` bajo las llaves `vive-medellin-users` y `vive-medellin-auth-token`. Al iniciar la app se cargan usuarios y grupos de ejemplo desde:

- `src/lib/api.ts` → `initializeMockData()`
- `src/lib/groups-api.ts` → `initializeMockGroupsData()`

Se pueden limpiar los datos desde DevTools → Application → Local Storage.

## Componentes y utilidades

- `src/hooks/useAuth.tsx` – contexto client component para login, register, logout y redirecciones pendientes.
- `src/components/require-auth.tsx` – guard (client) que redirige a `/login?from=...` cuando no hay sesión.
- `src/components/ui/*` – componentes shadcn/ui migrados (button, card, form, toast, etc.).
- `src/app/globals.css` – paleta y utilidades (`bg-gradient-primary`, `bg-gradient-hero`, etc.).

## Accesibilidad y UX

- Skip link reutilizable (`<SkipToContent />`).
- Toasters con aria-live (`useToast`) y variante `sonner` para notificaciones globales.
- Foco programático en `/login`, estados de carga (`Loader2`) y mensajes de error con `aria-describedby`.

## Datos demo

Usuarios iniciales (se pueden modificar en `initializeMockData`):

```
usuario@example.com / 123456
admin@example.com   / admin123
```

## Notas de migración

- Las páginas React Router originales se mapearon a rutas App Router (`app/`).
- El flujo `/test-api` del proyecto Vite se reimplementó en `app/test-api/page.tsx` para facilitar pruebas manuales.

## Próximos pasos sugeridos

- Integrar autenticación real o persistencia remota cuando esté listo el backend.
- Migrar cualquier utilitario pendiente del repo original (p. ej., páginas de debug adicionales).
- Ajustar ESLint/Prettier si el equipo adopta nuevas convenciones.


Curso: Analisis y Diseño 2
Docente: Wilmer Alberto Moreno
Universidad de Antioquia

## Integración Backend (Sprint 1)

Endpoints iniciales que el front consume para HU-01, HU-02 y HU-03. Todos usan JSON con claves en `camelCase`.

### HU-01 · Validar acceso a creación de grupo

- **GET** `/api/v1/auth/session`
  - *Headers:* `Authorization: Bearer <token>` (opcional; si falta, responde 401).
  - *Body:* ninguno.
  - *Respuesta 200:* información básica de la sesión.
    ```json
    {
      "userId": "user-uuid",
      "email": "usuario@example.com",
      "roles": ["member"]
    }
    ```
  - *Errores:* `401 {"message":"No autorizado"}` cuando no hay token o expiró.
  - *Feedback front:* redirección a `/login?from=/grupos/crear` y toast "Debes iniciar sesión para crear un grupo".

### HU-02 · Crear grupo

- **POST** `/api/v1/groups`
  - *Headers:* `Authorization: Bearer <token>`, `Content-Type: application/json`.
  - *Body:* siguiendo `CreateGroupRequest`.
    ```json
    {
      "name": "Club de Lectura Medellín",
      "description": "Nos reunimos cada miércoles",
      "category": "Cultura",
      "theme": "Literatura contemporánea",
      "participationRules": "Respetar turnos de palabra",
      "location": {
        "latitude": 6.2442,
        "longitude": -75.5812,
        "address": "Biblioteca Pública Piloto"
      },
      "imageUrl": "https://cdn.../banner.png",
      "isPublic": true
    }
    ```
  - *Respuesta 201:* grupo completo con `id`, `slug`, `creatorId`, `createdAt`, `members`, `events`, `posts`.
  - *Errores:* `400` (validaciones), `401` (token), `409` (nombre duplicado).
  - *Feedback front:* toast "El grupo "{name}" se ha creado correctamente" y navegación a `/grupos/{slug}`.

### HU-03 · Unirse / solicitar ingreso a un grupo

- **POST** `/api/v1/groups/{groupId}/join` (grupos públicos) – sin body, responde 200 con el grupo actualizado. Errores `401`, `403` (si es privado), `404`, `409` (ya es miembro). Feedback: "Te has unido a "{group.name}"".
- **POST** `/api/v1/groups/{groupId}/requests` (grupos privados) – body opcional `{ "message": "Quiero participar" }`. Respuesta 201 con solicitud (`requestId`, `status: "PENDING"`). Errores `401`, `404`, `409` (solicitud existente). Feedback: "Solicitud enviada al administrador del grupo".

Para ver los campos exactos que espera el front, revisar `src/lib/groups-api.ts` (interfaces `Group`, `GroupMember`, `GroupSummary`).

## Integración Backend (Sprint 2)

Los siguientes contratos permiten reemplazar los mocks de `src/lib/groups-api.ts`. Todos los endpoints usan JSON con claves en `camelCase` y requieren un token JWT en el header `Authorization: Bearer <token>`.

### HU-07 · Eliminar grupo

- **DELETE** `/api/v1/groups/{groupId}`
  - *Body:* ninguno.
  - *Respuesta 204:* sin cuerpo.
  - *Errores:*
    - `401 {"message":"No autorizado"}`
    - `403 {"message":"No tienes permisos para eliminar este grupo"}`
    - `404 {"message":"Grupo no encontrado"}`
    - `409 {"message":"No se pudo eliminar el grupo"}`
  - *Feedback front:* toast "Grupo eliminado" y redirección a `/grupos`.
  - *Side effect sugerido:* notificación `group:deleted` para las personas miembro.

### HU-08 · Publicar contenido

- **POST** `/api/v1/groups/{groupId}/posts`
  - *Body:*
    ```json
    {
      "content": "Texto opcional",
      "link": "https://ejemplo.com",
      "image": {
        "id": "tmp-id",
        "name": "banner.png",
        "mimeType": "image/png",
        "size": 184532,
        "url": "https://storage/pre-signed-upload"
      },
      "file": {
        "id": "tmp-id",
        "name": "programa.pdf",
        "mimeType": "application/pdf",
        "size": 281902,
        "url": "https://storage/pre-signed-upload"
      }
    }
    ```
    Al menos uno de `content`, `link`, `image`, `file`. Validaciones: texto ≤1000; imagen JPG/PNG/JPEG ≤5 MB; archivo PDF/DOCX ≤10 MB; URL válida.
  - *Respuesta 201:* publicación completa con `id`, `createdAt`, `comments: []`.
  - *Errores frecuentes:* `400` (validación), `403` (no miembro), `404` (grupo), `413` (archivo grande).
  - *Feedback front:* toast "Tu publicación se ha compartido correctamente" y visualización instantánea.

- **DELETE** `/api/v1/groups/{groupId}/posts/{postId}` → `204` sin cuerpo. Errores `401/403/404`. Feedback: "Publicación eliminada".
- **POST** `/api/v1/groups/{groupId}/posts/{postId}/comments` → crea comentario (`201`). Feedback: "Comentario enviado".
- **DELETE** `/api/v1/groups/{groupId}/posts/{postId}/comments/{commentId}` → `204`. Feedback: "Comentario eliminado".

### HU-09 · Buscar publicaciones

- **GET** `/api/v1/groups/{groupId}/posts?search={term}`
  - *Query:* `search` (≥3 caracteres), opcional `limit` y `cursor`.
  - *Respuesta 200:* 
    ```json
    {
      "items": [ { "id": "post-uuid", "content": "...", "comments": [] } ],
      "total": 1,
      "tookMs": 120
    }
    ```
  - *Errores:* `400/422` (query insuficiente), `403` (grupo privado sin permiso), `404` (grupo), `500` (error técnico).
  - *Feedback front:* si hay resultados se muestra "Se encontraron X publicaciones"; si `items` vacío, diálogo "No se encontraron publicaciones que coincidan" + botón "Limpiar filtros".

> **Ejemplo de headers:**
> ```http
> Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
> Content-Type: application/json
> ```

Para más contexto revisar `src/lib/groups-api.ts`, donde se mockean las mismas estructuras que esperamos recibir desde el backend real.
