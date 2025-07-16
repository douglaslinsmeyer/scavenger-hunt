import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Scavenger Hunt Player',
  description: 'Join and play scavenger hunts',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}