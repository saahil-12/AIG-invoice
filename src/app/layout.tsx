import type { Metadata } from 'next';
import { Rajdhani, Inter } from 'next/font/google';
import './globals.css';

const rajdhani = Rajdhani({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-rajdhani-var',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter-var',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aim Infinite Gaming — Invoice Generator',
  description: 'Invoice generator for Aim Infinite Gaming — rentals and sales of gaming equipment.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${rajdhani.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
