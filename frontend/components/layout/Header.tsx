/**
 * App header component with navigation and sign-out button.
 * Implements T030 from tasks.md
 */

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Button } from '@/components/ui/Button';

/**
 * Header component for desktop/tablet views.
 * Shows logo, navigation links, and sign-out button.
 * Hidden on mobile (< 768px) where MobileNav is used instead.
 */
export function Header() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 hidden md:block">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center">
            <Link href="/tasks" className="flex items-center space-x-2">
              <svg
                className="h-8 w-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <h1 className="text-xl font-bold text-gray-900">TaskFlow</h1>
            </Link>
          </div>

          {/* Navigation and user menu */}
          <div className="flex items-center space-x-4">
            <nav className="flex space-x-4" aria-label="Main navigation">
              <Link
                href="/tasks"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                My Tasks
              </Link>
            </nav>

            {/* User info and sign out */}
            {user && (
              <div className="flex items-center space-x-4 border-l border-gray-200 pl-4">
                <span className="text-sm text-gray-700">
                  {user.name || user.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  aria-label="Sign out"
                >
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
