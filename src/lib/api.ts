// src/lib/api.ts
// Simulación de API para autenticación y gestión de usuarios

// Tipos
export interface User {
  id: string;
  email: string;
  password: string; // En producción nunca almacenar contraseñas en texto plano
  name?: string;
  verified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: number;
  createdAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Simulación de base de datos
const USERS_KEY = "vive-medellin-users";
const TOKEN_KEY = "vive-medellin-auth-token";
const isBrowser = typeof window !== "undefined";

// Utilidades
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const generateToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const getUsers = (): User[] => {
  if (!isBrowser) {
    return [];
  }

  const users = window.localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

const saveUsers = (users: User[]): void => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

const delay = (ms: number = 800): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// API Endpoints simulados

/**
 * Registra un nuevo usuario
 */
export const register = async (credentials: RegisterCredentials): Promise<ApiResponse<{user: Omit<User, 'password'>}>> => {
  await delay(); // Simular latencia de red
  
  const users = getUsers();
  const existingUser = users.find(u => u.email.toLowerCase() === credentials.email.toLowerCase());
  
  if (existingUser) {
    return {
      success: false,
      error: 'Este correo electrónico ya está registrado'
    };
  }
  
  const verificationToken = generateToken();
  
  const newUser: User = {
    id: generateId(),
    email: credentials.email,
    password: credentials.password, // En producción deberías usar bcrypt o similar
    name: credentials.name || '',
    verified: true, // Cambiado a true para entorno de desarrollo
    verificationToken,
    createdAt: Date.now()
  };
  
  users.push(newUser);
  saveUsers(users);
  
  // Simulamos envío de correo de verificación
  console.log(`[API] Correo de verificación enviado a ${credentials.email} con token: ${verificationToken}`);
  
  const { password: _password, ...userWithoutPassword } = newUser;
  void _password;
  
  return {
    success: true,
    data: { user: userWithoutPassword }
  };
};

/**
 * Verifica el correo electrónico de un usuario usando el token
 */
export const verifyEmail = async (email: string, token: string): Promise<ApiResponse<null>> => {
  await delay();
  
  const users = getUsers();
  const userIndex = users.findIndex(u => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.verificationToken === token
  );
  
  if (userIndex === -1) {
    return {
      success: false,
      error: 'Token de verificación inválido o expirado'
    };
  }
  
  users[userIndex].verified = true;
  users[userIndex].verificationToken = undefined;
  
  saveUsers(users);
  
  return {
    success: true
  };
};

/**
 * Inicia sesión con credenciales de usuario
 */
export const login = async (credentials: LoginCredentials): Promise<ApiResponse<{
  token: string, 
  user: Omit<User, 'password' | 'verificationToken' | 'resetPasswordToken' | 'resetPasswordExpires'>
}>> => {
  await delay();
  
  const users = getUsers();
  const user = users.find(u => 
    u.email.toLowerCase() === credentials.email.toLowerCase() && 
    u.password === credentials.password
  );
  
  if (!user) {
    return {
      success: false,
      error: 'Credenciales incorrectas'
    };
  }
  
  // Opcional: Verificar si el usuario ha verificado su correo
  if (!user.verified) {
    return {
      success: false,
      error: 'Por favor verifica tu correo electrónico antes de iniciar sesión'
    };
  }
  
  const token = generateToken();

  if (isBrowser) {
    window.localStorage.setItem(TOKEN_KEY, token);
  }

  const {
    password: _password,
    verificationToken: _verificationToken,
    resetPasswordToken: _resetPasswordToken,
    resetPasswordExpires: _resetPasswordExpires,
    ...userWithoutSensitiveInfo
  } = user;
  void _password;
  void _verificationToken;
  void _resetPasswordToken;
  void _resetPasswordExpires;
  
  return {
    success: true,
    data: {
      token,
      user: userWithoutSensitiveInfo
    }
  };
};

/**
 * Cierra la sesión del usuario
 */
export const logout = async (): Promise<ApiResponse<null>> => {
  await delay();
  if (isBrowser) {
    window.localStorage.removeItem(TOKEN_KEY);
    window.sessionStorage.removeItem(TOKEN_KEY);
  }
  
  return {
    success: true
  };
};

/**
 * Solicita un restablecimiento de contraseña
 */
export const requestPasswordReset = async (email: string): Promise<ApiResponse<null>> => {
  await delay();
  
  const users = getUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (userIndex === -1) {
    // Por seguridad, no revelamos si el correo existe o no
    return {
      success: true
    };
  }
  
  const resetToken = generateToken();
  users[userIndex].resetPasswordToken = resetToken;
  users[userIndex].resetPasswordExpires = Date.now() + 3600000; // 1 hora
  
  saveUsers(users);
  
  // Simulamos envío de correo de restablecimiento
  console.log(`[API] Correo de restablecimiento enviado a ${email} con token: ${resetToken}`);
  
  return {
    success: true
  };
};

/**
 * Restablece la contraseña con el token de restablecimiento
 */
export const resetPassword = async (email: string, token: string, newPassword: string): Promise<ApiResponse<null>> => {
  await delay();
  
  const users = getUsers();
  const userIndex = users.findIndex(u => 
    u.email.toLowerCase() === email.toLowerCase() && 
    u.resetPasswordToken === token && 
    u.resetPasswordExpires && u.resetPasswordExpires > Date.now()
  );
  
  if (userIndex === -1) {
    return {
      success: false,
      error: 'Token inválido o expirado'
    };
  }
  
  users[userIndex].password = newPassword;
  users[userIndex].resetPasswordToken = undefined;
  users[userIndex].resetPasswordExpires = undefined;
  
  saveUsers(users);
  
  return {
    success: true
  };
};

/**
 * Verifica si hay una sesión activa
 */
export const checkAuth = async (): Promise<ApiResponse<{
  user: Omit<User, 'password' | 'verificationToken' | 'resetPasswordToken' | 'resetPasswordExpires'>
}>> => {
  await delay();
  
  if (!isBrowser) {
    return {
      success: false,
      error: 'No autenticado'
    };
  }

  const token = window.localStorage.getItem(TOKEN_KEY) || window.sessionStorage.getItem(TOKEN_KEY);
  
  if (!token) {
    return {
      success: false,
      error: 'No autenticado'
    };
  }
  
  // En una API real, verificaríamos el token con el servidor
  // Aquí simulamos que el token es válido y devolvemos el usuario desde localStorage
  
  const storedUser = window.localStorage.getItem('vive-medellin-user') || window.sessionStorage.getItem('vive-medellin-user');
  
  if (!storedUser) {
    return {
      success: false,
      error: 'Usuario no encontrado'
    };
  }
  
  const user = JSON.parse(storedUser);
  
  return {
    success: true,
    data: {
      user
    }
  };
};

/**
 * Actualiza la información del usuario
 */
export const updateUserProfile = async (userId: string, updates: Partial<Omit<User, 'id' | 'email' | 'password'>>): Promise<ApiResponse<{
  user: Omit<User, 'password' | 'verificationToken' | 'resetPasswordToken' | 'resetPasswordExpires'>
}>> => {
  await delay();
  
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return {
      success: false,
      error: 'Usuario no encontrado'
    };
  }
  
  // Actualizar campos permitidos
  const sanitizedUpdates = Object.fromEntries(
    Object.entries(updates).filter(([, value]) => value !== undefined)
  ) as Partial<(typeof users)[number]>;

  users[userIndex] = {
    ...users[userIndex],
    ...sanitizedUpdates,
  };
  
  saveUsers(users);
  
  const {
    password: _updatedPassword,
    verificationToken: _updatedVerificationToken,
    resetPasswordToken: _updatedResetToken,
    resetPasswordExpires: _updatedResetExpires,
    ...userWithoutSensitiveInfo
  } = users[userIndex];
  void _updatedPassword;
  void _updatedVerificationToken;
  void _updatedResetToken;
  void _updatedResetExpires;
  
  return {
    success: true,
    data: {
      user: userWithoutSensitiveInfo
    }
  };
};

/**
 * Cambia la contraseña de un usuario autenticado
 */
export const changePassword = async (userId: string, currentPassword: string, newPassword: string): Promise<ApiResponse<null>> => {
  await delay();
  
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === userId && u.password === currentPassword);
  
  if (userIndex === -1) {
    return {
      success: false,
      error: 'Contraseña actual incorrecta'
    };
  }
  
  users[userIndex].password = newPassword;
  saveUsers(users);
  
  return {
    success: true
  };
};

// Función para inicializar datos de prueba
export const initializeMockData = (): void => {
  if (!isBrowser) {
    return;
  }

  const existingUsers = getUsers();
  
  if (existingUsers.length === 0) {
    const users: User[] = [
      {
        id: '1',
        email: 'usuario@example.com',
        password: '123456',
        name: 'Usuario Demo',
        verified: true,
        createdAt: Date.now() - 86400000 // 1 día atrás
      },
      {
        id: '2',
        email: 'admin@example.com',
        password: 'admin123',
        name: 'Administrador',
        verified: true,
        createdAt: Date.now() - 172800000 // 2 días atrás
      }
    ];
    
    saveUsers(users);
    console.log('[API] Datos de prueba inicializados');
  }
};

/**
 * Marca un usuario como verificado (solo para desarrollo)
 */
export const verifyUserManually = async (email: string): Promise<ApiResponse<null>> => {
  await delay();
  
  if (!isBrowser) {
    return {
      success: false,
      error: 'Operación no disponible en este entorno'
    };
  }

  const users = getUsers();
  const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (userIndex === -1) {
    return {
      success: false,
      error: 'Usuario no encontrado'
    };
  }
  
  users[userIndex].verified = true;
  users[userIndex].verificationToken = undefined;
  
  saveUsers(users);
  
  return {
    success: true
  };
};

// Inicializar datos de prueba
initializeMockData();
