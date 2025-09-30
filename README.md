# ViveMedellín – Front-End (Next.js)

Migración del front de la Feature 4 (Creación y Gestión de Grupos/Comunidades) a **Next.js 15** con Tailwind 4 y componentes shadcn/ui. Este paquete reemplaza la app Vite original y mantiene la misma lógica de autenticación mock, formularios y flujos de grupos.

## Requisitos

- Node.js 18.18+ (recomendado 20 LTS)
- npm (o pnpm/yarn/bun si prefieres). El proyecto usa npm por defecto.

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

Puedes limpiar los datos desde DevTools → Application → Local Storage.

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

Usuarios iniciales (puedes modificarlos en `initializeMockData`):

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

Proyecto académico – uso educativo (Scrum + Front-end).

Curso: Analisis y Diseño 2
Docente: Wilmer Alberto Moreno
Universidad de Antioquia
