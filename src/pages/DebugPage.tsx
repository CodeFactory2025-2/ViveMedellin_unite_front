import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const debugStyles = {
  container: "border border-gray-300 rounded-md p-4 mt-6",
  title: "text-lg font-semibold mb-2",
  content: "whitespace-pre-wrap bg-gray-100 p-2 rounded",
  button: "bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm mt-2"
};

interface DebugPanelProps {
  title: string;
  data: unknown;
  actions?: { label: string; onClick: () => void }[];
}

const DebugPanel: React.FC<DebugPanelProps> = ({ title, data, actions }) => {
  return (
    <div className={debugStyles.container}>
      <h3 className={debugStyles.title}>{title}</h3>
      <pre className={debugStyles.content}>
        {typeof data === 'object' && data !== null ? JSON.stringify(data, null, 2) : String(data)}
      </pre>
      {actions && (
        <div className="flex gap-2 mt-2">
          {actions.map((action, idx) => (
            <button 
              key={idx} 
              onClick={action.onClick} 
              className={debugStyles.button}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DebugPage = () => {
  const auth = useAuth();
  const [localStorageContent, setLocalStorageContent] = useState<Record<string, unknown>>({});
  const [sessionStorageContent, setSessionStorageContent] = useState<Record<string, unknown>>({});
  const [isInputsEnabled, setIsInputsEnabled] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);
  
  // Función para leer el almacenamiento y actualizar el estado
  const refreshStorage = useCallback(() => {
    const localItems: Record<string, unknown> = {};
    const sessionItems: Record<string, unknown> = {};
    
    // Leer localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          // Intentar parsear como JSON
          localItems[key] = JSON.parse(localStorage.getItem(key) || 'null');
        } catch {
          // Si no es JSON válido, almacenar como cadena
          localItems[key] = localStorage.getItem(key);
        }
      }
    }
    
    // Leer sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        try {
          sessionItems[key] = JSON.parse(sessionStorage.getItem(key) || 'null');
        } catch {
          sessionItems[key] = sessionStorage.getItem(key);
        }
      }
    }
    
    setLocalStorageContent(localItems);
    setSessionStorageContent(sessionItems);
  }, []);
  
  // Cargar datos al montar el componente
  useEffect(() => {
    refreshStorage();
  }, [refreshStorage]);
  
  // Acciones para el almacenamiento
  const clearStorage = () => {
    if (confirm('¿Estás seguro de que quieres borrar todo el localStorage y sessionStorage?')) {
      localStorage.clear();
      sessionStorage.clear();
      refreshStorage();
      toast({ 
        title: 'Almacenamiento borrado', 
        description: 'Se ha borrado todo el contenido de localStorage y sessionStorage' 
      });
    }
  };
  
  // Probar inputs
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ 
      title: 'Formulario enviado', 
      description: `Valor del input: "${inputValue}", Checkbox: ${checkboxValue ? 'marcado' : 'no marcado'}` 
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Página de Depuración</h1>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Información de autenticación */}
        <DebugPanel 
          title="Estado de Autenticación" 
          data={{ 
            isAuthenticated: auth.isAuthenticated,
            user: auth.user,
            pendingRedirect: auth.pendingRedirect
          }}
          actions={[
            { 
              label: 'Cerrar Sesión', 
              onClick: () => {
                auth.logout();
                refreshStorage();
                toast({ title: 'Sesión cerrada' });
              }
            }
          ]}
        />
        
        {/* Formulario de prueba de inputs */}
        <div className="border border-gray-300 rounded-md p-4">
          <h3 className="text-lg font-semibold mb-2">Prueba de Inputs</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="test-text" className="text-sm font-medium">
                Campo de texto
              </label>
              <input
                id="test-text"
                type="text"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={!isInputsEnabled}
                placeholder="Escribe algo aquí"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="test-checkbox" 
                checked={checkboxValue} 
                onCheckedChange={(checked) => setCheckboxValue(checked === true)} 
                disabled={!isInputsEnabled}
              />
              <label htmlFor="test-checkbox" className="text-sm font-medium">
                Checkbox de prueba
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="enable-inputs" 
                checked={isInputsEnabled} 
                onCheckedChange={(checked) => setIsInputsEnabled(checked === true)} 
              />
              <label htmlFor="enable-inputs" className="text-sm font-medium">
                Habilitar inputs
              </label>
            </div>
            
            <div className="flex space-x-2">
              <Button type="submit" disabled={!isInputsEnabled}>
                Enviar
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setInputValue('');
                  setCheckboxValue(false);
                }}
              >
                Limpiar
              </Button>
            </div>
          </form>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* localStorage */}
        <DebugPanel 
          title="localStorage" 
          data={localStorageContent}
          actions={[
            { label: 'Actualizar', onClick: refreshStorage }
          ]}
        />
        
        {/* sessionStorage */}
        <DebugPanel 
          title="sessionStorage" 
          data={sessionStorageContent}
          actions={[
            { label: 'Actualizar', onClick: refreshStorage }
          ]}
        />
      </div>
      
      <div className="mt-6">
        <Button 
          variant="destructive"
          onClick={clearStorage}
        >
          Borrar todo el almacenamiento
        </Button>
      </div>
    </div>
  );
};

export default DebugPage;
