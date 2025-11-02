# Backend API Reference – ViveMedellín (HU-01 … HU-09)

> Versión inicial – Sprint 1 y Sprint 2.
>
> Esta guía describe los contratos que el front espera del backend para reemplazar los mocks de `src/lib/groups-api.ts` y `src/lib/api.ts`. Todos los ejemplos usan JSON con claves en `camelCase`.

## 1. Convenciones generales

| Tema | Detalle |
|------|---------|
| Base URL | `https://{host}/api/v1` |
| Formato | `Content-Type: application/json; charset=utf-8` |
| Autenticación | JWT en header `Authorization: Bearer <token>` |
| Fechas | Época Unix en milisegundos (`Date.now()` equivalente) |
| Identificadores | UUID (o string único) |
| Errores | JSON `{ "message": "Descripción" }` + código HTTP correspondiente |

**Respuesta de error estándar**

```json
{
  "message": "Descripción legible del problema",
  "code": "opcional-codigo-interno"
}
```

## 2. Resumen de endpoints

| HU | Método | Ruta | Descripción |
|----|--------|------|-------------|
| 01 | POST | `/auth/register` | Crear cuenta (email + contraseña) |
| 01 | POST | `/auth/login` | Iniciar sesión y obtener token |
| 01 | GET | `/auth/session` | Validar sesión antes de crear grupo |
| 02 | POST | `/groups` | Crear grupo |
| 03 | POST | `/groups/{groupId}/join` | Unirse a grupo público |
| 03 | POST | `/groups/{groupId}/requests` | Solicitar acceso a grupo privado |
| 07 | DELETE | `/groups/{groupId}` | Eliminar grupo |
| 08 | POST | `/groups/{groupId}/posts` | Crear publicación |
| 08 | DELETE | `/groups/{groupId}/posts/{postId}` | Eliminar publicación |
| 08 | POST | `/groups/{groupId}/posts/{postId}/comments` | Crear comentario |
| 08 | DELETE | `/groups/{groupId}/posts/{postId}/comments/{commentId}` | Eliminar comentario |
| 09 | GET | `/groups/{groupId}/posts?search={term}` | Buscar publicaciones |

> **Tip:** los nombres y estructuras reflejan lo que consumen los componentes en `src/app/grupos/[slug]/page.tsx` y los helpers en `src/lib/groups-api.ts`.

---

## 3. Sprint 1 – HU-01 / HU-02 / HU-03

### 3.0 POST `/auth/register`

Crea una cuenta nueva. El formulario actual solicita correo, contraseña y confirmación (la confirmación se valida en el front).

- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "usuario@example.com",
    "password": "123456"
  }
  ```
- **201 Created**
  ```json
  {
    "user": {
      "userId": "user-uuid",
      "email": "usuario@example.com",
      "createdAt": 1732149123456
    }
  }
  ```
- **Errores:**
  - `400 Bad Request` – correo inválido o contraseña corta.
  - `409 Conflict` – correo ya registrado.

**Notas**
- El front muestra un checkbox de aceptación de términos y valida la confirmación de contraseña antes de enviar.

### 3.1 POST `/auth/login`

Autentica a una usuaria y retorna el token JWT usado por los demás endpoints.

- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  {
    "email": "usuario@example.com",
    "password": "123456"
  }
  ```
- **200 OK**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "userId": "user-uuid",
      "email": "usuario@example.com",
      "roles": ["member"]
    }
  }
  ```
- **Errores:**
  - `400 Bad Request` – credenciales faltantes o inválidas.
  - `401 Unauthorized` – email/password incorrecto.

**Notas**
- El token debe firmarse con el secreto configurado en backend y expiración razonable.
- El front almacena el token (localStorage) y lo envía como `Authorization: Bearer <token>`.

---

### 3.2 GET `/auth/session`

Valida la sesión para habilitar `/grupos/crear`.

- **Headers:** `Authorization: Bearer <token>` (opcional; si falta, responde 401).
- **200 OK**
  ```json
  {
    "userId": "user-uuid",
    "email": "usuario@example.com",
    "roles": ["member", "admin"]
  }
  ```
- **Errores:** `401 Unauthorized` cuando no hay token o expiró.

**Feedback Front** – si 401 ⇒ redirección a `/login?from=/grupos/crear` con toast "Debes iniciar sesión para crear un grupo".

---

### 3.3 POST `/groups`

Crea un grupo público o privado.

- **Headers:** `Authorization: Bearer <token>`.
- **Body** (`CreateGroupRequest`)
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
    "imageUrl": "https://cdn.vivemedellin.com/groups/cover.png",
    "isPublic": true
  }
  ```
- **201 Created**
  ```json
  {
    "id": "group-uuid",
    "slug": "club-de-lectura-medellin",
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
    "imageUrl": "https://cdn.vivemedellin.com/groups/cover.png",
    "isPublic": true,
    "creatorId": "user-uuid",
    "createdAt": 1732149123456,
    "members": [
      { "userId": "user-uuid", "role": "admin", "joinedAt": 1732149123456 }
    ],
    "events": [],
    "posts": []
  }
  ```
- **Errores:** `400 Bad Request`, `401 Unauthorized`, `409 Conflict` (nombre duplicado).

**Feedback Front** – toast: `El grupo "{name}" se ha creado correctamente` y navegación a `/grupos/{slug}`.

---

### 3.4 POST `/groups/{groupId}/join`

Unirse a un grupo público.

- **Headers:** `Authorization: Bearer <token>`.
- **200 OK**
  ```json
  {
    "groupId": "group-uuid",
    "memberCount": 42,
    "members": [
      { "userId": "user-uuid", "role": "member", "joinedAt": 1732149123456 }
    ]
  }
  ```
- **Errores:** `401 Unauthorized`, `403 Forbidden` (grupo privado), `404 Not Found`, `409 Conflict` (ya es miembro).

**Feedback Front** – toast `Te has unido a "{group.name}"`; botón cambia a "Ya eres miembro".

---

### 3.5 POST `/groups/{groupId}/requests`

Solicitar acceso a un grupo privado.

- **Headers:** `Authorization: Bearer <token>`.
- **Body opcional:**
  ```json
  {
    "message": "Me gustaría participar en las actividades"
  }
  ```
- **201 Created**
  ```json
  {
    "requestId": "req-uuid",
    "groupId": "group-uuid",
    "userId": "user-uuid",
    "status": "PENDING",
    "requestedAt": 1732149123456
  }
  ```
- **Errores:** `401`, `404` (grupo no existe), `409` (solicitud ya registrada).

**Feedback Front** – toast `Solicitud enviada al administrador del grupo`.

---

## 4. Sprint 2 – HU-07 / HU-08 / HU-09

### 4.1 DELETE `/groups/{groupId}`

Elimina el grupo completo. Disponible para creadora o miembros con `role: "admin"`.

- **Headers:** `Authorization: Bearer <token>`.
- **204 No Content** – sin cuerpo.
- **Errores:** `401`, `403`, `404`, `409`.

**Feedback Front** – toast `Grupo eliminado` + redirección a `/grupos`. Debe completarse en <3 s.

---

### 4.2 POST `/groups/{groupId}/posts`

Crea una publicación con texto, link, imagen y/o archivo.

- **Headers:** `Authorization: Bearer <token>`.
- **Body:** al menos uno de `content`, `link`, `image`, `file`.
  ```json
  {
    "content": "¡Nos reunimos este miércoles!",
    "link": "https://ejemplo.com/agenda",
    "image": {
      "id": "temp-uuid",
      "name": "banner.png",
      "mimeType": "image/png",
      "size": 184532,
      "url": "https://storage.pre-signed-upload"
    },
    "file": {
      "id": "temp-uuid",
      "name": "programa.pdf",
      "mimeType": "application/pdf",
      "size": 281902,
      "url": "https://storage.pre-signed-upload"
    }
  }
  ```
- **201 Created**
  ```json
  {
    "id": "post-uuid",
    "groupId": "group-uuid",
    "authorId": "user-uuid",
    "authorName": "Usuario Demo",
    "content": "¡Nos reunimos este miércoles!",
    "link": "https://ejemplo.com/agenda",
    "image": {
      "id": "img-uuid",
      "name": "banner.png",
      "mimeType": "image/png",
      "size": 184532,
      "url": "https://cdn.vivemedellin.com/posts/img-uuid"
    },
    "file": {
      "id": "doc-uuid",
      "name": "programa.pdf",
      "mimeType": "application/pdf",
      "size": 281902,
      "url": "https://cdn.vivemedellin.com/posts/doc-uuid"
    },
    "createdAt": 1732149123456,
    "comments": []
  }
  ```
- **Errores comunes:** `400`, `401`, `403`, `404`, `413`.

**Feedback Front** – modal "¿Desea hacer esta publicación?" → al aceptar, toast `Tu publicación se ha compartido correctamente` y se agrega en <3 s.

---

### 4.3 DELETE `/groups/{groupId}/posts/{postId}`

Elimina una publicación (autora o admin).

- **204 No Content**
- **Errores:** `401`, `403`, `404`
- **Feedback:** toast `Publicación eliminada`.

---

### 4.4 POST `/groups/{groupId}/posts/{postId}/comments`

Crea un comentario.

- **Headers:** `Authorization: Bearer <token>`.
- **Body**
  ```json
  {
    "content": "¡Allí estaré!"
  }
  ```
- **201 Created**
  ```json
  {
    "id": "comment-uuid",
    "postId": "post-uuid",
    "authorId": "user-uuid",
    "authorName": "Usuario Demo",
    "content": "¡Allí estaré!",
    "createdAt": 1732149187654
  }
  ```
- **Errores:** `400/422`, `401`, `403`, `404`
- **Feedback:** toast `Comentario enviado`.

---

### 4.5 DELETE `/groups/{groupId}/posts/{postId}/comments/{commentId}`

Elimina un comentario (autora o admin).

- **204 No Content**
- **Errores:** `401`, `403`, `404`
- **Feedback:** toast `Comentario eliminado`.

---

### 4.6 GET `/groups/{groupId}/posts?search={term}`

Busca publicaciones por términos clave (contenido, autor, nombre de adjuntos). Ignora mayúsculas, minúsculas y acentos.

- **Headers:** `Authorization: Bearer <token>`.
- **Query params:** `search` (>=3 chars), opcional `limit` y `cursor`.
- **200 OK**
  ```json
  {
    "items": [
      {
        "id": "post-uuid",
        "groupId": "group-uuid",
        "authorId": "user-uuid",
        "authorName": "Usuario Demo",
        "content": "Festival de cine independiente",
        "link": null,
        "image": null,
        "file": null,
        "createdAt": 1732149123456,
        "comments": []
      }
    ],
    "total": 1,
    "tookMs": 95
  }
  ```
- **Errores:** `400/422`, `401`, `403`, `404`, `500`.

**Feedback Front** – si hay resultados, mensaje `Se encontraron X publicaciones`; si `items` vacío, mensaje `No se encontraron publicaciones que coincidan con tu búsqueda.` + botón “Limpiar filtros”.

> **Performance:** debe responder ≤5 s con hasta 1000 publicaciones.

---

## 5. Endpoints auxiliares sugeridos

No forman parte estricta de las HU, pero facilitan la integración:

- **POST** `/uploads/sign` – devuelve URL prefirmada para subir `image`/`file` antes de llamar a `/posts`.
- **GET/POST** `/notifications` – gestionar bandeja de notificaciones (`useNotifications`).
- **GET** `/groups` y **GET** `/groups/{slug}` – listados y detalle (requeridos por otras pantallas).

---

## 6. Referencias

- Front-end: `src/lib/groups-api.ts`, `src/lib/api.ts`, `src/app/grupos/[slug]/page.tsx`.
- Mock de notificaciones: `src/lib/notifications-api.ts`.
- Definición de roles/permisos: `GroupMember.role` (admin, moderator, member).

> **Coordinación:** cualquier cambio en los contratos debe comunicarse al equipo de Front para ajustar mocks y pruebas.
