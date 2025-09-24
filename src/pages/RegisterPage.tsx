import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, ArrowLeft, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  // Estado local para el formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Estado para errores de validación
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: '',
    form: ''
  });
  
  // Estado para el loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Función de validación
  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      email: '',
      password: '',
      confirmPassword: '',
      acceptTerms: '',
      form: ''
    };
    
    // Validar email
    if (!email) {
      newErrors.email = "El correo electrónico es obligatorio";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Correo electrónico inválido";
      isValid = false;
    }
    
    // Validar contraseña
    if (!password) {
      newErrors.password = "La contraseña es obligatoria";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
      isValid = false;
    }
    
    // Validar confirmación de contraseña
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirmar la contraseña es obligatorio";
      isValid = false;
    } else if (confirmPassword !== password) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
      isValid = false;
    }
    
    // Validar términos
    if (!acceptTerms) {
      newErrors.acceptTerms = "Debes aceptar los términos y condiciones";
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      const success = await register({ email, password });
      if (success) {
        toast({
          title: "Cuenta creada",
          description: "Tu cuenta ha sido creada exitosamente. Por favor verifica tu correo."
        });
        navigate('/login');
      }
    } catch (error) {
      setErrors({
        ...errors,
        form: "Ha ocurrido un error al registrar tu cuenta. Inténtalo de nuevo más tarde."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-primary">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Crear Cuenta
            </CardTitle>
            <CardDescription>
              Regístrate para formar parte de la comunidad de ViveMedellín
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="register-email" className="text-sm font-medium">
                  Correo electrónico
                </label>
                <input
                  id="register-email"
                  type="email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu.correo@ejemplo.com"
                  autoComplete="off"
                  required
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-password" className="text-sm font-medium">
                  Contraseña
                </label>
                <input
                  id="register-password"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña (mín. 6 caracteres)"
                  autoComplete="new-password"
                  required
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <label htmlFor="register-confirm-password" className="text-sm font-medium">
                  Confirmar contraseña
                </label>
                <input
                  id="register-confirm-password"
                  type="password"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmar contraseña"
                  autoComplete="off"
                  required
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                )}
              </div>
              
              <div className="flex items-start space-x-3">
                <input
                  id="register-terms"
                  type="checkbox"
                  className="h-4 w-4 mt-1 border border-input rounded"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <div>
                  <label htmlFor="register-terms" className="text-sm font-normal">
                    Acepto los <Link to="/terminos" className="text-primary underline">términos de uso</Link> y la <Link to="/privacidad" className="text-primary underline">política de privacidad</Link>
                  </label>
                  {errors.acceptTerms && (
                    <p className="text-sm text-destructive">{errors.acceptTerms}</p>
                  )}
                </div>
              </div>
              
              {errors.form && (
                <p className="text-sm text-destructive bg-destructive/10 p-2 rounded">{errors.form}</p>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:shadow-glow transition-all duration-300"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Registrando..." : "Crear cuenta"}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              variant="ghost" 
              className="w-full" 
              onClick={() => navigate('/login')}
              type="button"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </Button>
            
            <div className="text-center">
              <Link 
                to="/" 
                className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
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
    </div>
  );
};

export default RegisterPage;