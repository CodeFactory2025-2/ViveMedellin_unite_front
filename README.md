# ViveMedellín – Feature 4 (Front-end)

Proyecto académico desarrollado para practicar metodología Scrum. Nuestro squad actuó como equipo Front y se enfocó en la Feature 4: Creación y Gestión de Grupos/Comunidades de la plataforma “ViveMedellín”.

### Objetivo General del Proyecto

Construir una plataforma inteligente que permita a los usuarios descubrir y participar en actividades en Medellín, favoreciendo la interacción social, la personalización y el acceso a información relevante.

### Alcance Feature 4

Funcionalidades entregadas en este sprint:

- Crear grupos públicos/privados (formularios con validaciones y persistencia en mock API).
- Explorar grupos públicos y grupos propios, con filtros y búsqueda.
- Detalle del grupo con acciones de unión/desunión y feedback.
- Unirse a grupos públicos (diálogo de confirmación, estados de carga/error, toasts accesibles).
- Accesibilidad AA: foco controlado, skip links, toast aria-live, inputs etiquetados.
- Persistencia mock usando localStorage.

### Historias y tareas comprometidas

1. HU-01 Validar acceso para crear grupo
Guard, redirección a /login?from=..., toast de acceso restringido, foco en título.
2. HU-02 Crear un grupo
Formulario con react-hook-form + zod, checklist de reglas, toast de éxito/error, integración mock createGroup.
3. HU-03 Unirse a grupo público
Card con botón “Unirse”, diálogo de confirmación, cambios de estado, integración joinGroup.

Las evidencias (GIFs/capturas) y la planeación de sprint se documentaron en Jira (ID AB#… según backlog del curso).

### Tecnologías

- React 18 + Vite
- TypeScript
- shadcn/ui + Tailwind CSS (componentes adaptados a la guía de UI)
- react-hook-form + zod
- tanstack/react-query para data-fetching mock
- Context API (useAuth) para autenticación simulada
- lucide-react para iconografía

### Scripts

npm install        # instalar dependencias
npm run dev        # modo desarrollo (Vite)
npm run lint       # eslint con reglas del equipo
npm run build      # build de producción
npm run preview    # servir el build localmente

### Estructura relevante

- src/pages
  - HomePage, LoginPage, RegisterPage, CreateGroupPage, ExploreGroupsPage, GroupDetailPage, DebugPage, etc.
- src/components
  - ProtectedRoute, SkipToContent, componentes UI (button, card, alert-dialog, etc.).
- src/hooks/useAuth.tsx
  - Contexto de autenticación mock (login, register, logout, pending redirects).
- src/lib/api.ts, src/lib/groups-api.ts
  - Endpoints simulados con persistencia en localStorage.
  - initializeMockGroupsData() contiene los grupos demo (Amigos del Parque Arví, Voluntarios El Poblado, etc.).Puedes modificar imageUrl (URLs públicas) o mover imágenes estáticas al directorio public/.

### Mock Data y Reset

- Usuarios y grupos se inicializan en initializeMockData() / initializeMockGroupsData().
- Para regenerar datos: abrir DevTools → Application/Storage → eliminar vive-medellin-* o usar /debug → botón “Borrar todo el almacenamiento”.

### Accesibilidad y UX

- Checklist AA del A11Y Project.
- Skip link (Saltar al contenido), foco programático en /login, toasts con aria-live.
- Formularios con etiquetas, aria-describedby, estados de carga y error visibles.
- Botones de navegación (“Volver al inicio”) y estados vacíos en /grupos.

### Credenciales Demo

Los usuarios mock se almacenan en localStorage. Durante las pruebas se utilizaron correos como:

- usuario@example.com / 123456
- admin@example.com / 123456
(Ver initializeMockData para actualizaciones).

### Metodología

- Sprint basado en historias y tareas de Jira.
- Daily, Review y Retrospective documentadas en el repositorio de evidencias del curso.
- Definición Ready/Done, DoR/DoD alineadas con el Product Owner académico.

### Equipo

- Front-end (Feature 4):
- Integración en GitHub Classroom
- Docente:

### Licencia / Uso Académico

Proyecto académico sin fines comerciales. Uso exclusivo para aprendizaje de Scrum y desarrollo Front-end.