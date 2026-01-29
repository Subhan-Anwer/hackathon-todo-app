/**
 * New task page - form for creating a new task.
 */

import { TaskForm } from '@/components/tasks/TaskForm';
import Link from 'next/link';

export default function NewTaskPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/tasks"
          className="text-sm text-blue-600 hover:text-blue-800 mb-2 inline-block"
        >
          ← Back to tasks
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
      </div>

      {/* Task form */}
      <TaskForm mode="create" />
    </div>
  );
}
