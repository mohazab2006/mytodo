import { useMemo, useState, useEffect } from 'react';
import { useTasks } from '../hooks/useTasks';
import TaskList from '../components/tasks/TaskList';
import { ensureRecurringInstances } from '../services/recurrence';

export default function UpcomingPage() {
  const [typeFilter, setTypeFilter] = useState<string>(''); // empty = all
  
  useEffect(() => {
    // Ensure recurring instances are generated when opening Upcoming view
    ensureRecurringInstances(90).catch(console.error);
  }, []);

  const { data: tasks = [], isLoading } = useTasks({
    dueRange: '7days',
    includeCompleted: false,
  });

  const availableTypes = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.type).filter(Boolean) as string[])),
    [tasks]
  );
  const filtered = useMemo(() => {
    if (!typeFilter) return tasks;
    return tasks.filter((t) => t.type === typeFilter);
  }, [tasks, typeFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold">Upcoming</h1>
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

