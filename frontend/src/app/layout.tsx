import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import MaintenanceGate from '@/components/MaintenanceGate';

const figtree = Figtree({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-figtree',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'MundulCare - Hospital & Doctor Appointment Management',
  description: 'Book and manage doctor appointments easily with MundulCare',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${figtree.variable}`} suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col antialiased bg-slate-50/50 text-slate-800 font-sans selection:bg-[#aa5588] selection:text-white"
        suppressHydrationWarning
      >
        <AuthProvider>
          <MaintenanceGate>{children}</MaintenanceGate>
        </AuthProvider>
      </body>
    </html>
  );
}
