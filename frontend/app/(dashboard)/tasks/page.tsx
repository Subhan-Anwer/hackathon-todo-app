/**
 * Task list page - Server Component that fetches and displays tasks.
 */

import { fetchTasks } from '@/lib/api/tasks';
import { TaskList } from '@/components/tasks/TaskList';
import Link from 'next/link';

export default async function TasksPage() {
  // Fetch tasks on the server
  // In production with Better Auth, this would use server-side auth
  let tasks = [];
  let error = null;

  try {
    tasks = await fetchTasks();
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load tasks';
    console.error('Failed to fetch tasks:', err);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
        <Link
          href="/tasks/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          New Task
        </Link>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Task list */}
      {!error && <TaskList tasks={tasks} />}
    </div>
  );
}
