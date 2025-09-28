"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-subtle px-4 text-center">
      <div>
        <h1 className="text-4xl font-bold">Página no encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          No pudimos encontrar la ruta solicitada. Revisa la URL o regresa al inicio.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
