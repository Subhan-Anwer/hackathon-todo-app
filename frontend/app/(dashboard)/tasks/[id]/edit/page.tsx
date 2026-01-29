/**
 * Edit task page - form for updating an existing task.
 */

import { fetchTasks } from '@/lib/api/tasks';
import { TaskForm } from '@/components/tasks/TaskForm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface EditTaskPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const { id } = await params;
  const taskId = parseInt(id, 10);

  if (isNaN(taskId)) {
    notFound();
  }

  // Fetch all tasks and find the one to edit
  // In a real app, we'd have a getTaskById endpoint
  let task;
  try {
    const tasks = await fetchTasks();
    task = tasks.find((t) => t.id === taskId);

    if (!task) {
      notFound();
    }
  } catch (error) {
    console.error('Failed to fetch task:', error);
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Failed to load task. Please try again.
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold text-gray-900">Edit Task</h1>
      </div>

      {/* Task form */}
      <TaskForm mode="edit" task={task} />
    </div>
  );
}
