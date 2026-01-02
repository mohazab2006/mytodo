import { useMemo, useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskList from '../components/tasks/TaskList';

export default function TodayPage() {
  const [typeFilter, setTypeFilter] = useState<string>(''); // empty = all
  const { data: tasks = [], isLoading } = useTasks({
    dueRange: 'today',
    includeCompleted: false,
  });

  // Also get overdue tasks
  const { data: overdueTasks = [] } = useTasks({
    dueRange: 'overdue',
    includeCompleted: false,
  });

  if (isLoading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  const allTasks = [...overdueTasks, ...tasks];
  const availableTypes = useMemo(() => Array.from(new Set(allTasks.map((t) => t.type))), [allTasks]);
  const filtered = useMemo(() => {
    if (!typeFilter) return allTasks;
    return allTasks.filter((t) => t.type === typeFilter);
  }, [allTasks, typeFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Today</h1>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-md border border-border bg-muted/40 text-sm"
          title="Filter by type"
        >
          <option value="">All Types</option>
          {availableTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <TaskList tasks={filtered} />
    </div>
  );
}

