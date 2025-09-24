import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

const TestInputPage = () => {
  const [testInput, setTestInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Valor ingresado: ${testInput}`);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Prueba de Inputs</h1>
      
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Prueba de Input Simple</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-input">Ingrese texto aquí</Label>
              <Input
                id="test-input"
                type="text"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="Escriba algo aquí"
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="test-input-native">Input nativo (para comparación)</Label>
              <input
                id="test-input-native"
                type="text"
                placeholder="Input HTML nativo"
                className="w-full p-2 border rounded"
              />
            </div>
            
            <Button type="submit" className="w-full">
              Enviar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestInputPage;