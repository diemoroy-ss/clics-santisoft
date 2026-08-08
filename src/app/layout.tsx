import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clics | Protección Anti-Fraude de Clics',
  description:
    'Detecta y bloquea automáticamente el fraude de clics en tus campañas de Google Ads. Ahorra dinero en publicidad con Clics.',
  keywords:
    'fraude de clics, click fraud, google ads, protección publicidad, bot traffic',
  openGraph: {
    title:       'Clics | Protección Anti-Fraude de Clics',
    description: 'Protege tus campañas de Google Ads del fraude de clics en tiempo real.',
    type:        'website',
    url:         'https://clics.santisoft.cl',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
