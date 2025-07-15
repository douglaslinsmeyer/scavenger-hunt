import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scavenger Hunt Admin',
  description: 'Manage and organize scavenger hunts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}