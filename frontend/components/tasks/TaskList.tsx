'use client';

/**
 * TaskList component - renders an array of tasks.
 */

import { Task } from '@/lib/types';
import { TaskItem } from './TaskItem';

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  // Empty state
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-600 text-lg">No tasks yet. Create your first task!</p>
      </div>
    );
  }

  // Task count display
  const completedCount = tasks.filter(t => t.completed).length;
  const incompleteCount = tasks.length - completedCount;

  return (
    <div className="space-y-4">
      {/* Task count */}
      <div className="text-sm text-gray-600">
        {tasks.length === 1 ? (
          <p>You have 1 task</p>
        ) : incompleteCount === 0 ? (
          <p>{completedCount} complete</p>
        ) : completedCount === 0 ? (
          <p>{incompleteCount} incomplete</p>
        ) : (
          <p>{incompleteCount} incomplete, {completedCount} complete</p>
        )}
      </div>

      {/* Task items */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
