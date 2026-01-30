/**
 * New task page - form for creating a new task.
 * Implements T035 from tasks.md
 */

'use client';

import { useRouter } from 'next/navigation';
import { TaskForm } from '@/components/tasks/TaskForm';
import { taskApi } from '@/lib/api/tasks';

export default function NewTaskPage() {
  const router = useRouter();

  const handleSubmit = async (data: { title: string; description: string }) => {
    await taskApi.create({
      title: data.title,
      description: data.description,
    });

    router.push('/tasks');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Create New Task</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <TaskForm mode="create" onSubmit={handleSubmit} submitLabel="Create Task" />
      </div>
    </div>
  );
}
