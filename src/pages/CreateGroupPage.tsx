import { zodResolver } from "@hookform/resolvers/zod";
import { FieldErrors, useForm } from "react-hook-form";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import * as groupsApi from "@/lib/groups-api";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, ArrowLeft, Plus, Loader2 } from "lucide-react";
import SkipToContent from "@/components/SkipToContent";

// 1. Esquema de Validación con Zod
const groupFormSchema = z
  .object({
    name: z
      .string()
      .min(3, "El nombre debe tener al menos 3 caracteres.")
      .max(60, "El nombre no puede exceder los 60 caracteres."),
    description: z
      .string()
      .max(5000, "La descripción no puede exceder los 5000 caracteres.")
      .optional(),
    topic: z.enum([
      "arte",
      "cultura",
      "deporte",
      "medio ambiente",
      "idiomas",
      "educacion",
      "otro",
    ]),
    otherTopic: z
      .string()
      .max(20, "El tema no puede exceder los 20 caracteres.")
      .optional(),
    rules: z.array(z.string()).refine((value) => value.length === 6, {
      message: "Debes aceptar todas las reglas de participación.",
    }),
    privacy: z.enum(["publico", "privado"], {
      error: "Debes seleccionar un tipo de privacidad.",
    }),
  })
  .refine(
    (data) => {
      if (data.topic === "otro") {
        return data.otherTopic && data.otherTopic.length > 0;
      }
      return true;
    },
    {
      message: "Si seleccionas 'Otro', debes especificar el tema.",
      path: ["otherTopic"],
    }
  );

type GroupFormValues = z.infer<typeof groupFormSchema>;

// Array con las reglas para el checklist
const participationRules = [
    { id: "no-violencia", label: "No se permiten comentarios violentos, agresivos, ni discriminación." },
    { id: "no-material-ofensivo", label: "No publicar material ofensivo, violento, sexual explícito o que incite al odio." },
    { id: "aportes-relacionados", label: "Los aportes deben estar relacionados con el tema del grupo." },
    { id: "no-compartir-info", label: "No compartir información personal de otros miembros sin su consentimiento." },
    { id: "no-difundir-datos", label: "No difundir datos exclusivos del grupo en otra plataforma." },
    { id: "participar-activamente", label: "Participar activamente en proyectos, discusiones y eventos del grupo." },
];

export function CreateGroupPage() {
  const { logout, user } = useAuth();
  const navigate = useNavigate(); // Hook para la redirección

  // 2. Definición del formulario
  const form = useForm<GroupFormValues>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      name: "",
      description: "",
      topic: "arte",
      otherTopic: "",
      privacy: "publico",
      rules: [],
    },
  });

  const watchedTopic = form.watch("topic");

  // Función para manejar errores de validación
  const onValidationErrors = (errors: FieldErrors<GroupFormValues>) => {
    console.log("Errores de validación detectados:", errors);

    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      const errorElement = document.querySelector<HTMLElement>(`[name="${firstErrorKey}"]`);
      errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    const collectMessages = (fieldErrors: FieldErrors<GroupFormValues>): string[] => {
      return Object.values(fieldErrors).flatMap((error) => {
        if (!error) {
          return [];
        }

        if ('message' in error && error.message) {
          return [String(error.message)];
        }

        if (typeof error === 'object') {
          return collectMessages(error as FieldErrors<GroupFormValues>);
        }

        return [];
      });
    };

    const errorMessages = collectMessages(errors);

    if (errorMessages.length > 0) {
      toast({
        title: "Por favor, corrige los errores",
        description: (
          <ul className="list-disc list-inside">
            {errorMessages.map((message, index) => (
              <li key={`${message}-${index}`} className="text-sm">
                {message}
              </li>
            ))}
          </ul>
        ),
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  // 3. Función de envío
  async function onSubmit(values: GroupFormValues) {
    try {
      // Verificar que todas las reglas estén aceptadas
      if (values.rules.length !== participationRules.length) {
        toast({
          title: "Reglas de participación",
          description: "Debes aceptar todas las reglas de participación para crear el grupo.",
          variant: "destructive",
        });
        return;
      }
      
      if (!user?.id) {
        toast({
          title: "Error de autenticación",
          description: "Debes iniciar sesión para crear un grupo.",
          variant: "destructive",
        });
        return;
      }
      
      // Formatear las reglas para guardarlas como texto
      const formattedRules = values.rules.map(ruleId => {
        const rule = participationRules.find(r => r.id === ruleId);
        return rule?.label || '';
      }).join('\n\n');
      
      // Preparar datos para la API
      const createGroupData = {
        name: values.name,
        description: values.description || '',
        category: values.topic === 'otro' ? values.otherTopic || 'Otro' : values.topic,
        participationRules: formattedRules,
        theme: values.topic === 'otro' ? values.otherTopic : values.topic,
        isPublic: values.privacy === 'publico'
      };
      
      // Llamar a la API para crear el grupo
      const response = await groupsApi.createGroup(createGroupData, user.id);
      
      if (response.success && response.data) {
        toast({
          title: "¡Grupo Creado! ✅",
          description: `El grupo "${values.name}" se ha creado correctamente.`,
        });
        
        // Redirigimos al usuario a la página del grupo recién creado con los datos
        setTimeout(() => {
          navigate(`/grupos/${response.data.slug}`, {
            state: {
              newGroupData: {
                ...values,
                id: response.data.id,
                slug: response.data.slug,
                createdAt: new Date().toISOString(),
                memberCount: response.data.members.length,
                creator: {
                  id: user.id,
                  name: user.name || "Usuario",
                  email: user.email,
                },
                isPublic: response.data.isPublic,
              },
            },
          });
        }, 600);
      } else {
        if (response.status === 409) {
          form.setError('name', {
            type: 'manual',
            message: response.error || 'Ya existe un grupo con ese nombre.',
          });
          toast({
            title: 'Nombre en uso',
            description: response.error || 'Ya existe un grupo con ese nombre.',
            variant: 'destructive',
          });
          return;
        }

        throw new Error(response.error || "No se pudo crear el grupo.");
      }
    } catch (error) {
      toast({
        title: "Error al crear el grupo ❌",
        description: error instanceof Error ? error.message : "Hubo un error técnico.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <SkipToContent />
      {/* Barra de Navegación */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              ViveMedellín
            </span>
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Inicio
            </Link>
            <Button variant="outline" onClick={logout} size="sm">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main id="main-content" className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-primary">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold">Crear Nuevo Grupo</CardTitle>
              <CardDescription>
                Forma una comunidad y conecta con personas que comparten tus intereses
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit, onValidationErrors)} className="space-y-8">
                  
                  {/* CAMPO NOMBRE */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Grupo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: Senderistas de Medellín" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CAMPO DESCRIPCIÓN */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cuéntanos sobre tu grupo, qué actividades realizarán y qué tipo de personas buscas..."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CAMPO PRIVACIDAD */}
                  <FormField
                    control={form.control}
                    name="privacy"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Privacidad del Grupo</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="publico" /></FormControl>
                              <FormLabel className="font-normal">Público - Cualquiera puede encontrar y unirse al grupo.</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="privado" /></FormControl>
                              <FormLabel className="font-normal">Privado - Solo miembros invitados pueden unirse.</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CAMPO TEMA */}
                  <FormField
                    control={form.control}
                    name="topic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tema del Grupo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Selecciona un tema para tu grupo" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="arte">Arte</SelectItem>
                            <SelectItem value="cultura">Cultura</SelectItem>
                            <SelectItem value="deporte">Deporte</SelectItem>
                            <SelectItem value="medio ambiente">Medio Ambiente</SelectItem>
                            <SelectItem value="idiomas">Idiomas</SelectItem>
                            <SelectItem value="educacion">Educación</SelectItem>
                            <SelectItem value="otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* CAMPO CONDICIONAL "OTRO TEMA" */}
                  {watchedTopic === 'otro' && (
                    <FormField
                      control={form.control}
                      name="otherTopic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Especifica el Tema</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Cocina Vegana" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* CAMPO REGLAS */}
                  <FormField
                    control={form.control}
                    name="rules"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">Reglas de Participación</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Debes aceptar todas las reglas para poder crear el grupo.
                          </p>
                        </div>
                        {participationRules.map((rule) => (
                          <FormField
                            key={rule.id}
                            control={form.control}
                            name="rules"
                            render={({ field }) => (
                              <FormItem key={rule.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(rule.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), rule.id])
                                        : field.onChange(field.value?.filter((value) => value !== rule.id));
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">{rule.label}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                        <FormMessage />
                        
                        {/* --- MENSAJE DE ERROR PARA EL CHECKLIST --- */}
                        {form.formState.errors.rules && (
                          <div className="bg-destructive/10 p-3 rounded-md mt-2 border border-destructive">
                            <p className="text-sm font-medium text-destructive flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                              </svg>
                              {form.formState.errors.rules.message}
                            </p>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />

                  {/* Alerta si no se han aceptado todas las reglas */}
                  {form.getValues("rules").length !== participationRules.length && (
                    <div className="bg-amber-50 p-3 rounded-md border border-amber-200 mb-4">
                      <p className="text-sm text-amber-700 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                          <line x1="12" y1="9" x2="12" y2="13"></line>
                          <line x1="12" y1="17" x2="12.01" y2="17"></line>
                        </svg>
                        Debes aceptar todas las reglas de participación antes de crear el grupo.
                      </p>
                    </div>
                  )}
                
                  <Button 
                    type="submit" 
                    disabled={form.formState.isSubmitting} 
                    className="w-full" 
                    size="lg"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      "Crear Grupo"
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default CreateGroupPage;
