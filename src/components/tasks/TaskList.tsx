import { useMemo } from 'react';
import type { TaskWithCourse } from '../../lib/types';
import { getTaskGroup, type TaskGroup } from '../../lib/dates';
import TaskRow from './TaskRow';

interface TaskListProps {
  tasks: TaskWithCourse[];
}

const groupLabels: Record<TaskGroup, string> = {
  overdue: 'Overdue',
  today: 'Today',
  thisWeek: 'This Week',
  later: 'Later',
};

export default function TaskList({ tasks }: TaskListProps) {
  const sortedTasks = useMemo(() => {
    const copy = [...tasks];
    copy.sort((a, b) => {
      const ad = a.due_at ? new Date(a.due_at).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.due_at ? new Date(b.due_at).getTime() : Number.POSITIVE_INFINITY;
      if (ad !== bd) return ad - bd;
      return a.title.localeCompare(b.title);
    });
    return copy;
  }, [tasks]);

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskGroup, TaskWithCourse[]> = {
      overdue: [],
      today: [],
      thisWeek: [],
      later: [],
    };

    sortedTasks.forEach((task) => {
      const group = getTaskGroup(task.due_at);
      groups[group].push(task);
    });

    return groups;
  }, [sortedTasks]);

  const groupOrder: TaskGroup[] = ['overdue', 'today', 'thisWeek', 'later'];

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No tasks found. Create one with “New Task”.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groupOrder.map((group) => {
        const groupTasks = groupedTasks[group];
        if (groupTasks.length === 0) return null;

        return (
          <div key={group}>
            <h2
              className={`text-lg font-semibold mb-3 ${
                group === 'overdue' ? 'text-red-500' : 'text-foreground'
              }`}
            >
              {groupLabels[group]} ({groupTasks.length})
            </h2>
            <div className="space-y-2">
              {groupTasks.map((task) => (
                <TaskRow key={task.id} task={task} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

