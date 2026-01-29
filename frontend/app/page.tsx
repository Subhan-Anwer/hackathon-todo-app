/**
 * Home page - redirects to tasks.
 */

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Hackathon Todo App
        </h1>
        <p className="text-gray-600 mb-8">
          Multi-user task management application with secure authentication.
        </p>
        <Link
          href="/tasks"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          Go to Tasks
        </Link>
      </div>
    </div>
  );
}
