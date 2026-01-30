/**
 * Dashboard layout with Header and MobileNav.
 * Implements T032, T045 from tasks.md
 */

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Desktop/Tablet Header */}
        <Header />

        {/* Mobile Navigation */}
        <MobileNav />

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </ErrorBoundary>
  );
}
