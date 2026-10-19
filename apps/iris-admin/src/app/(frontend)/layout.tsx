import React from 'react';

export const metadata = {
  title: 'Iris / Homio Admin',
  description: 'Multi-tenant administration panel powered by PayloadCMS',
};

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>{children}</body>
    </html>
  );
}
