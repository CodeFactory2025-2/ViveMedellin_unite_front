import React from 'react';

interface SkipToContentProps {
  targetId?: string;
}

export const SkipToContent: React.FC<SkipToContentProps> = ({ targetId = 'main-content' }) => (
  <a
    href={`#${targetId}`}
    className="absolute left-4 top-2 z-50 -translate-y-full transform rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-0 pointer-events-none transition focus-visible:translate-y-0 focus-visible:opacity-100 focus-visible:pointer-events-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
  >
    Saltar al contenido principal
  </a>
);

export default SkipToContent;
