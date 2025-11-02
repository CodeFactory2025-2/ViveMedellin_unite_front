# Backend API Endpoints

Este documento describe los endpoints de la API del backend para la aplicación ViveMedellin.

## Autenticación y Usuarios

### 1. Registrar un nuevo usuario

- **Endpoint**: `register`
- **Descripción**: Registra un nuevo usuario en el sistema.
- **Método HTTP**: `POST`
- **Ruta**: `/api/auth/register`
- **Cuerpo de la Petición**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "Nombre de Usuario"
  }
  ```
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "string",
        "email": "string",
        "name": "string",
        "verified": false,
        "createdAt": "number"
      }
    }
  }
  ```

### 2. Verificar correo electrónico

- **Endpoint**: `verifyEmail`
- **Descripción**: Verifica el correo electrónico de un usuario utilizando un token de verificación.
- **Método HTTP**: `POST`
- **Ruta**: `/api/auth/verify-email`
- **Cuerpo de la Petición**:
  ```json
  {
    "email": "user@example.com",
    "token": "verification_token"
  }
  ```
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

### 3. Iniciar sesión

- **Endpoint**: `login`
- **Descripción**: Inicia sesión con las credenciales del usuario.
- **Método HTTP**: `POST`
- **Ruta**: `/api/auth/login`
- **Cuerpo de la Petición**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "auth_token",
      "user": {
        "id": "string",
        "email": "string",
        "name": "string",
        "verified": true,
        "createdAt": "number"
      }
    }
  }
  ```

### 4. Cerrar sesión

- **Endpoint**: `logout`
- **Descripción**: Cierra la sesión del usuario.
- **Método HTTP**: `POST`
- **Ruta**: `/api/auth/logout`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

### 5. Solicitar restablecimiento de contraseña

- **Endpoint**: `requestPasswordReset`
- **Descripción**: Inicia el proceso para restablecer la contraseña.
- **Método HTTP**: `POST`
- **Ruta**: `/api/auth/request-password-reset`
- **Cuerpo de la Petición**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

### 6. Restablecer contraseña

- **Endpoint**: `resetPassword`
- **Descripción**: Restablece la contraseña utilizando un token.
- **Método HTTP**: `POST`
- **Ruta**: `/api/auth/reset-password`
- **Cuerpo de la Petición**:
  ```json
  {
    "email": "user@example.com",
    "token": "reset_token",
    "newPassword": "new_password"
  }
  ```
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

### 7. Verificar sesión activa

- **Endpoint**: `checkAuth`
- **Descripción**: Verifica si el usuario tiene una sesión activa.
- **Método HTTP**: `GET`
- **Ruta**: `/api/auth/check`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "string",
        "email": "string",
        "name": "string",
        "verified": true,
        "createdAt": "number"
      }
    }
  }
  ```

### 8. Actualizar perfil de usuario

- **Endpoint**: `updateUserProfile`
- **Descripción**: Actualiza la información del perfil de un usuario.
- **Método HTTP**: `PUT`
- **Ruta**: `/api/users/{userId}`
- **Cuerpo de la Petición**:
  ```json
  {
    "name": "Nuevo Nombre"
  }
  ```
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "string",
        "email": "string",
        "name": "string",
        "verified": true,
        "createdAt": "number"
      }
    }
  }
  ```

### 9. Cambiar contraseña

- **Endpoint**: `changePassword`
- **Descripción**: Cambia la contraseña de un usuario autenticado.
- **Método HTTP**: `PUT`
- **Ruta**: `/api/users/{userId}/password`
- **Cuerpo de la Petición**:
  ```json
  {
    "currentPassword": "current_password",
    "newPassword": "new_password"
  }
  ```
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

## Grupos

### 1. Obtener todos los grupos

- **Endpoint**: `getAllGroups`
- **Descripción**: Obtiene la lista de todos los grupos a los que el usuario tiene acceso.
- **Método HTTP**: `GET`
- **Ruta**: `/api/groups`
- **Parámetros de Consulta**: `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      // Array de objetos Group
    ]
  }
  ```

### 2. Obtener un grupo por ID

- **Endpoint**: `getGroupById`
- **Descripción**: Obtiene los detalles de un grupo específico por su ID.
- **Método HTTP**: `GET`
- **Ruta**: `/api/groups/{groupId}`
- **Parámetros de Consulta**: `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto Group
    }
  }
  ```

### 3. Obtener un grupo por slug

- **Endpoint**: `getGroupBySlug`
- **Descripción**: Obtiene los detalles de un grupo específico por su slug.
- **Método HTTP**: `GET`
- **Ruta**: `/api/groups/slug/{slug}`
- **Parámetros de Consulta**: `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto Group
    }
  }
  ```

### 4. Crear un nuevo grupo

- **Endpoint**: `createGroup`
- **Descripción**: Crea un nuevo grupo.
- **Método HTTP**: `POST`
- **Ruta**: `/api/groups`
- **Cuerpo de la Petición**: `CreateGroupRequest`, `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto Group
    }
  }
  ```

### 5. Actualizar un grupo

- **Endpoint**: `updateGroup`
- **Descripción**: Actualiza un grupo existente.
- **Método HTTP**: `PUT`
- **Ruta**: `/api/groups/{groupId}`
- **Cuerpo de la Petición**: `UpdateGroupRequest`, `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto Group
    }
  }
  ```

### 6. Eliminar un grupo

- **Endpoint**: `deleteGroup`
- **Descripción**: Elimina un grupo.
- **Método HTTP**: `DELETE`
- **Ruta**: `/api/groups/{groupId}`
- **Cuerpo de la Petición**: `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

### 7. Unirse a un grupo

- **Endpoint**: `joinGroup`
- **Descripción**: Permite a un usuario unirse a un grupo.
- **Método HTTP**: `POST`
- **Ruta**: `/api/groups/{groupId}/join`
- **Cuerpo de la Petición**: `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto Group
    }
  }
  ```

### 8. Abandonar un grupo

- **Endpoint**: `leaveGroup`
- **Descripción**: Permite a un usuario abandonar un grupo.
- **Método HTTP**: `POST`
- **Ruta**: `/api/groups/{groupId}/leave`
- **Cuerpo de la Petición**: `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto Group
    }
  }
  ```

### 9. Obtener publicaciones de un grupo

- **Endpoint**: `getGroupPosts`
- **Descripción**: Obtiene todas las publicaciones de un grupo.
- **Método HTTP**: `GET`
- **Ruta**: `/api/groups/{groupId}/posts`
- **Parámetros de Consulta**: `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      // Array de objetos GroupPost
    ]
  }
  ```

### 10. Buscar en las publicaciones de un grupo

- **Endpoint**: `searchGroupPosts`
- **Descripción**: Busca en las publicaciones de un grupo.
- **Método HTTP**: `GET`
- **Ruta**: `/api/groups/{groupId}/posts/search`
- **Parámetros de Consulta**: `query`, `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      // Array de objetos GroupPost
    ]
  }
  ```

### 11. Crear una publicación en un grupo

- **Endpoint**: `createGroupPost`
- **Descripción**: Crea una nueva publicación en un grupo.
- **Método HTTP**: `POST`
- **Ruta**: `/api/groups/{groupId}/posts`
- **Cuerpo de la Petición**: `CreateGroupPostRequest`, `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto GroupPost
    }
  }
  ```

### 12. Añadir un comentario a una publicación

- **Endpoint**: `addCommentToPost`
- **Descripción**: Añade un comentario a una publicación.
- **Método HTTP**: `POST`
- **Ruta**: `/api/groups/{groupId}/posts/{postId}/comments`
- **Cuerpo de la Petición**: `CreateGroupPostCommentRequest`, `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto GroupPostComment
    }
  }
  ```

### 13. Eliminar una publicación de un grupo

- **Endpoint**: `deleteGroupPost`
- **Descripción**: Elimina una publicación de un grupo.
- **Método HTTP**: `DELETE`
- **Ruta**: `/api/groups/{groupId}/posts/{postId}`
- **Cuerpo de la Petición**: `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto GroupPost
    }
  }
  ```

### 14. Eliminar un comentario de una publicación

- **Endpoint**: `deletePostComment`
- **Descripción**: Elimina un comentario de una publicación.
- **Método HTTP**: `DELETE`
- **Ruta**: `/api/groups/{groupId}/posts/{postId}/comments/{commentId}`
- **Cuerpo de la Petición**: `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto GroupPostComment
    }
  }
  ```

### 15. Obtener resumen de actividad de grupos

- **Endpoint**: `getGroupActivitySummary`
- **Descripción**: Obtiene un resumen de la actividad de los grupos.
- **Método HTTP**: `GET`
- **Ruta**: `/api/groups/activity-summary`
- **Parámetros de Consulta**: `userId` (opcional)
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto GroupActivitySummary
    }
  }
  ```

### 16. Cambiar el rol de un usuario en un grupo

- **Endpoint**: `changeUserRole`
- **Descripción**: Cambia el rol de un miembro en un grupo.
- **Método HTTP**: `PUT`
- **Ruta**: `/api/groups/{groupId}/members/{targetUserId}/role`
- **Cuerpo de la Petición**: `newRole`, `currentUserId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto Group
    }
  }
  ```

### 17. Crear un evento en un grupo

- **Endpoint**: `createEvent`
- **Descripción**: Crea un nuevo evento en un grupo.
- **Método HTTP**: `POST`
- **Ruta**: `/api/groups/{groupId}/events`
- **Cuerpo de la Petición**: `eventData`, `userId`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true,
    "data": {
      // Objeto Event
    }
  }
  ```

## Notificaciones

### 1. Obtener notificaciones

- **Endpoint**: `getNotifications`
- **Descripción**: Obtiene las notificaciones del usuario.
- **Método HTTP**: `GET`
- **Ruta**: `/api/notifications`
- **Respuesta Exitosa (200 OK)**:
  ```json
  [
    // Array de objetos NotificationPayload
  ]
  ```

### 2. Marcar notificación como leída

- **Endpoint**: `markNotificationAsRead`
- **Descripción**: Marca una notificación como leída.
- **Método HTTP**: `PUT`
- **Ruta**: `/api/notifications/{notificationId}/read`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

### 3. Marcar todas las notificaciones como leídas

- **Endpoint**: `markAllNotificationsAsRead`
- **Descripción**: Marca todas las notificaciones como leídas.
- **Método HTTP**: `PUT`
- **Ruta**: `/api/notifications/read-all`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true
  }
  ```

### 4. Limpiar notificaciones

- **Endpoint**: `clearNotifications`
- **Descripción**: Elimina todas las notificaciones del usuario.
- **Método HTTP**: `DELETE`
- **Ruta**: `/api/notifications`
- **Respuesta Exitosa (200 OK)**:
  ```json
  {
    "success": true
  }
  ```