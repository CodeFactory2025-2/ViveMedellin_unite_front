import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LogIn, ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import SkipToContent from '@/components/SkipToContent';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// Definición de los esquemas de validación
const loginSchema = z.object({
  email: z.string()
    .email({ message: "Correo electrónico inválido" })
    .min(1, { message: "El correo electrónico es obligatorio" }),
  password: z.string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .min(1, { message: "La contraseña es obligatoria" }),
  rememberMe: z.boolean().optional(),
});

const registerSchema = z.object({
  email: z.string()
    .email({ message: "Correo electrónico inválido" })
    .min(1, { message: "El correo electrónico es obligatorio" }),
  password: z.string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .min(1, { message: "La contraseña es obligatoria" }),
  confirmPassword: z.string()
    .min(1, { message: "Confirmar la contraseña es obligatorio" }),
  acceptTerms: z.boolean()
    .refine(val => val === true, { message: "Debes aceptar los términos y condiciones" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Esquema para el formulario de recuperación de contraseña
const forgotPasswordSchema = z.object({
  email: z.string()
    .email({ message: "Correo electrónico inválido" })
    .min(1, { message: "El correo electrónico es obligatorio" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

const LoginPage = () => {
  const { login, register, resetPassword } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario de login
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  // Formulario de registro
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });
  
  // Formulario de recuperación de contraseña
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  useEffect(() => {
    const fromPath = searchParams.get('from');

    if (fromPath) {
      toast({
        title: "Acceso Restringido",
        description: "Debes iniciar sesión para acceder a esa página.",
        variant: "destructive",
      });
    }

    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [searchParams, toast]);

  const handleLogin = async (values: LoginFormValues) => {
    setIsSubmitting(true);
    try {
      // Pasamos el estado de "recordarme" al método de login
      await login(
        { email: values.email, password: values.password }, 
        values.rememberMe
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      const success = await register({ email: values.email, password: values.password });
      if (success) {
        setIsRegistering(false);
        registerForm.reset();
        loginForm.setValue("email", values.email);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      const success = await resetPassword(values.email);
      if (success) {
        setIsForgotPassword(false);
        forgotPasswordForm.reset();
        loginForm.setValue("email", values.email);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = (mode: 'login' | 'register' | 'forgotPassword') => {
    setIsRegistering(mode === 'register');
    setIsForgotPassword(mode === 'forgotPassword');
  };

  return (
    <>
      <SkipToContent />
      <main id="main-content" className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4" role="main">
        <div className="w-full max-w-md">
          <Card className="shadow-primary">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4" aria-hidden="true">
              {isRegistering ? <UserPlus className="h-8 w-8 text-white" /> : 
               isForgotPassword ? <ArrowLeft className="h-8 w-8 text-white" /> : 
               <LogIn className="h-8 w-8 text-white" />}
            </div>
            <CardTitle ref={headingRef} tabIndex={-1} className="text-2xl font-bold outline-none">
              {isRegistering ? "Crear Cuenta" : 
               isForgotPassword ? "Recuperar Contraseña" : 
               "Iniciar Sesión"}
            </CardTitle>
            <CardDescription>
              {isRegistering 
                ? "Regístrate para formar parte de la comunidad de ViveMedellín" 
                : isForgotPassword
                  ? "Introduce tu correo para recuperar tu cuenta"
                  : "Accede a tu cuenta de ViveMedellín para continuar"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {isRegistering ? (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="register-email">Correo electrónico</FormLabel>
                        <FormControl>
                          <Input 
                            id="register-email"
                            type="email" 
                            placeholder="tu.correo@ejemplo.com" 
                            aria-required="true"
                            autoComplete="email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage aria-live="polite" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="register-password">Contraseña</FormLabel>
                        <FormControl>
                          <Input 
                            id="register-password"
                            type="password" 
                            placeholder="Contraseña (mín. 6 caracteres)" 
                            aria-required="true"
                            autoComplete="new-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage aria-live="polite" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="register-confirm-password">Confirmar contraseña</FormLabel>
                        <FormControl>
                          <Input 
                            id="register-confirm-password"
                            type="password" 
                            placeholder="Confirmar contraseña" 
                            aria-required="true"
                            autoComplete="new-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage aria-live="polite" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="acceptTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            id="register-terms"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            aria-required="true"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel htmlFor="register-terms" className="font-normal">
                            Acepto los <Link to="/terminos" className="text-primary underline">términos de uso</Link> y la <Link to="/privacidad" className="text-primary underline">política de privacidad</Link>
                          </FormLabel>
                          <FormMessage aria-live="polite" />
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                    size="lg"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Registrando...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>Crear cuenta</span>
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            ) : isForgotPassword ? (
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="recovery-email">Correo electrónico</FormLabel>
                        <FormControl>
                          <Input 
                            id="recovery-email"
                            type="email" 
                            placeholder="tu.correo@ejemplo.com" 
                            aria-required="true"
                            autoComplete="email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage aria-live="polite" />
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                    size="lg"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Recuperar contraseña</span>
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="login-email">Correo electrónico</FormLabel>
                        <FormControl>
                          <Input 
                            id="login-email"
                            type="email" 
                            placeholder="tu.correo@ejemplo.com" 
                            aria-required="true"
                            autoComplete="email"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage aria-live="polite" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel htmlFor="login-password">Contraseña</FormLabel>
                          <Button 
                            variant="link" 
                            type="button" 
                            className="px-0 text-sm h-auto font-normal"
                            onClick={() => toggleMode('forgotPassword')}
                          >
                            ¿Olvidaste tu contraseña?
                          </Button>
                        </div>
                        <FormControl>
                          <Input 
                            id="login-password"
                            type="password" 
                            placeholder="Contraseña" 
                            aria-required="true"
                            autoComplete="current-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage aria-live="polite" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="rememberMe"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            id="remember-me"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel htmlFor="remember-me" className="font-normal cursor-pointer">
                          Recordarme
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                    size="lg"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        <span>Iniciando...</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                        <span>Iniciar sesión</span>
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            {!isForgotPassword ? (
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => {
                  if (isRegistering) {
                    toggleMode('login');
                  } else {
                    // Redirigir a la nueva página de registro en lugar de alternar el modo
                    window.location.href = '/register';
                  }
                }}
                type="button"
              >
                {isRegistering
                  ? "¿Ya tienes cuenta? Inicia sesión"
                  : "¿No tienes cuenta? Regístrate"
                }
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                className="w-full" 
                onClick={() => toggleMode('login')}
                type="button"
              >
                Volver a iniciar sesión
              </Button>
            )}
            
            <div className="text-center">
              <Link 
                to="/" 
                className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                Volver al inicio
              </Link>
            </div>
            
            <div className="text-xs text-center text-muted-foreground mt-4">
              <p>
                Al utilizar este sitio, aceptas nuestros {" "}
                <Link to="/terminos" className="underline hover:text-primary">
                  Términos de uso
                </Link>{" "}
                y{" "}
                <Link to="/privacidad" className="underline hover:text-primary">
                  Política de Privacidad
                </Link>
              </p>
              <p className="mt-1">
                © 2025 ViveMedellín. Todos los derechos reservados.
              </p>
            </div>
          </CardFooter>
          </Card>
        </div>
      </main>
    </>
  );
};

export default LoginPage;
