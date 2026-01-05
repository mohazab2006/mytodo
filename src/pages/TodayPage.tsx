import { useMemo, useState, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskList from '../components/tasks/TaskList';
import { ensureRecurringInstances } from '../services/recurrence';

export default function TodayPage() {
  const [typeFilter, setTypeFilter] = useState<string>(''); // empty = all
  
  useEffect(() => {
    // Ensure recurring instances are generated when opening Today view
    ensureRecurringInstances(90).catch(console.error);
  }, []);

  const { data: tasks = [], isLoading } = useTasks({
    dueRange: 'today',
    includeCompleted: false,
  });

  // Also get overdue tasks
  const { data: overdueTasks = [] } = useTasks({
    dueRange: 'overdue',
    includeCompleted: false,
  });

  const allTasks = useMemo(() => [...overdueTasks, ...tasks], [overdueTasks, tasks]);
  const availableTypes = useMemo(
    () => Array.from(new Set(allTasks.map((t) => t.type).filter(Boolean) as string[])),
    [allTasks]
  );
  const filtered = useMemo(() => {
    if (!typeFilter) return allTasks;
    return allTasks.filter((t) => t.type === typeFilter);
  }, [allTasks, typeFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Today</h1>
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
      {isLoading ? <div className="text-muted-foreground">Loading...</div> : <TaskList tasks={filtered} />}
    </div>
  );
}

