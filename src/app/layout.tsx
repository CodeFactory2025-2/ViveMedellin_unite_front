import "./globals.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProviders } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as UiToaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "ViveMedellín",
  description:
    "Plataforma para descubrir actividades locales y crear comunidades en Medellín.",
  openGraph: {
    title: "ViveMedellín",
    description: "Explora eventos, únete a grupos y participa en la vida cultural de la ciudad.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ViveMedellín",
    description: "Explora actividades y grupos comunitarios en Medellín.",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <AppProviders>
          {children}
          <UiToaster />
          <Toaster richColors position="top-center" />
        </AppProviders>
      </body>
    </html>
  );
}
